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
})