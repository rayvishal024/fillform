import { index, integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";
import { forms } from "./forms";

export const formResponses = pgTable(
     "form_responses",
     {
          id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
          formId: integer("form_id")
               .notNull()
               .references(() => forms.id, { onDelete: "cascade" }),
          submittedAt: timestamp("submitted_at", { withTimezone: true })
               .defaultNow()
               .notNull(),
          // { ipHash, userAgent, referrer } — never store raw IP, hash it.
          respondentMeta: jsonb("respondent_meta"),
     },
     (table) => ({
          formIdx: index("form_responses_form_id_idx").on(table.formId),
          submittedAtIdx: index("form_responses_submitted_at_idx").on(
               table.submittedAt,
          ),
     }),
);

export type FormResponse = typeof formResponses.$inferSelect;
export type NewFormResponse = typeof formResponses.$inferInsert;