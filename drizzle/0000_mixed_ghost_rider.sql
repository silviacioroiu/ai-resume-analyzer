CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"resumeFileName" varchar(255) NOT NULL,
	"resumeFileKey" text NOT NULL,
	"resumeFileUrl" text NOT NULL,
	"resumeText" text NOT NULL,
	"jobDescription" text,
	"strengths" text NOT NULL,
	"weaknesses" text NOT NULL,
	"suggestions" text NOT NULL,
	"language" varchar(10) DEFAULT 'en',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
