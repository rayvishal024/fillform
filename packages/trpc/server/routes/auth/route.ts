import { publicProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generatePath } from "../../utils/path-generator";
import {
     createUserWithEmailAndPasswordInputModel,
     createUserWithEmailAndPasswordOutputModel,
     loginUserWithEmailAndPasswordInputModel,
     loginUserWithEmailAndPasswordOutputModel,
     loginUserWithGoogleInputModel,
     loginUserWithGoogleOutputModel,
} from './model'
import { userService } from "../../services/index"

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
     createUserWithEmailAndPassword: publicProcedure
          .meta({
               openapi: {
                    method: 'POST',
                    path: getPath('/createUserWithEmailAndPassword'),
                    tags : TAGS
          }})
          .input(createUserWithEmailAndPasswordInputModel)
          .output(createUserWithEmailAndPasswordOutputModel)
          .mutation(async ({ input }) => {
               
               try {
                    const result = await userService.createUserWithEmailAndPassword(input);
                    return { id: result };
               } catch (error) {
                    if (error instanceof Error && error.message === "user with Email Already Exist") {
                         throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
                    }

                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create account" });
               }
          }),
     loginUserWithEmailAndPassword: publicProcedure
          .meta({
               openapi: {
                    method: 'POST',
                    path: getPath('/loginUserWithEmailAndPassword'),
                    tags: TAGS,
               },
          })
          .input(loginUserWithEmailAndPasswordInputModel)
          .output(loginUserWithEmailAndPasswordOutputModel)
          .mutation(async ({ input }) => {
               try {
                    const result = await userService.loginUserWithEmailAndPassword(input);
                    return { id: result };
               } catch (error) {
                    if (error instanceof Error && error.message === "Invalid email or password") {
                         throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
                    }

                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to authenticate" });
               }
          }),
     loginUserWithGoogle: publicProcedure
          .meta({
               openapi: {
                    method: 'POST',
                    path: getPath('/loginUserWithGoogle'),
                    tags: TAGS,
               },
          })
          .input(loginUserWithGoogleInputModel)
          .output(loginUserWithGoogleOutputModel)
          .mutation(async ({ input }) => {
               try {
                    const result = await userService.loginUserWithGoogle(input);
                    return { id: result };
               } catch (error) {
                    if (error instanceof Error && [
                         "Invalid Google credentials",
                         "Google account is not linked",
                         "Google account is already in use",
                    ].includes(error.message)) {
                         throw new TRPCError({ code: "UNAUTHORIZED", message: "Unable to authenticate with Google" });
                    }

                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to authenticate" });
               }
          }),
});
