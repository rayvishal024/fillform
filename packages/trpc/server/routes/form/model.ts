import {
     createFormFieldInput,
     fieldIdInput,
     fieldTypeSchema,
     formIdInput,
     createFormInput,
     formStatusSchema,
     listFormsInput,
     reorderFormFieldsInput,
     updateFormFieldInputBase,
     updateFormInputBase,
     updateFormSlugInput,
} from "@repo/services/form/model";
import { z } from "zod";

const formFieldModel = z.object({
     id: z.number().int().positive(),
     formId: z.number().int().positive(),
     type: fieldTypeSchema,
     label: z.string(),
     placeholder: z.string().nullable(),
     helpText: z.string().nullable(),
     isRequired: z.boolean(),
     orderIndex: z.number().int().nonnegative(),
     options: z.unknown().nullable(),
     validation: z.unknown().nullable(),
     createdAt: z.date(),
     updatedAt: z.date(),
});

const formSummaryModel = z.object({
     id: z.number().int().positive(),
     title: z.string(),
     description: z.string().nullable(),
     slug: z.string(),
     bannerUrl: z.string().nullable(),
     status: formStatusSchema,
     createdAt: z.date(),
     updatedAt: z.date(),
     responseCount: z.number().int().nonnegative(),
});

const formMutationModel = formSummaryModel.omit({ responseCount: true });

export const createFormInputModel = createFormInput;
export const listFormsInputModel = listFormsInput;
export const updateFormInputModel = updateFormInputBase;
export const updateFormSlugInputModel = updateFormSlugInput;
export const formIdInputModel = formIdInput;
export const createFormFieldInputModel = createFormFieldInput;
export const updateFormFieldInputModel = updateFormFieldInputBase;
export const fieldIdInputModel = fieldIdInput;
export const reorderFormFieldsInputModel = reorderFormFieldsInput;

export const saveFieldDraftInputModel = z.object({
     formId: z.number().int().positive(),
     draft: z.object({
          type: fieldTypeSchema.optional(),
          label: z.string().trim().max(255).optional(),
          placeholder: z.string().trim().max(1024).nullable().optional(),
          helpText: z.string().trim().max(5000).nullable().optional(),
          isRequired: z.boolean().optional(),
          options: z.unknown().optional(),
          validation: z.unknown().optional(),
          optionText: z.string().optional(),
     }),
});

export const getFieldDraftInputModel = formIdInput;

export const getFieldDraftOutputModel = z.object({ draft: z.unknown().nullable() });

export const saveFieldDraftOutputModel = z.object({ success: z.literal(true) });
export const clearFieldDraftOutputModel = z.object({ success: z.literal(true) });

export const createFormOutputModel = z.object({
     id: z.number().int().positive(),
     slug: z.string(),
});

export const listFormsOutputModel = z.object({
     items: z.array(formSummaryModel),
     nextOffset: z.number().int().nonnegative().nullable(),
});

export const updateFormOutputModel = formMutationModel;

export const updateFormSlugOutputModel = z.object({
     id: z.number().int().positive(),
     slug: z.string(),
});

export const createFormFieldOutputModel = formFieldModel;
export const updateFormFieldOutputModel = formFieldModel;

export const deleteFormOutputModel = z.object({
     success: z.literal(true),
});

export const deleteFormFieldOutputModel = z.object({
     success: z.literal(true),
});

export const reorderFormFieldsOutputModel = z.object({
     success: z.literal(true),
});

export const getFormByIdOutputModel = formSummaryModel.extend({
     fields: z.array(formFieldModel),
});
