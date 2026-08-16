import { randomBytes } from "node:crypto";
import {
     and,
     asc,
     count,
     db,
     desc,
     eq,
     isNull,
     max,
} from "@repo/database";
import { formFields, formResponses, forms } from "@repo/database/schema";
import {
     createFormFieldInput,
     createFormInput,
     formStatusSchema,
     listFormsInput,
     reorderFormFieldsInput,
     updateFormFieldInput,
     updateFormInput,
     updateFormSlugInput,
     type CreateFormFieldInput,
     type CreateFormInput,
     type ListFormsInput,
     type ReorderFormFieldsInput,
     type UpdateFormFieldInput,
     type UpdateFormInput,
     type UpdateFormSlugInput,
} from "./model";

const RESERVED_SLUGS = new Set([
     "api",
     "admin",
     "app",
     "dashboard",
     "login",
     "signup",
     "settings",
     "f",
]);

const MAX_SLUG_ATTEMPTS = 5;

type FormFieldSummary = typeof formFields.$inferSelect;

type FormSummary = {
     id: number;
     title: string;
     description: string | null;
     slug: string;
     bannerUrl: string | null;
     status: "draft" | "published" | "closed";
     createdAt: Date;
     updatedAt: Date;
     responseCount: number;
     fields: FormFieldSummary[];
};

function isUniqueViolation(error: unknown) {
     return (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505"
     );
}

function slugify(title: string) {
     const slug = title
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 255)
          .replace(/-+$/g, "");

     return slug || "form";
}

function withRandomSuffix(slug: string) {
     const suffix = randomBytes(3).toString("hex");
     const base = slug.slice(0, 248).replace(/-+$/g, "");
     return `${base}-${suffix}`;
}

function formColumns() {
     return {
          id: forms.id,
          title: forms.title,
          description: forms.description,
          slug: forms.slug,
          bannerUrl: forms.bannerUrl,
          status: forms.status,
          createdAt: forms.createdAt,
          updatedAt: forms.updatedAt,
     };
}

function fieldColumns() {
     return {
          id: formFields.id,
          formId: formFields.formId,
          type: formFields.type,
          label: formFields.label,
          placeholder: formFields.placeholder,
          helpText: formFields.helpText,
          isRequired: formFields.isRequired,
          orderIndex: formFields.orderIndex,
          options: formFields.options,
          validation: formFields.validation,
          createdAt: formFields.createdAt,
          updatedAt: formFields.updatedAt,
     };
}

class FormService {
     // Lightweight in-memory draft storage: key = `${userId}:${formId}`
     private fieldDrafts: Map<string, unknown> = new Map()
     private async ensureOwnedForm(userId: string, formId: number) {
          const [form] = await db
               .select({ id: forms.id })
               .from(forms)
               .where(
                    and(
                         eq(forms.id, formId),
                         eq(forms.userId, userId),
                         isNull(forms.deletedAt),
                    ),
               );

          if (!form) {
               throw new Error("Form not found");
          }
     }

     private async loadFormFields(formId: number) {
          return db
               .select(fieldColumns())
               .from(formFields)
               .where(eq(formFields.formId, formId))
               .orderBy(asc(formFields.orderIndex), asc(formFields.id));
     }

     public async create(userId: string, payload: CreateFormInput) {
          const input = createFormInput.parse(payload);
          const baseSlug = slugify(input.title);

          for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
               const slug =
                    attempt === 0 && !RESERVED_SLUGS.has(baseSlug)
                         ? baseSlug
                         : withRandomSuffix(baseSlug);

               try {
                    const [form] = await db
                         .insert(forms)
                         .values({
                              userId,
                              title: input.title,
                              description: input.description,
                              slug,
                              status: "draft",
                         })
                         .returning({ id: forms.id, slug: forms.slug });

                    if (!form) {
                         throw new Error("Unable to create form");
                    }

                    return form;
               } catch (error) {
                    if (isUniqueViolation(error) && attempt < MAX_SLUG_ATTEMPTS - 1) {
                         continue;
                    }
                    if (isUniqueViolation(error)) {
                         throw new Error("Unable to generate a unique form slug");
                    }
                    throw error;
               }
          }

