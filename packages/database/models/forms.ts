import {
     index,
     integer,
     pgEnum,
     pgTable,
     text,
     timestamp,
     uniqueIndex,
     uuid,
     varchar,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { formThemes } from "./form-themes";

export const formStatusEnum = pgEnum("form_status", [
     "draft",
     "published",
     "closed",
]);

export const forms = pgTable(
     "forms",
     {
          id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
          userId: uuid("user_id")
               .notNull()
               .references(() => users.id, { onDelete: "cascade" }),
          title: text("title").notNull(),
          description: text("description"),
          slug: varchar("slug", { length: 255 }).notNull(),
          bannerUrl: text("banner_url"),
          themeId: integer("theme_id").references(() => formThemes.id, {
               onDelete: "set null",
          }),
          status: formStatusEnum("status").notNull().default("draft"),
          createdAt: timestamp("created_at", { withTimezone: true })
               .defaultNow()
               .notNull(),
          updatedAt: timestamp("updated_at", { withTimezone: true })
               .defaultNow()
               .notNull()
               .$onUpdateFn(() => new Date()),
          deletedAt: timestamp("deleted_at", { withTimezone: true }),
     },
     (table) => ({
          slugUnique: uniqueIndex("forms_slug_unique").on(table.slug),
          userIdx: index("forms_user_id_idx").on(table.userId),
          userStatusIdx: index("forms_user_id_status_idx").on(
               table.userId,
               table.status,
          ),
     }),
);

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;