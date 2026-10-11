import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAnalysis, getAnalysisById, getUserAnalyses } from "./db";
import { analyzeResume, chatAboutAnalysis } from "./gemini";

const MAX_RESUME_CHARS = 30_000;
const MAX_JOB_CHARS = 15_000;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { password: _password, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
  }),

  resume: router({
    analyze: protectedProcedure
      .input(
        z.object({
          resumeText: z.string().min(1).max(MAX_RESUME_CHARS),
          resumeFileName: z.string().max(255),
          resumeFileKey: z.string(),
          resumeFileUrl: z.string(),
          jobDescription: z.string().max(MAX_JOB_CHARS).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let analysis;
        try {
          analysis = await analyzeResume(
            input.resumeText,
            input.jobDescription
          );
        } catch (error) {
          console.error("[Analyze] Gemini analysis failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The AI analysis failed. Please try again.",
          });
        }

        const saved = await createAnalysis({
          userId: ctx.user.id,
          resumeFileName: input.resumeFileName,
          resumeFileKey: input.resumeFileKey,
          resumeFileUrl: input.resumeFileUrl,
          resumeText: input.resumeText,
          jobDescription: input.jobDescription || null,
          ...analysis,
        });

        return { id: saved.id, ...analysis };
      }),

    list: protectedProcedure.query(({ ctx }) => getUserAnalyses(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getAnalysisById(input.id, ctx.user.id)),

    chat: protectedProcedure
      .input(
        z.object({
          analysisId: z.number(),
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().min(1).max(4000),
              })
            )
            .min(1)
            .max(40),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const analysis = await getAnalysisById(input.analysisId, ctx.user.id);
        if (!analysis) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Analysis not found",
          });
        }

        try {
          const reply = await chatAboutAnalysis(analysis, input.messages);
          return { reply };
        } catch (error) {
          console.error("[Chat] Gemini chat failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The AI assistant could not answer. Please try again.",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