          throw new Error("Unable to generate a unique form slug");
     }

     public async list(userId: string, payload: ListFormsInput) {
          const input = listFormsInput.parse(payload);
          const filters = [eq(forms.userId, userId), isNull(forms.deletedAt)];

          if (input.status) {
               filters.push(eq(forms.status, input.status));
          }

          const rows = await db
               .select({
                    ...formColumns(),
                    responseCount: count(formResponses.id),
               })
               .from(forms)
               .leftJoin(formResponses, eq(formResponses.formId, forms.id))
               .where(and(...filters))
               .groupBy(
                    forms.id,
                    forms.title,
                    forms.description,
                    forms.slug,
                    forms.bannerUrl,
                    forms.status,
                    forms.createdAt,
                    forms.updatedAt,
               )
               .orderBy(desc(forms.updatedAt), desc(forms.id))
               .limit(input.limit + 1)
               .offset(input.offset);

          const hasMore = rows.length > input.limit;
          const data = hasMore ? rows.slice(0, input.limit) : rows;

          return {
               items: data,
               nextOffset: hasMore ? input.offset + input.limit : null,
          };
     }

     public async createField(userId: string, payload: CreateFormFieldInput) {
          const input = createFormFieldInput.parse(payload);
          await this.ensureOwnedForm(userId, input.formId);

          const [maxRow] = await db
               .select({ maxIndex: max(formFields.orderIndex) })
               .from(formFields)
               .where(eq(formFields.formId, input.formId));

          const orderIndex = (maxRow?.maxIndex ?? -1) + 1;
          const [field] = await db
               .insert(formFields)
               .values({
                    formId: input.formId,
                    type: input.type,
                    label: input.label,
                    placeholder: input.placeholder,
                    helpText: input.helpText,
                    isRequired: input.isRequired ?? false,
                    orderIndex,
                    options: input.options ?? null,
                    validation: input.validation ?? null,
               })
               .returning(fieldColumns());

          if (!field) {
               throw new Error("Unable to create field");
          }

          return field;

     }

     public async saveFieldDraft(userId: string, formId: number, draft: unknown) {
                    await this.ensureOwnedForm(userId, formId)
                    const key = `${userId}:${formId}`
                    this.fieldDrafts.set(key, draft)
                    return { success: true as const }
               }

               public async getFieldDraft(userId: string, formId: number) {
                    await this.ensureOwnedForm(userId, formId)
                    const key = `${userId}:${formId}`
                    const draft = this.fieldDrafts.get(key)
                    return { draft: draft ?? null }
               }

               public async clearFieldDraft(userId: string, formId: number) {
                    await this.ensureOwnedForm(userId, formId)
                    const key = `${userId}:${formId}`
                    this.fieldDrafts.delete(key)
                    return { success: true as const }
               }


     public async updateField(userId: string, payload: UpdateFormFieldInput) {
          const { fieldId, type, label, placeholder, helpText, isRequired, options, validation } = updateFormFieldInput.parse(payload);

          const [field] = await db
               .select({ formId: formFields.formId })
               .from(formFields)
               .where(eq(formFields.id, fieldId));

          if (!field) {
               throw new Error("Field not found");
          }

          await this.ensureOwnedForm(userId, field.formId);

          const values = {
               ...(type !== undefined ? { type } : {}),
               ...(label !== undefined ? { label } : {}),
               ...(placeholder !== undefined ? { placeholder } : {}),
               ...(helpText !== undefined ? { helpText } : {}),
               ...(isRequired !== undefined ? { isRequired } : {}),
               ...(options !== undefined ? { options } : {}),
               ...(validation !== undefined ? { validation } : {}),
          };

          const [updatedField] = await db
               .update(formFields)
               .set(values)
               .where(eq(formFields.id, fieldId))
               .returning(fieldColumns());

          if (!updatedField) {
               throw new Error("Field not found");
          }

          return updatedField;
     }

     public async deleteField(userId: string, fieldId: number) {
          const [field] = await db
               .select({ formId: formFields.formId })
               .from(formFields)
               .where(eq(formFields.id, fieldId));

          if (!field) {
               throw new Error("Field not found");
          }

          await this.ensureOwnedForm(userId, field.formId);

          const [deletedField] = await db.delete(formFields).where(eq(formFields.id, fieldId)).returning({ id: formFields.id });

          if (!deletedField) {
               throw new Error("Field not found");
          }

          return { success: true as const };
     }

     public async reorderFields(userId: string, payload: ReorderFormFieldsInput) {
          const { formId, fieldIds } = reorderFormFieldsInput.parse(payload);
          await this.ensureOwnedForm(userId, formId);

          if (fieldIds.length !== new Set(fieldIds).size) {
               throw new Error("Invalid field order");
          }

          const fields = await db
               .select({ id: formFields.id })
               .from(formFields)
               .where(eq(formFields.formId, formId));

          const existingFieldIds = new Set(fields.map((item) => item.id));

          if (
               fieldIds.length !== fields.length ||
               fieldIds.some((fieldId) => !existingFieldIds.has(fieldId))
          ) {
               throw new Error("Invalid field order");
          }

          await Promise.all(
               fieldIds.map((fieldId, index) =>
                    db.update(formFields).set({ orderIndex: index }).where(eq(formFields.id, fieldId)),
               ),
          );

          return { success: true as const };
     }

     public async update(userId: string, payload: UpdateFormInput): Promise<FormSummary> {
          const { formId, title, description, bannerUrl, status } = updateFormInput.parse(payload);
          const values = {
               ...(title !== undefined ? { title } : {}),
               ...(description !== undefined ? { description } : {}),
               ...(bannerUrl !== undefined ? { bannerUrl } : {}),
               ...(status !== undefined ? { status } : {}),
          };

          const [form] = await db
               .update(forms)
               .set(values)
               .where(
                    and(
                         eq(forms.id, formId),
                         eq(forms.userId, userId),
                         isNull(forms.deletedAt),
                    ),
               )
               .returning(formColumns());

          if (!form) {
               throw new Error("Form not found");
          }

          return this.getById(userId, form.id);
     }

     public async updateSlug(userId: string, payload: UpdateFormSlugInput) {
          const { formId, slug } = updateFormSlugInput.parse(payload);

          if (RESERVED_SLUGS.has(slug)) {
               throw new Error("This slug is reserved");
          }

          let form: { id: number; slug: string } | undefined;
          try {
               [form] = await db
                    .update(forms)
                    .set({ slug })
                    .where(
                         and(
                              eq(forms.id, formId),
                              eq(forms.userId, userId),
                              isNull(forms.deletedAt),
                         ),
                    )
                    .returning({ id: forms.id, slug: forms.slug });
          } catch (error) {
               if (isUniqueViolation(error)) {
                    throw new Error("Slug already exists");
               }
               throw error;
          }

          if (!form) {
               throw new Error("Form not found");
          }

          return form;
     }

     public async delete(userId: string, formId: number) {
          const [form] = await db
               .update(forms)
               .set({ deletedAt: new Date() })
               .where(
                    and(
                         eq(forms.id, formId),
                         eq(forms.userId, userId),
                         isNull(forms.deletedAt),
                    ),
               )
               .returning({ id: forms.id });

          if (!form) {
               throw new Error("Form not found");
          }

          return { success: true as const };
     }

     public async getById(userId: string, formId: number): Promise<FormSummary> {
          const [form] = await db
               .select({
                    ...formColumns(),
                    responseCount: count(formResponses.id),
               })
               .from(forms)
               .leftJoin(formResponses, eq(formResponses.formId, forms.id))
               .where(
                    and(
                         eq(forms.id, formId),
                         eq(forms.userId, userId),
                         isNull(forms.deletedAt),
                    ),
               )
               .groupBy(
                    forms.id,
                    forms.title,
                    forms.description,
                    forms.slug,
                    forms.bannerUrl,
                    forms.status,
                    forms.createdAt,
                    forms.updatedAt,
               );

          if (!form) {
               throw new Error("Form not found");
          }

          const fields = await this.loadFormFields(formId);

          return {
               ...form,
               fields,
          };
     }
}

export default FormService;
export { RESERVED_SLUGS, slugify, formStatusSchema };
