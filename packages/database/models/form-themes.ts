import {
     boolean,
     index,
     integer,
     jsonb,
     pgTable,
     text,
     timestamp,
     uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user";

export const formThemes = pgTable("form_themes", {
     id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
     name: text("name").notNull(),
     config: jsonb("config").notNull(),
     isSystem: boolean("is_system").notNull().default(false),
     ownerId: uuid("owner_id").references(() => users.id, {
          onDelete: "cascade",
     }),
     createdAt: timestamp("created_at", { withTimezone: true })
          .defaultNow()
          .notNull(),
     updatedAt: timestamp("updated_at", { withTimezone: true })
          .defaultNow()
          .notNull()
          .$onUpdateFn(() => new Date()),
     },
     (table) => ({
          ownerIdx: index("form_themes_owner_id_idx").on(table.ownerId),
     }),
);

export type FormTheme = typeof formThemes.$inferSelect;
export type NewFormTheme = typeof formThemes.$inferInsert;