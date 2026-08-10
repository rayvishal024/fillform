import { z } from 'zod'

export const createUserWithEmailAndPasswordInputModel = z.object({
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

export const createUserWithEmailAndPasswordOutputModel = z.object({
     id: z.string().describe('Id of user')
});

export const loginUserWithEmailAndPasswordInputModel = z.object({
     email: z.string().trim().toLowerCase().email().max(254).describe("Email address of the user"),
     password: z.string().min(1).max(100).describe("Password of the user"),
}).strict();

export const loginUserWithEmailAndPasswordOutputModel = z.object({
     id: z.string().describe('Id of authenticated user')
});

export const loginUserWithGoogleInputModel = z.object({
     idToken: z.string().trim().min(1).max(4096).describe("Google OAuth ID token"),
}).strict();

export const loginUserWithGoogleOutputModel = z.object({
     id: z.string().describe('Id of authenticated user')
});

export const logoutOutputModel = z.object({
     success: z.literal(true),
});

export const currentUserOutputModel = z.object({
     id: z.string(),
     fullName: z.string(),
     email: z.string().email(),
     avatarUrl: z.string().url().nullable(),
});