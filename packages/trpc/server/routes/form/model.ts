import {
     createFormInput,
     formIdInput,
     formStatusSchema,
     listFormsInput,
     updateFormInputBase,
     updateFormSlugInput,
} from "@repo/services/form/model";
import { z } from "zod";

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

export const deleteFormOutputModel = z.object({
     success: z.literal(true),
});

export const getFormByIdOutputModel = formSummaryModel;
