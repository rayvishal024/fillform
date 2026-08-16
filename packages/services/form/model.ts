import { z } from "zod";

export const fieldTypeSchema = z.enum([
     "short_text",
     "long_text",
     "date",
     "image",
     "rating",
     "checkbox",
     "radio",
     "select",
     "number",
     "email",
     "phone",
]);

export const formStatusSchema = z.enum(["draft", "published", "closed"]);

export const createFormInput = z
     .object({
          title: z.string().trim().min(1).max(255),
          description: z.string().trim().max(5000).optional(),
     });

export const listFormsInput = z
     .object({
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
          status: formStatusSchema.optional(),
     })
     .strict();

export const updateFormInputBase = z
     .object({
          formId: z.number().int().positive(),
          title: z.string().trim().min(1).max(255).optional(),
          description: z.string().trim().max(5000).nullable().optional(),
          bannerUrl: z.string().trim().url().max(2048).nullable().optional(),
          status: formStatusSchema.optional(),
     })
     .strict();

export const updateFormInput = updateFormInputBase
     .refine(
          ({ title, description, bannerUrl, status }) =>
               title !== undefined ||
               description !== undefined ||
               bannerUrl !== undefined ||
               status !== undefined,
          { message: "At least one form field must be provided" },
     );

export const updateFormSlugInput = z
     .object({
          formId: z.number().int().positive(),
          slug: z
               .string()
               .trim()
               .min(1)
               .max(255)
               .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
     })
     .strict();

export const formIdInput = z
     .object({ formId: z.number().int().positive() })
     .strict();

export const fieldIdInput = z
     .object({ fieldId: z.number().int().positive() })
     .strict();

export const createFormFieldInput = z
     .object({
          formId: z.number().int().positive(),
          type: fieldTypeSchema,
          label: z.string().trim().min(1).max(255),
          placeholder: z.string().trim().max(1024).nullable().optional(),
          helpText: z.string().trim().max(5000).nullable().optional(),
          isRequired: z.boolean().optional(),
          options: z.unknown().optional(),
          validation: z.unknown().optional(),
     })
     .strict();

export const updateFormFieldInputBase = z
     .object({
          fieldId: z.number().int().positive(),
          type: fieldTypeSchema.optional(),
          label: z.string().trim().min(1).max(255).optional(),
          placeholder: z.string().trim().max(1024).nullable().optional(),
          helpText: z.string().trim().max(5000).nullable().optional(),
          isRequired: z.boolean().optional(),
          options: z.unknown().optional(),
          validation: z.unknown().optional(),
     })
     .strict();

export const updateFormFieldInput = updateFormFieldInputBase
     .refine(
          ({ type, label, placeholder, helpText, isRequired, options, validation }) =>
               type !== undefined ||
               label !== undefined ||
               placeholder !== undefined ||
               helpText !== undefined ||
               isRequired !== undefined ||
               options !== undefined ||
               validation !== undefined,
          { message: "At least one field property must be provided" },
     );

export const reorderFormFieldsInput = z
     .object({
          formId: z.number().int().positive(),
          fieldIds: z.array(z.number().int().positive()).min(1),
     })
     .strict();

export type CreateFormInput = z.infer<typeof createFormInput>;
export type ListFormsInput = z.infer<typeof listFormsInput>;
export type UpdateFormInput = z.infer<typeof updateFormInput>;
export type UpdateFormSlugInput = z.infer<typeof updateFormSlugInput>;
export type CreateFormFieldInput = z.infer<typeof createFormFieldInput>;
export type UpdateFormFieldInput = z.infer<typeof updateFormFieldInput>;
export type ReorderFormFieldsInput = z.infer<typeof reorderFormFieldsInput>;
export type FieldIdInput = z.infer<typeof fieldIdInput>;
