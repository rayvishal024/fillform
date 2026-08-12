import {
     boolean,
     index,
     integer,
     jsonb,
     pgEnum,
     pgTable,
     text,
     timestamp,
} from "drizzle-orm/pg-core";
import { forms } from "./forms";

export const fieldTypeEnum = pgEnum("field_type", [
     "short_text",
     "long_text",
     "date",
     "image",
     "rating",
     "checkbox",
     "radio",
     "select",
     "number",
     "email",
     "phone",
]);

export const formFields = pgTable(
     "form_fields",
     {
          id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
          formId: integer("form_id")
               .notNull()
               .references(() => forms.id, { onDelete: "cascade" }),
          type: fieldTypeEnum("type").notNull(),
          label: text("label").notNull(),
          placeholder: text("placeholder"),
          helpText: text("help_text"),
          isRequired: boolean("is_required").notNull().default(false),
          orderIndex: integer("order_index").notNull().default(0),
          // Shape depends on `type` — e.g. { choices: string[] } for radio/checkbox/select.
          options: jsonb("options"),
          // Shape depends on `type` — e.g. { min, max } for number, { maxLength } for text.
          validation: jsonb("validation"),
          createdAt: timestamp("created_at", { withTimezone: true })
               .defaultNow()
               .notNull(),
          updatedAt: timestamp("updated_at", { withTimezone: true })
               .defaultNow()
               .notNull()
               .$onUpdateFn(() => new Date()),
     },
     (table) => ({
          formOrderIdx: index("form_fields_form_id_order_idx").on(
               table.formId,
               table.orderIndex,
          ),
     }),
);

export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;