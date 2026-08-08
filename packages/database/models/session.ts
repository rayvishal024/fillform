import * as t from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const sessionsTable = t.pgTable(
     "session",
     {
          id: t.uuid().primaryKey().defaultRandom(),
          userId: t.uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
          tokenHash: t.varchar("token_hash", { length: 64 }).notNull().unique(),
          expiresAt: t.timestamp("expires_at").notNull(),
          createdAt: t.timestamp("created_at").defaultNow().notNull(),
          lastUsedAt: t.timestamp("last_used_at").defaultNow().notNull(),
          revokedAt: t.timestamp("revoked_at"),
     },
     (table) => [
          t.index("session_user_id_idx").on(table.userId),
          t.index("session_expires_at_idx").on(table.expiresAt),
     ],
);
