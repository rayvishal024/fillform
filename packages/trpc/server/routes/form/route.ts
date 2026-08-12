import { TRPCError } from "@trpc/server";
import { formService } from "../../services/index";
import { generatePath } from "../../utils/path-generator";
import { protectedProcedure, router } from "../../trpc";
import {
     createFormInputModel,
     createFormOutputModel,
     deleteFormOutputModel,
     formIdInputModel,
     getFormByIdOutputModel,
     listFormsInputModel,
     listFormsOutputModel,
     updateFormInputModel,
     updateFormOutputModel,
     updateFormSlugInputModel,
     updateFormSlugOutputModel,
} from "./model";

const TAGS = ["Forms"];
const getPath = generatePath("/form");

function formError(error: unknown, fallback: string) {
     if (!(error instanceof Error)) {
          return new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: fallback,
          });
     }

     switch (error.message) {
          case "Form not found":
               return new TRPCError({
                    code: "NOT_FOUND",
                    message: "Form not found",
               });
          case "This slug is reserved":
          case "Invalid slug format":
               return new TRPCError({
                    code: "BAD_REQUEST",
                    message: error.message,
               });
          case "Slug already exists":
               return new TRPCError({
                    code: "CONFLICT",
                    message: "This slug is already in use",
               });
          case "Unable to generate a unique form slug":
               return new TRPCError({
                    code: "CONFLICT",
                    message: "Unable to generate a unique form slug",
               });
          default:
               return new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: fallback,
               });
     }
}

export const formRouter = router({
     create: protectedProcedure
          .meta({
               openapi: {
                    method: "POST",
                    path: getPath("/create"),
                    tags: TAGS,
               },
          })
          .input(createFormInputModel)
          .output(createFormOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.create(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to create form");
               }
          }),

     list: protectedProcedure
          .meta({
               openapi: {
                    method: "GET",
                    path: getPath("/list"),
                    tags: TAGS,
               },
          })
          .input(listFormsInputModel)
          .output(listFormsOutputModel)
          .query(async ({ input, ctx }) => {
               try {
                    return await formService.list(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to list forms");
               }
          }),

     update: protectedProcedure
          .meta({
               openapi: {
                    method: "PATCH",
                    path: getPath("/update"),
                    tags: TAGS,
               },
          })
          .input(updateFormInputModel)
          .output(updateFormOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.update(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to update form");
               }
          }),

     updateSlug: protectedProcedure
          .meta({
               openapi: {
                    method: "PATCH",
                    path: getPath("/update-slug"),
                    tags: TAGS,
               },
          })
          .input(updateFormSlugInputModel)
          .output(updateFormSlugOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.updateSlug(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to update form slug");
               }
          }),

     delete: protectedProcedure
          .meta({
               openapi: {
                    method: "DELETE",
                    path: getPath("/delete"),
                    tags: TAGS,
               },
          })
          .input(formIdInputModel)
          .output(deleteFormOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.delete(ctx.userId, input.formId);
               } catch (error) {
                    throw formError(error, "Unable to delete form");
               }
          }),

     getById: protectedProcedure
          .meta({
               openapi: {
                    method: "GET",
                    path: getPath("/:formId"),
                    tags: TAGS,
               },
          })
          .input(formIdInputModel)
          .output(getFormByIdOutputModel)
          .query(async ({ input, ctx }) => {
               try {
                    return await formService.getById(ctx.userId, input.formId);
               } catch (error) {
                    throw formError(error, "Unable to get form");
               }
          }),
});
