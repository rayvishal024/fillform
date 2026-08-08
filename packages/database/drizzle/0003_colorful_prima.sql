ALTER TABLE "user" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_google_id_unique" UNIQUE("google_id");