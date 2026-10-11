import { describe, expect, it, vi } from "vitest";
import {
  analyzeResume,
  buildAnalysisPrompt,
  buildChatSystemPrompt,
  parseAnalysisResponse,
  toGeminiHistory,
} from "./gemini";

const validResponse = {
  matchScore: 72,
  summary: "Solid fit with a few gaps.",
  strengths: "- Strong C++",
  weaknesses: "- No cloud experience",
  suggestions: "- Add metrics",
  language: "EN",
};

describe("parseAnalysisResponse", () => {
  it("parses valid JSON and normalises the language code", () => {
    const result = parseAnalysisResponse(JSON.stringify(validResponse));
    expect(result.matchScore).toBe(72);
    expect(result.language).toBe("en");
  });

  it("strips Markdown code fences", () => {
    const raw = "```json\n" + JSON.stringify(validResponse) + "\n```";
    expect(parseAnalysisResponse(raw).summary).toBe(validResponse.summary);
  });

  it.each([
    [140, 100],
    [-5, 0],
    [66.6, 67],
  ])("clamps and rounds score %s to %s", (input, expected) => {
    const raw = JSON.stringify({ ...validResponse, matchScore: input });
    expect(parseAnalysisResponse(raw).matchScore).toBe(expected);
  });

  it("rejects non-JSON output", () => {
    expect(() => parseAnalysisResponse("Sure! Here is your analysis")).toThrow(
      /valid JSON/
    );
  });

  it("rejects JSON with missing fields", () => {
    const { strengths: _omit, ...partial } = validResponse;
    expect(() => parseAnalysisResponse(JSON.stringify(partial))).toThrow(
      /expected structure/
    );
  });
});

describe("buildAnalysisPrompt", () => {
  it("includes the job description when given", () => {
    const prompt = buildAnalysisPrompt("My resume", "  Senior C++ dev  ");
    expect(prompt).toContain("RESUME:\nMy resume");
    expect(prompt).toContain("JOB DESCRIPTION:\nSenior C++ dev");
  });

  it("asks for an overall score without a job description", () => {
    const prompt = buildAnalysisPrompt("My resume", "   ");
    expect(prompt).not.toContain("JOB DESCRIPTION");
    expect(prompt).toContain("overall resume quality");
  });
});

describe("analyzeResume", () => {
  it("sends the built prompt to the generator and parses the result", async () => {
    const generate = vi.fn().mockResolvedValue(JSON.stringify(validResponse));
    const result = await analyzeResume("My resume", "Job", generate);
    expect(generate).toHaveBeenCalledWith(
      buildAnalysisPrompt("My resume", "Job")
    );
    expect(result.matchScore).toBe(72);
  });

  it("refuses empty resumes without calling the model", async () => {
    const generate = vi.fn();
    await expect(analyzeResume("   ", undefined, generate)).rejects.toThrow(
      /empty/
    );
    expect(generate).not.toHaveBeenCalled();
  });
});

describe("chat helpers", () => {
  it("maps roles to Gemini format and drops leading assistant turns", () => {
    const history = toGeminiHistory([
      { role: "assistant", content: "Hi!" },
      { role: "user", content: "Q1" },
      { role: "assistant", content: "A1" },
    ]);
    expect(history).toEqual([
      { role: "user", parts: [{ text: "Q1" }] },
      { role: "model", parts: [{ text: "A1" }] },
    ]);
  });

  it("grounds the system prompt in the analysis", () => {
    const prompt = buildChatSystemPrompt({
      resumeText: "RESUME TEXT",
      jobDescription: null,
      matchScore: 80,
      summary: "Good",
      strengths: "S",
      weaknesses: "W",
      suggestions: "G",
    });
    expect(prompt).toContain("RESUME TEXT");
    expect(prompt).toContain("Score: 80/100");
    expect(prompt).toContain("(none provided)");
  });
});
