import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generatePath } from "../../utils/path-generator";
import { clearSessionCookie, setSessionCookie } from "../../context";
import SessionService from "@repo/services/session";
import {
     createUserWithEmailAndPasswordInputModel,
     createUserWithEmailAndPasswordOutputModel,
     loginUserWithEmailAndPasswordInputModel,
     loginUserWithEmailAndPasswordOutputModel,
     loginUserWithGoogleInputModel,
     loginUserWithGoogleOutputModel,
     logoutOutputModel,
     currentUserOutputModel,
} from './model'
import { userService } from "../../services/index"

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");
const sessionService = new SessionService();

export const authRouter = router({

     createUserWithEmailAndPassword: publicProcedure
          .meta({
               openapi: {
                    method: 'POST',
                    path: getPath('/createUserWithEmailAndPassword'),
                    tags: TAGS
               }
          })
          .input(createUserWithEmailAndPasswordInputModel)
          .output(createUserWithEmailAndPasswordOutputModel)
          .mutation(async ({ input, ctx }) => {

               try {
                    const result = await userService.createUserWithEmailAndPassword(input);
                    const sessionToken = await sessionService.create(result);
                    setSessionCookie(ctx.res, sessionToken);
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
          .mutation(async ({ input, ctx }) => {
               try {
                    const result = await userService.loginUserWithEmailAndPassword(input);
                    const sessionToken = await sessionService.create(result);
                    setSessionCookie(ctx.res, sessionToken);
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
          .mutation(async ({ input, ctx }) => {
               try {

                    const result = await userService.loginUserWithGoogle(input);
                    const sessionToken = await sessionService.create(result);
                    setSessionCookie(ctx.res, sessionToken);
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
     logout: protectedProcedure
          .meta({
               openapi: {
                    method: 'POST',
                    path: getPath('/logout'),
                    tags: TAGS,
               },
          })
          .output(logoutOutputModel)
          .mutation(async ({ ctx }) => {
               await sessionService.revoke(ctx.sessionToken);
               clearSessionCookie(ctx.res);
               return { success: true as const };
          }),
     getCurrentUser: protectedProcedure
          .meta({
               openapi: {
                    method: 'GET',
                    path: getPath('/me'),
                    tags: TAGS,
               },
          })
          .output(currentUserOutputModel)
          .query(async ({ ctx }) => {
               try {
                    return await userService.getCurrentUser(ctx.userId);
               } catch {
                    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
               }
          }),
});
