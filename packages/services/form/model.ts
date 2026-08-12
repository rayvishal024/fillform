import { z } from "zod";

export const formStatusSchema = z.enum(["draft", "published", "closed"]);

export const createFormInput = z
     .object({
          title: z.string().trim().min(1).max(255),
          description: z.string().trim().max(5000).optional(),
     })
     .strict();

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

export type CreateFormInput = z.infer<typeof createFormInput>;
export type ListFormsInput = z.infer<typeof listFormsInput>;
export type UpdateFormInput = z.infer<typeof updateFormInput>;
export type UpdateFormSlugInput = z.infer<typeof updateFormSlugInput>;
