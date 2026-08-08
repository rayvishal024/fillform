import { publicProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generatePath } from "../../utils/path-generator";
import { createUserWithEmailAndPasswordInputModel, createUserWithEmailAndPasswordOutputModel } from './model'
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
          })
});
