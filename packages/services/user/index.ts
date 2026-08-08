import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { createUserWithEmailAndPasswordInput, CreateUserWithEmailAndPasswordInputType } from "./model";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
     const salt = randomBytes(16).toString("hex");
     const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
     return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

class UserService {

     private async findUserByEmail(email: string) {
          const result = await db.select().from(usersTable).where(eq(usersTable.email, email));

          if (!result || result.length === 0)
               return null;
          return result[0];
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

}
export default UserService;
