import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { extractToken, verifyToken } from "../auth";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticate(
  req: CreateExpressContextOptions["req"]
): Promise<User | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return (await getUserById(payload.userId)) ?? null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: await authenticate(opts.req),
  };
}
