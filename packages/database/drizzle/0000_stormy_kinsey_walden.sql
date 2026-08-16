CREATE TYPE "public"."field_type" AS ENUM('short_text', 'long_text', 'date', 'image', 'rating', 'checkbox', 'radio', 'select', 'number', 'email', 'phone');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "form_fields_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"form_id" integer NOT NULL,
	"type" "field_type" NOT NULL,
	"label" text NOT NULL,
	"placeholder" text,
	"help_text" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"options" jsonb,
	"validation" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_responses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "form_responses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"form_id" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"respondent_meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "form_themes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "form_themes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "forms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"banner_url" text,
	"theme_id" integer,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "response_answers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "response_answers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"response_id" integer NOT NULL,
	"field_id" integer NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password" varchar(255),
	"google_id" varchar(255),
	"avatar_url" varchar(2048),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_themes" ADD CONSTRAINT "form_themes_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_theme_id_form_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."form_themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_response_id_form_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."form_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_fields_form_id_order_idx" ON "form_fields" USING btree ("form_id","order_index");--> statement-breakpoint
CREATE INDEX "form_responses_form_id_idx" ON "form_responses" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_responses_submitted_at_idx" ON "form_responses" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "form_themes_owner_id_idx" ON "form_themes" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forms_slug_unique" ON "forms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "forms_user_id_idx" ON "forms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forms_user_id_status_idx" ON "forms" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "response_answers_response_id_idx" ON "response_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_answers_field_id_idx" ON "response_answers" USING btree ("field_id");--> statement-breakpoint
CREATE UNIQUE INDEX "response_answers_response_id_field_id_unique" ON "response_answers" USING btree ("response_id","field_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" USING btree ("expires_at");