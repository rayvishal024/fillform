import { createHash, randomBytes } from "node:crypto";
import { and, db, eq, gt, isNull } from "@repo/database";
import { sessionsTable } from "@repo/database/schema";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
     return createHash("sha256").update(token).digest("hex");
}

class SessionService {
     public async create(userId: string) {
          const token = randomBytes(32).toString("base64url");
          const now = new Date();
          const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

          await db.insert(sessionsTable).values({
               userId,
               tokenHash: hashToken(token),
               expiresAt,
               createdAt: now,
               lastUsedAt: now,
          });

          return token;
     }

     public async getUserId(token: string | undefined) {
          if (!token) {
               return null;
          }

          const [session] = await db
               .select({ userId: sessionsTable.userId })
               .from(sessionsTable)
               .where(and(
                    eq(sessionsTable.tokenHash, hashToken(token)),
                    gt(sessionsTable.expiresAt, new Date()),
                    isNull(sessionsTable.revokedAt),
               ));

          if (!session) {
               return null;
          }

          await db.update(sessionsTable)
               .set({ lastUsedAt: new Date() })
               .where(eq(sessionsTable.tokenHash, hashToken(token)));

          return session.userId;
     }

     public async revoke(token: string | undefined) {
          if (!token) {
               return;
          }

          await db.update(sessionsTable)
               .set({ revokedAt: new Date() })
               .where(and(
                    eq(sessionsTable.tokenHash, hashToken(token)),
                    isNull(sessionsTable.revokedAt),
               ));
     }
}

export default SessionService;
