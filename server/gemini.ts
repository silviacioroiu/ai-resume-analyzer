/**
 * Google Gemini integration: structured resume analysis and follow-up chat.
 *
 * The prompt builders and response parser are pure functions so they can be
 * unit-tested without calling the API.
 */
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type ResponseSchema,
} from "@google/generative-ai";
import { z } from "zod";
import { ENV } from "./_core/env";

export const analysisResultSchema = z.object({
  matchScore: z.number(),
  summary: z.string().min(1),
  strengths: z.string().min(1),
  weaknesses: z.string().min(1),
  suggestions: z.string().min(1),
  language: z.string().min(2),
});

export type ResumeAnalysisResult = z.infer<typeof analysisResultSchema>;

/** JSON schema Gemini must follow (enforced via responseSchema). */
const geminiResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    matchScore: {
      type: SchemaType.INTEGER,
      description:
        "Integer 0-100. With a job description: how well the resume fits it. Without one: overall resume quality.",
    },
    summary: {
      type: SchemaType.STRING,
      description: "Two-sentence verdict explaining the score.",
    },
    strengths: {
      type: SchemaType.STRING,
      description: "Markdown bullet list of strong points.",
    },
    weaknesses: {
      type: SchemaType.STRING,
      description:
        "Markdown bullet list of vague phrases, gaps, or missing requirements.",
    },
    suggestions: {
      type: SchemaType.STRING,
      description:
        "Markdown bullet list of concrete rewrites and improvements.",
    },
    language: {
      type: SchemaType.STRING,
      description: "Resume language code: en or ro.",
    },
  },
  required: [
    "matchScore",
    "summary",
    "strengths",
    "weaknesses",
    "suggestions",
    "language",
  ],
};

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert technical recruiter and career advisor helping students improve their CVs.
Analyse the resume and return JSON only.

Scoring rubric for matchScore (integer 0-100):
- With a job description: weigh required skills covered (50%), relevant experience and projects (30%), clarity and measurable impact (20%).
- Without a job description: weigh clarity and measurable impact (40%), structure and formatting (30%), relevance of skills and experience for an early-career tech role (30%).
- 90+ only for an exceptional fit; 50 means roughly half of what is needed is present.

Write strengths, weaknesses and suggestions as Markdown bullet lists. Quote the resume's own phrases when pointing out weak wording.
Resumes may be in English or Romanian; answer in the resume's language.`;

export function buildAnalysisPrompt(
  resumeText: string,
  jobDescription?: string
): string {
  const parts = [`RESUME:\n${resumeText.trim()}`];
  if (jobDescription?.trim()) {
    parts.push(`JOB DESCRIPTION:\n${jobDescription.trim()}`);
  } else {
    parts.push(
      "No job description was provided: score overall resume quality."
    );
  }
  return parts.join("\n\n");
}

/** Validates the model's JSON and clamps the score into 0–100. */
export function parseAnalysisResponse(raw: string): ResumeAnalysisResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const parsed = analysisResultSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("AI response did not match the expected structure");
  }

  const score = Math.round(Math.min(100, Math.max(0, parsed.data.matchScore)));
  return {
    ...parsed.data,
    matchScore: score,
    language: parsed.data.language.toLowerCase(),
  };
}

/** A function that sends a prompt to the model and returns its text. Injectable for tests. */
export type TextGenerator = (prompt: string) => Promise<string>;

function getClient(): GoogleGenerativeAI {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(ENV.geminiApiKey);
}

const requestOptions = () =>
  ENV.geminiBaseUrl ? { baseUrl: ENV.geminiBaseUrl } : undefined;

const defaultAnalysisGenerator: TextGenerator = async prompt => {
  const model = getClient().getGenerativeModel(
    {
      model: ENV.geminiModel,
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
        temperature: 0.2,
      },
    },
    requestOptions()
  );
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export async function analyzeResume(
  resumeText: string,
  jobDescription?: string,
  generate: TextGenerator = defaultAnalysisGenerator
): Promise<ResumeAnalysisResult> {
  if (!resumeText.trim()) {
    throw new Error("Resume text is empty");
  }
  const raw = await generate(buildAnalysisPrompt(resumeText, jobDescription));
  return parseAnalysisResponse(raw);
}

// ---------------------------------------------------------------------------
// Follow-up chat
// ---------------------------------------------------------------------------

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface AnalysisContext {
  resumeText: string;
  jobDescription: string | null;
  matchScore: number | null;
  summary: string | null;
  strengths: string;
  weaknesses: string;
  suggestions: string;
}

export function buildChatSystemPrompt(ctx: AnalysisContext): string {
  return `You are a friendly career advisor. The user has just received an AI analysis of their resume and wants to ask follow-up questions.
Ground every answer in the resume and analysis below. Be concise and concrete; when suggesting rewrites, show the rewritten bullet.
If a question is unrelated to their resume, job search or career, politely steer back.

RESUME:
${ctx.resumeText}

JOB DESCRIPTION:
${ctx.jobDescription ?? "(none provided)"}

ANALYSIS:
Score: ${ctx.matchScore ?? "n/a"}/100
Summary: ${ctx.summary ?? ""}
Strengths:
${ctx.strengths}
Weaknesses:
${ctx.weaknesses}
Suggestions:
${ctx.suggestions}`;
}

/** Maps chat history to Gemini's format (assistant -> model). History must start with a user turn. */
export function toGeminiHistory(messages: ChatMessage[]): Content[] {
  const firstUser = messages.findIndex(m => m.role === "user");
  if (firstUser === -1) return [];
  return messages.slice(firstUser).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function chatAboutAnalysis(
  ctx: AnalysisContext,
  messages: ChatMessage[]
): Promise<string> {
  const last = messages.at(-1);
  if (!last || last.role !== "user") {
    throw new Error("The last chat message must come from the user");
  }

  const model = getClient().getGenerativeModel(
    {
      model: ENV.geminiModel,
      systemInstruction: buildChatSystemPrompt(ctx),
      generationConfig: { temperature: 0.5 },
    },
    requestOptions()
  );

  const chat = model.startChat({
    history: toGeminiHistory(messages.slice(0, -1)),
  });
  const result = await chat.sendMessage(last.content);
  return result.response.text();
}
