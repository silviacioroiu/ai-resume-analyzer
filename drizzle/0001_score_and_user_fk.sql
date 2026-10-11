ALTER TABLE "analyses" ALTER COLUMN "userId" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "analyses_userId_seq";--> statement-breakpoint
ALTER TABLE "analyses" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "analyses" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "analyses" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "lastSignedIn" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "lastSignedIn" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "matchScore" integer;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;