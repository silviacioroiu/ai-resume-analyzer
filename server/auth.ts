/**
 * JWT authentication helpers: token signing/verification, password hashing,
 * and an Express middleware for REST routes.
 */
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { ENV } from "./_core/env";

const DEV_FALLBACK_SECRET = "dev-only-secret-change-me";

function getJwtSecret(): string {
  if (ENV.jwtSecret) return ENV.jwtSecret;
  if (ENV.isProduction) {
    throw new Error("JWT_SECRET must be set in production");
  }
  return DEV_FALLBACK_SECRET;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ENV.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

/** Express middleware: rejects requests without a valid Bearer token. */
export function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}
