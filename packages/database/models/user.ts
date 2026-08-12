import * as t from "drizzle-orm/pg-core";

export const usersTable = t.pgTable("user", {
     id: t.uuid().primaryKey().defaultRandom(),
     fullName: t.varchar("full_name", { length: 80 }).notNull(),

     email: t.varchar("email", { length: 254 }).notNull().unique(),

     password: t.varchar('password', { length: 255 }),
     googleId: t.varchar('google_id', { length: 255 }).unique(),
     avatarUrl: t.varchar('avatar_url', { length: 2048 }),

     createdAt: t.timestamp('created_at').defaultNow().notNull(),
     updatedAt: t.timestamp("updated_at", { withTimezone: true })
          .defaultNow()
          .$onUpdate(() => new Date())
          .notNull(),
});

export const users = usersTable;

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;