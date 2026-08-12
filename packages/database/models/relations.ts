import { relations } from "drizzle-orm";
import { formFields } from "./form-feilds";
import { formResponses } from "./form-responses";
import { formThemes } from "./form-themes";
import { forms } from "./forms";
import { responseAnswers } from "./response_answers";
import { sessionsTable } from "./session";
import { usersTable } from "./user";

export const usersRelations = relations(usersTable, ({ many }) => ({
     sessions: many(sessionsTable),
     forms: many(forms),
     themes: many(formThemes),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
     user: one(usersTable, {
          fields: [sessionsTable.userId],
          references: [usersTable.id],
     }),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
     user: one(usersTable, {
          fields: [forms.userId],
          references: [usersTable.id],
     }),
     theme: one(formThemes, {
          fields: [forms.themeId],
          references: [formThemes.id],
     }),
     fields: many(formFields),
     responses: many(formResponses),
}));

export const formThemesRelations = relations(formThemes, ({ one, many }) => ({
     owner: one(usersTable, {
          fields: [formThemes.ownerId],
          references: [usersTable.id],
     }),
     forms: many(forms),
}));

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
     form: one(forms, {
          fields: [formFields.formId],
          references: [forms.id],
     }),
     answers: many(responseAnswers),
}));

export const formResponsesRelations = relations(
     formResponses,
     ({ one, many }) => ({
          form: one(forms, {
               fields: [formResponses.formId],
               references: [forms.id],
          }),
          answers: many(responseAnswers),
     }),
);

export const responseAnswersRelations = relations(
     responseAnswers,
     ({ one }) => ({
          response: one(formResponses, {
               fields: [responseAnswers.responseId],
               references: [formResponses.id],
          }),
          field: one(formFields, {
               fields: [responseAnswers.fieldId],
               references: [formFields.id],
          }),
     }),
);