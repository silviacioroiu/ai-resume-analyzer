import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  analyses,
  type InsertAnalysis,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

/** Lazily creates the connection pool so tooling and tests can run without a database. */
function getDb() {
  if (!_db) {
    if (!ENV.databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }
    _db = drizzle(new pg.Pool({ connectionString: ENV.databaseUrl }));
  }
  return _db;
}

// Users ---------------------------------------------------------------------

export async function getUserByEmail(email: string) {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

export async function getUserById(id: number) {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user;
}

export async function createUser(user: InsertUser) {
  const [created] = await getDb().insert(users).values(user).returning();
  return created;
}

export async function touchLastSignedIn(id: number) {
  await getDb()
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, id));
}

// Analyses ------------------------------------------------------------------

export async function createAnalysis(analysis: InsertAnalysis) {
  const [created] = await getDb().insert(analyses).values(analysis).returning();
  return created;
}

export async function getUserAnalyses(userId: number) {
  return getDb()
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt));
}

export async function getAnalysisById(id: number, userId: number) {
  const [analysis] = await getDb()
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.userId, userId)))
    .limit(1);
  return analysis;
}
