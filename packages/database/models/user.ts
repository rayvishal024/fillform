import * as t from "drizzle-orm/pg-core";

export const usersTable = t.pgTable('user', {
     id: t.uuid().primaryKey().defaultRandom(),
     fullName: t.varchar("full_name", { length: 80 }).notNull(),

     email: t.varchar().notNull().unique(),

     password: t.varchar('password', { length: 255 }),

     createdAt: t.timestamp('created_at').defaultNow().notNull(),
     updatedAt: t.timestamp('updated_at').defaultNow().$onUpdate(() => new Date).notNull()
     
     
})