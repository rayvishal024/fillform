import { randomBytes } from "node:crypto";
import {and,count, db,desc,eq,isNull,
} from "@repo/database";
import { formResponses, forms } from "@repo/database/schema";
import {
     createFormInput,
     formStatusSchema,
     listFormsInput,
     updateFormInput,
     updateFormSlugInput,
     type CreateFormInput,
     type ListFormsInput,
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

class FormService {
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

          return form;
     }
}

export default FormService;
export { RESERVED_SLUGS, slugify, formStatusSchema };
