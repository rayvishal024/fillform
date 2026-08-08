
import { z } from "zod";

export const createUserWithEmailAndPasswordInput = z.object({
     fullName: z.string().trim().min(2).max(80).describe("Full name of the user"),
     email: z.string().trim().toLowerCase().email().max(254).describe("Email address of the user"),
     password: z.string()
          .min(8)
          .max(100)
          .regex(/[a-z]/, "Password must contain a lowercase letter")
          .regex(/[A-Z]/, "Password must contain an uppercase letter")
          .regex(/[0-9]/, "Password must contain a number")
          .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
          .describe("Password of the user"),
}).strict();


export type CreateUserWithEmailAndPasswordInputType = z.infer<typeof createUserWithEmailAndPasswordInput>

export const loginUserWithEmailAndPasswordInput = z.object({
     email: z.string().trim().toLowerCase().email().max(254).describe("Email address of the user"),
     password: z.string().min(1).max(100).describe("Password of the user"),
}).strict();

export type LoginUserWithEmailAndPasswordInputType = z.infer<typeof loginUserWithEmailAndPasswordInput>;

export const loginUserWithGoogleInput = z.object({
     idToken: z.string().trim().min(1).max(4096).describe("Google OAuth ID token"),
}).strict();

export type LoginUserWithGoogleInputType = z.infer<typeof loginUserWithGoogleInput>;