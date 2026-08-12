import {
     index,
     integer,
     jsonb,
     pgTable,
     uniqueIndex,
} from "drizzle-orm/pg-core";
import { formFields } from "./form-feilds";
import { formResponses } from "./form-responses";

export const responseAnswers = pgTable(
     "response_answers",
     {
          id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
          responseId: integer("response_id")
               .notNull()
               .references(() => formResponses.id, { onDelete: "cascade" }),
          fieldId: integer("field_id")
               .notNull()
               .references(() => formFields.id, { onDelete: "cascade" }),
          // string | number | boolean | string[] | { url, filename, mimeType, size }
          // depending on the field's type.
          value: jsonb("value").notNull(),
     },
     (table) => ({
          responseIdx: index("response_answers_response_id_idx").on(
               table.responseId,
          ),
          fieldIdx: index("response_answers_field_id_idx").on(table.fieldId),
          responseFieldUnique: uniqueIndex(
               "response_answers_response_id_field_id_unique",
          ).on(table.responseId, table.fieldId),
     }),
);

export type ResponseAnswer = typeof responseAnswers.$inferSelect;
export type NewResponseAnswer = typeof responseAnswers.$inferInsert;