import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { createUserWithEmailAndPasswordInput, CreateUserWithEmailAndPasswordInputType } from "./model";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { loginUserWithEmailAndPasswordInput, LoginUserWithEmailAndPasswordInputType } from "./model";
import { loginUserWithGoogleInput, LoginUserWithGoogleInputType } from "./model";
import { OAuth2Client } from "google-auth-library";

const scrypt = promisify(scryptCallback);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function hashPassword(password: string) {
     const salt = randomBytes(16).toString("hex");
     const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
     return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
     const [algorithm, salt, encodedKey] = storedHash.split(":");
     if (algorithm !== "scrypt" || !salt || !encodedKey || !/^[a-f0-9]+$/i.test(encodedKey)) {
          return false;
     }

     const expectedKey = Buffer.from(encodedKey, "hex");
     const actualKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;
     return actualKey.length === expectedKey.length && timingSafeEqual(actualKey, expectedKey);
}

class UserService {

     private async findUserByEmail(email: string) {
          const result = await db.select().from(usersTable).where(eq(usersTable.email, email));

          if (!result || result.length === 0)
               return null;
          return result[0];
     }

     public async getCurrentUser(userId: string) {
          const [user] = await db.select({
               id: usersTable.id,
               fullName: usersTable.fullName,
               email: usersTable.email,
               avatarUrl: usersTable.avatarUrl,
          }).from(usersTable).where(eq(usersTable.id, userId));

          if (!user) {
               throw new Error("User not found");
          }

          return user;
     }

     public async createUserWithEmailAndPassword(payload: CreateUserWithEmailAndPasswordInputType) {
          const { fullName, email, password } = await createUserWithEmailAndPasswordInput.parseAsync(payload);

          // Check if user already exists
          const existingUser = await this.findUserByEmail(email);

          if (existingUser) {
               throw new Error('user with Email Already Exist');
          }

          const passwordHash = await hashPassword(password);
          let user: { id: string } | undefined;

          try {
               [user] = await db.insert(usersTable).values({
                    fullName,
                    email,
                    password: passwordHash,
               }).returning({ id: usersTable.id });
          } catch (error) {
               // The unique index is the final guard against concurrent requests.
               if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
                    throw new Error("user with Email Already Exist");
               }
               throw error;
          }

          if (!user) {
               throw new Error("Unable to create user");
          }

          return user.id;

     }

     public async loginUserWithEmailAndPassword(payload: LoginUserWithEmailAndPasswordInputType) {
          const { email, password } = await loginUserWithEmailAndPasswordInput.parseAsync(payload);
          const user = await this.findUserByEmail(email);

          // Do not disclose whether an email exists or whether only the password failed.
          if (!user?.password || !(await verifyPassword(password, user.password))) {
               throw new Error("Invalid email or password");
          }

          return user.id;
     }

     public async loginUserWithGoogle(payload: LoginUserWithGoogleInputType) {
          const { idToken } = await loginUserWithGoogleInput.parseAsync(payload);
          const googleClientId = process.env.GOOGLE_CLIENT_ID;

          if (!googleClientId) {
               throw new Error("Google authentication is not configured");
          }

          let googleUser;
          try {
               const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: googleClientId,
               });
               googleUser = ticket.getPayload();

          } catch {
               throw new Error("Invalid Google credentials");
          }

          if (!googleUser?.sub || !googleUser.email || googleUser.email_verified !== true) {
               throw new Error("Invalid Google credentials");
          }

          const email = googleUser.email.trim().toLowerCase();
          const existingGoogleUser = await db.select({ id: usersTable.id })
               .from(usersTable)
               .where(eq(usersTable.googleId, googleUser.sub));

          if (existingGoogleUser[0]) {
               return existingGoogleUser[0].id;
          }

          // Do not silently link Google to a password account. Account linking must
          // be an explicit authenticated action to prevent account takeover.
          const existingEmailUser = await this.findUserByEmail(email);
          if (existingEmailUser) {
               throw new Error("Google account is not linked");
          }

          try {
               const [user] = await db.insert(usersTable).values({
                    fullName: googleUser.name || "Google User",
                    email,
                    googleId: googleUser.sub,
                    avatarUrl: googleUser.picture,
               }).returning({ id: usersTable.id });

               if (!user) {
                    throw new Error("Unable to create Google account");
               }

               return user.id;
          } catch (error) {
               if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
                    throw new Error("Google account is already in use");
               }
               throw error;
          }
     }

}
export default UserService;
