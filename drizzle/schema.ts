import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

/** Registered users (email + bcrypt-hashed password, JWT auth). */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** One row per resume analysis. */
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resumeFileName: varchar("resumeFileName", { length: 255 }).notNull(),
  resumeFileKey: text("resumeFileKey").notNull(),
  resumeFileUrl: text("resumeFileUrl").notNull(),
  resumeText: text("resumeText").notNull(),
  jobDescription: text("jobDescription"),
  /** 0–100: fit for the job description, or overall resume quality if none was given. */
  matchScore: integer("matchScore"),
  summary: text("summary"),
  strengths: text("strengths").notNull(),
  weaknesses: text("weaknesses").notNull(),
  suggestions: text("suggestions").notNull(),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;
