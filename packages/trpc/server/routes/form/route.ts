import { TRPCError } from "@trpc/server";
import { formService } from "../../services/index";
import { generatePath } from "../../utils/path-generator";
import { protectedProcedure, router } from "../../trpc";
import {
     createFormFieldInputModel,
     createFormFieldOutputModel,
     createFormInputModel,
     createFormOutputModel,
     deleteFormFieldOutputModel,
     deleteFormOutputModel,
     fieldIdInputModel,
     formIdInputModel,
     getFormByIdOutputModel,
     listFormsInputModel,
     listFormsOutputModel,
     reorderFormFieldsInputModel,
     reorderFormFieldsOutputModel,
     updateFormFieldInputModel,
     updateFormFieldOutputModel,
     saveFieldDraftInputModel,
     saveFieldDraftOutputModel,
     getFieldDraftInputModel,
     getFieldDraftOutputModel,
     clearFieldDraftOutputModel,
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
          case "Field not found":
               return new TRPCError({
                    code: "NOT_FOUND",
                    message: error.message,
               });
          case "This slug is reserved":
          case "Invalid slug format":
          case "Invalid field order":
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

     createField: protectedProcedure
          .meta({
               openapi: {
                    method: "POST",
                    path: getPath("/field/create"),
                    tags: TAGS,
               },
          })
          .input(createFormFieldInputModel)
          .output(createFormFieldOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.createField(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to create field");
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
                    throw formError(error, "Unable to update form");
               }
          }),

     updateField: protectedProcedure
          .meta({
               openapi: {
                    method: "PATCH",
                    path: getPath("/field/update"),
                    tags: TAGS,
               },
          })
          .input(updateFormFieldInputModel)
          .output(updateFormFieldOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.updateField(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to update field");
               }
          }),

     reorderFields: protectedProcedure
          .meta({
               openapi: {
                    method: "PATCH",
                    path: getPath("/field/reorder"),
                    tags: TAGS,
               },
          })
          .input(reorderFormFieldsInputModel)
          .output(reorderFormFieldsOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.reorderFields(ctx.userId, input);
               } catch (error) {
                    throw formError(error, "Unable to reorder fields");
               }
          }),

     deleteField: protectedProcedure
          .meta({
               openapi: {
                    method: "DELETE",
                    path: getPath("/field/delete"),
                    tags: TAGS,
               },
          })
          .input(fieldIdInputModel)
          .output(deleteFormFieldOutputModel)
          .mutation(async ({ input, ctx }) => {
               try {
                    return await formService.deleteField(ctx.userId, input.fieldId);
               } catch (error) {
                    throw formError(error, "Unable to delete field");
               }
          }),

          saveFieldDraft: protectedProcedure
               .meta({
                    openapi: {
                         method: "POST",
                         path: getPath("/field/draft/save"),
                         tags: TAGS,
                    },
               })
               .input(saveFieldDraftInputModel)
               .output(saveFieldDraftOutputModel)
               .mutation(async ({ input, ctx }) => {
                    try {
                         return await formService.saveFieldDraft(ctx.userId, input.formId, input.draft);
                    } catch (error) {
                         throw formError(error, "Unable to save draft");
                    }
               }),

          getFieldDraft: protectedProcedure
               .meta({
                    openapi: {
                         method: "GET",
                         path: getPath("/field/draft/:formId"),
                         tags: TAGS,
                    },
               })
               .input(getFieldDraftInputModel)
               .output(getFieldDraftOutputModel)
               .query(async ({ input, ctx }) => {
                    try {
                         return await formService.getFieldDraft(ctx.userId, input.formId);
                    } catch (error) {
                         throw formError(error, "Unable to get draft");
                    }
               }),

          clearFieldDraft: protectedProcedure
               .meta({
                    openapi: {
                         method: "DELETE",
                         path: getPath("/field/draft/clear"),
                         tags: TAGS,
                    },
               })
               .input(formIdInputModel)
               .output(clearFieldDraftOutputModel)
               .mutation(async ({ input, ctx }) => {
                    try {
                         return await formService.clearFieldDraft(ctx.userId, input.formId);
                    } catch (error) {
                         throw formError(error, "Unable to clear draft");
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
