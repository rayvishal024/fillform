"use client"

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  CircleHelp,
  Copy,
  GripVertical,
  Hash,
  ImageIcon,
  Mail,
  Minus,
  Phone,
  Plus,
  Save,
  Star,
  TextCursorInput,
  Trash2,
  Type,
  Wand2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Skeleton } from "~/components/ui/skeleton"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import { trpc } from "~/trpc/client"

const formDetailsSchema = z.object({
  title: z.string().trim().min(1, "Enter a form title").max(255),
  description: z.string().trim().max(5000).nullable(),
  bannerUrl: z.string().trim().url("Enter a valid URL").max(2048).nullable(),
  status: z.enum(["draft", "published", "closed"]),
})

const slugSchema = z.object({
  slug: z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
})

type FormDetailsValues = z.infer<typeof formDetailsSchema>
type SlugValues = z.infer<typeof slugSchema>

type FormFieldType =
  | "short_text"
  | "long_text"
  | "date"
  | "image"
  | "rating"
  | "checkbox"
  | "radio"
  | "select"
  | "number"
  | "email"
  | "phone"

type FieldDraft = {
  type: FormFieldType
  label: string
  placeholder: string
  helpText: string
  isRequired: boolean
  optionText: string
}

type BuilderField = {
  id: number
  formId: number
  type: FormFieldType
  label: string
  placeholder: string | null
  helpText: string | null
  isRequired: boolean
  orderIndex: number
  options: unknown
  validation: unknown
  createdAt: string
  updatedAt: string
}

const statuses = ["draft", "published", "closed"] as const

const fieldTypes = [
  { type: "short_text", label: "Short text", description: "One-line answer", icon: Type },
  { type: "long_text", label: "Paragraph", description: "Long-form response", icon: TextCursorInput },
  { type: "email", label: "Email", description: "Email address", icon: Mail },
  { type: "phone", label: "Phone", description: "Phone number", icon: Phone },
  { type: "number", label: "Number", description: "Numeric answer", icon: Hash },
  { type: "date", label: "Date", description: "Calendar entry", icon: CalendarDays },
  { type: "checkbox", label: "Checkbox", description: "Multi-select choice", icon: CheckSquare },
  { type: "radio", label: "Multiple choice", description: "Single select", icon: CircleHelp },
  { type: "select", label: "Dropdown", description: "Dropdown menu", icon: Minus },
  { type: "rating", label: "Rating", description: "Star rating", icon: Star },
  { type: "image", label: "Image upload", description: "Upload a file", icon: ImageIcon },
] as const satisfies ReadonlyArray<{ type: FormFieldType; label: string; description: string; icon: typeof Type }>

const choiceTypes = new Set<FormFieldType>(["checkbox", "radio", "select"])

function getTypeMeta(type: FormFieldType) {
  return fieldTypes.find((option) => option.type === type) ?? fieldTypes[0]
}

function normalizeOptions(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join("\n")
  }

  if (value && typeof value === "object" && "choices" in value && Array.isArray((value as { choices?: unknown[] }).choices)) {
    return (value as { choices: string[] }).choices.join("\n")
  }

  return ""
}

function toBuilderDraft(field?: BuilderField): FieldDraft {
  const fallback = fieldTypes[0]

  return {
    type: field?.type ?? fallback.type,
    label: field?.label ?? "Untitled question",
    placeholder: field?.placeholder ?? "",
    helpText: field?.helpText ?? "",
    isRequired: field?.isRequired ?? false,
    optionText: normalizeOptions(field?.options ?? ""),
  }
}

function fieldOptionValues(optionText: string) {
  return optionText
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50)
}

export function FormEditor({ formId, view = "full" }: { formId: number; view?: "full" | "fields" }) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null)
  const [draft, setDraft] = useState<FieldDraft | null>(null)

  const formQuery = trpc.form.getById.useQuery({ formId }, { enabled: Number.isInteger(formId) && formId > 0 })
  const detailsForm = useForm<FormDetailsValues>({
    resolver: zodResolver(formDetailsSchema),
    defaultValues: { title: "", description: "", bannerUrl: "", status: "draft" },
  })
  const slugForm = useForm<SlugValues>({ resolver: zodResolver(slugSchema), defaultValues: { slug: "" } })
  const createField = trpc.form.createField.useMutation({
    onSuccess: async (field) => {
      await Promise.all([utils.form.getById.invalidate({ formId }), utils.form.list.invalidate()])
      setSelectedFieldId(field.id)
      setDraft(toBuilderDraft(field as BuilderField))
      toast.success("Field added")
    },
    onError: (error) => toast.error(error.message || "Unable to add field"),
  })
  const saveFieldDraft = trpc.form.saveFieldDraft.useMutation({
    onSuccess: async () => {
      await utils.form.getById.invalidate({ formId })
      toast.success("Draft saved")
    },
    onError: (error) => toast.error(error.message || "Unable to save draft"),
  })

  const getFieldDraft = trpc.form.getFieldDraft.useQuery({ formId }, { enabled: Number.isInteger(formId) && formId > 0 })

  const clearFieldDraft = trpc.form.clearFieldDraft.useMutation({
    onSuccess: async () => {
      await utils.form.getById.invalidate({ formId })
      toast.success("Draft cleared")
    },
    onError: (error) => toast.error(error.message || "Unable to clear draft"),
  })
  const updateField = trpc.form.updateField.useMutation({
    onSuccess: async (field) => {
      await Promise.all([utils.form.getById.invalidate({ formId }), utils.form.list.invalidate()])
      setSelectedFieldId(field.id)
      setDraft(toBuilderDraft(field as BuilderField))
      toast.success("Field updated")
    },
    onError: (error) => toast.error(error.message || "Unable to update field"),
  })
  const deleteField = trpc.form.deleteField.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.form.getById.invalidate({ formId }), utils.form.list.invalidate()])
      toast.success("Field deleted")
    },
    onError: (error) => toast.error(error.message || "Unable to delete field"),
  })
  const reorderFields = trpc.form.reorderFields.useMutation({
    onError: (error) => toast.error(error.message || "Unable to reorder fields"),
  })
  const updateForm = trpc.form.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.form.getById.invalidate({ formId }), utils.form.list.invalidate()])
      toast.success("Form saved")
    },
    onError: (error) => toast.error(error.message || "Unable to save form"),
  })
  const updateSlug = trpc.form.updateSlug.useMutation({
    onSuccess: async ({ slug }) => {
      await Promise.all([utils.form.getById.invalidate({ formId }), utils.form.list.invalidate()])
      slugForm.reset({ slug })
      toast.success("Slug updated")
    },
    onError: (error) => toast.error(error.message || "Unable to update slug"),
  })
  const deleteForm = trpc.form.delete.useMutation({
    onSuccess: async () => {
      await utils.form.list.invalidate()
      toast.success("Form moved to trash")
      router.replace("/forms")
    },
    onError: (error) => toast.error(error.message || "Unable to delete form"),
  })

  const fieldItems = formQuery.data?.fields ?? []
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleCreateDraft(type: FormFieldType) {
    setSelectedFieldId(-1)
    setDraft({
      type,
      label: "Untitled question",
      placeholder: "",
      helpText: "",
      isRequired: false,
      optionText: choiceTypes.has(type) ? "Option 1\nOption 2" : "",
    })
  }

  function handleClearDraft() {
    setDraft(null)
    const first = fieldItems[0]
    if (first) {
      setSelectedFieldId(first.id)
      setDraft(toBuilderDraft(first as BuilderField))
    } else {
      setSelectedFieldId(null)
    }
  }

  function handleDeleteCurrentField() {
    if (selectedFieldId && selectedFieldId > 0) {
      deleteField.mutate({ fieldId: selectedFieldId })
      setDraft(null)
      setSelectedFieldId(null)
    }
  }

  function handleSaveDraft() {
    if (!draft) return

    const options = choiceTypes.has(draft.type) ? { choices: fieldOptionValues(draft.optionText) } : undefined

    if (selectedFieldId !== null && selectedFieldId > 0) {
      updateField.mutate({
        fieldId: selectedFieldId,
        type: draft.type,
        label: draft.label.trim(),
        placeholder: draft.placeholder || null,
        helpText: draft.helpText || null,
        isRequired: draft.isRequired,
        options,
      })
      return
    }

    // create
    createField.mutate({
      formId,
      type: draft.type,
      label: draft.label.trim(),
      placeholder: draft.placeholder || null,
      helpText: draft.helpText || null,
      isRequired: draft.isRequired,
      options,
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fieldItems.findIndex((f) => f.id === (active.id as number))
    const newIndex = fieldItems.findIndex((f) => f.id === (over.id as number))
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(fieldItems, oldIndex, newIndex)
    const fieldIds = newOrder.map((f) => f.id)
    reorderFields.mutate({ formId, fieldIds }, { onSuccess: () => utils.form.getById.invalidate({ formId }) })
  }

  useEffect(() => {
    if (formQuery.data) {
      detailsForm.reset({
        title: formQuery.data.title,
        description: formQuery.data.description ?? "",
        bannerUrl: formQuery.data.bannerUrl ?? "",
        status: formQuery.data.status,
      })
      slugForm.reset({ slug: formQuery.data.slug })
    }
  }, [detailsForm, formQuery.data, slugForm])

  useEffect(() => {
    if (!fieldItems.length) {
      if (selectedFieldId !== null && selectedFieldId !== -1) {
        setSelectedFieldId(null)
      }
      return
    }

    if (selectedFieldId === -1) {
      return
    }

    if (selectedFieldId !== null && fieldItems.some((field) => field.id === selectedFieldId)) {
      const currentField = fieldItems.find((field) => field.id === selectedFieldId)
      if (currentField) {
        setDraft((previousDraft) => previousDraft && previousDraft.label.trim() ? previousDraft : toBuilderDraft(currentField as BuilderField))
      }
      return
    }

    const firstField = fieldItems[0]
    if (!firstField) {
      return
    }

    setSelectedFieldId(firstField.id)
    setDraft(toBuilderDraft(firstField as BuilderField))
  }, [fieldItems, selectedFieldId])

  if (formQuery.isLoading) return <EditorSkeleton />
  if (formQuery.error || !formQuery.data) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-medium">Form not found</p>
        <p className="text-sm text-muted-foreground">This form may have been deleted or you may not have access to it.</p>
        <Button asChild variant="outline">
          <Link href="/forms">
            <ArrowLeft /> Back to forms
          </Link>
        </Button>
      </div>
    )
  }

  const submitDetails = detailsForm.handleSubmit((values) =>
    updateForm.mutate({
      formId,
      title: values.title,
      description: values.description || null,
      bannerUrl: values.bannerUrl || null,
      status: values.status,
    })
  )

  const submitSlug = slugForm.handleSubmit((values) =>
    updateSlug.mutate({ formId, slug: values.slug })
  )

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {view === "full" && (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <Button asChild variant="ghost" className="-ml-3 mb-3">
                <Link href="/forms">
                  <ArrowLeft /> Back to forms
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-tight">Edit form</h2>
                <Badge variant={formQuery.data.status === "published" ? "default" : "outline"}>{formQuery.data.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Tailor the structure, flow, and completion experience of your form.</p>
            </div>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Move to trash
            </Button>
          </div>

          <div className="grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Form details</CardTitle>
                <CardDescription>These details are shown to people filling out your form.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitDetails} noValidate>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="form-title">Title</FieldLabel>
                      <Input id="form-title" aria-invalid={!!detailsForm.formState.errors.title} {...detailsForm.register("title")} />
                      <FieldError errors={[detailsForm.formState.errors.title]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="form-description">Description</FieldLabel>
                      <Textarea id="form-description" rows={5} aria-invalid={!!detailsForm.formState.errors.description} {...detailsForm.register("description")} />
                      <FieldDescription>Explain what responses you are looking for.</FieldDescription>
                      <FieldError errors={[detailsForm.formState.errors.description]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="form-banner">
                        Banner image URL <span className="font-normal text-muted-foreground">(optional)</span>
                      </FieldLabel>
                      <Input id="form-banner" type="url" placeholder="https://example.com/banner.jpg" aria-invalid={!!detailsForm.formState.errors.bannerUrl} {...detailsForm.register("bannerUrl")} />
                      <FieldError errors={[detailsForm.formState.errors.bannerUrl]} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="form-status">Status</FieldLabel>
                      <Controller
                        control={detailsForm.control}
                        name="status"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="form-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FieldError errors={[detailsForm.formState.errors.status]} />
                    </Field>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateForm.isPending || !detailsForm.formState.isDirty}>
                        <Save />
                        {updateForm.isPending ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Form URL</CardTitle>
                  <CardDescription>Choose the slug that will identify this form when its public page is enabled.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitSlug} className="space-y-4" noValidate>
                    <Field>
                      <FieldLabel htmlFor="form-slug">Slug</FieldLabel>
                      <Input id="form-slug" aria-invalid={!!slugForm.formState.errors.slug} {...slugForm.register("slug")} />
                      <FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription>
                      <FieldError errors={[slugForm.formState.errors.slug]} />
                    </Field>
                    <Button type="submit" variant="outline" className="w-full" disabled={updateSlug.isPending || !slugForm.formState.isDirty}>
                      {updateSlug.isPending ? "Updating…" : "Update slug"}
                    </Button>
                  </form>
                  <Button variant="ghost" size="sm" className="mt-5" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}`).then(() => toast.success("Link copied"))}>
                    <Copy /> Copy dashboard link
                  </Button>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/forms/${formId}/fields`}>Manage fields</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl bg-muted/30">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-medium">Responses</p>
                  <p className="text-3xl font-semibold">{formQuery.data.responseCount}</p>
                  <p className="text-sm text-muted-foreground">Responses collected for this form.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Field builder always rendered so it can be used on its own page */}
      <Card className="overflow-hidden rounded-3xl border bg-linear-to-br from-background via-background to-primary/3">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Field builder</CardTitle>
              <CardDescription>Build and reorder the questions your respondents will answer.</CardDescription>
            </div>
            <Button variant="default" onClick={() => handleCreateDraft("short_text")}>
              <Plus /> Add field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {fieldTypes.map(({ type, label, icon: Icon }) => (
                  <Button key={type} variant={draft?.type === type ? "default" : "outline"} size="sm" onClick={() => handleCreateDraft(type)} className="gap-2">
                    <Icon className="size-4" />
                    {label}
                  </Button>
                ))}
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fieldItems.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {fieldItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
                        <p className="font-medium">No fields yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">Start with a short text question, then refine the experience for your audience.</p>
                      </div>
                    ) : (
                      fieldItems.map((field) => (
                        <SortableFieldCard
                          key={field.id}
                          field={field as BuilderField}
                          selected={selectedFieldId === field.id}
                          onSelect={() => setSelectedFieldId(field.id)}
                          onDelete={() => deleteField.mutate({ fieldId: field.id })}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              {draft ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Field settings</p>
                      <h3 className="mt-2 text-xl font-semibold">{selectedFieldId !== null && selectedFieldId > 0 ? "Edit question" : "New question"}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedFieldId !== null && selectedFieldId > 0 && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDeleteCurrentField}>
                          <Trash2 /> Delete
                        </Button>
                      )}
                      {(selectedFieldId === -1 || selectedFieldId !== null) && (
                        <Button variant="outline" size="sm" onClick={handleClearDraft}>
                          {selectedFieldId === -1 ? "Discard draft" : "Close"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Field>
                      <FieldLabel>Question type</FieldLabel>
                      <Select value={draft.type} onValueChange={(value) => setDraft((current) => current ? { ...current, type: value as FormFieldType, optionText: choiceTypes.has(value as FormFieldType) && !current.optionText ? "Option 1\nOption 2" : current.optionText } : current)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(({ type, label }) => (
                            <SelectItem key={type} value={type}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input value={draft.label} onChange={(event) => setDraft((current) => current ? { ...current, label: event.target.value } : current)} placeholder="What is your name?" />
                    </Field>

                    <Field>
                      <FieldLabel>Placeholder</FieldLabel>
                      <Input value={draft.placeholder} onChange={(event) => setDraft((current) => current ? { ...current, placeholder: event.target.value } : current)} placeholder="Type your answer here…" />
                    </Field>

                    <Field>
                      <FieldLabel>Helper text</FieldLabel>
                      <Textarea value={draft.helpText} onChange={(event) => setDraft((current) => current ? { ...current, helpText: event.target.value } : current)} rows={3} placeholder="Add optional guidance for respondents." />
                    </Field>

                    {choiceTypes.has(draft.type) && (
                      <Field>
                        <FieldLabel>Choice options</FieldLabel>
                        <Textarea value={draft.optionText} onChange={(event) => setDraft((current) => current ? { ...current, optionText: event.target.value } : current)} rows={5} placeholder={"Option 1\nOption 2\nOption 3"} />
                        <FieldDescription>Separate options with a new line or comma.</FieldDescription>
                      </Field>
                    )}

                    <div className="flex items-center justify-between rounded-xl border bg-background p-3">
                      <div>
                        <p className="font-medium">Required</p>
                        <p className="text-xs text-muted-foreground">Respondents must answer this question.</p>
                      </div>
                      <Switch checked={draft.isRequired} onCheckedChange={(checked) => setDraft((current) => current ? { ...current, isRequired: checked } : current)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    {selectedFieldId === -1 && (
                      <Button variant="ghost" size="sm" onClick={handleClearDraft}>
                        Discard draft
                      </Button>
                    )}
                    <div className="ml-auto">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (!draft) return
                            const payload = {
                              formId,
                              draft: {
                                type: draft.type,
                                label: draft.label.trim(),
                                placeholder: draft.placeholder || null,
                                helpText: draft.helpText || null,
                                isRequired: draft.isRequired,
                                options: choiceTypes.has(draft.type) ? { choices: fieldOptionValues(draft.optionText) } : undefined,
                                optionText: draft.optionText,
                              },
                            }
                            saveFieldDraft.mutate(payload)
                          }}>
                            Save draft
                          </Button>
                          <Button onClick={handleSaveDraft} disabled={createField.isPending || updateField.isPending || deleteField.isPending}>
                            <Wand2 />
                            {selectedFieldId !== null && selectedFieldId > 0 ? "Save changes" : "Add field"}
                          </Button>
                        </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Wand2 className="size-6" />
                  </div>
                  <p className="font-medium">No field selected</p>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">Add a new question or click a field on the left to edit it.</p>
                  <Button onClick={() => handleCreateDraft("short_text")} className="mt-5 gap-2">
                    <Plus /> Add first field
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {view === "full" && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move this form to trash?</AlertDialogTitle>
              <AlertDialogDescription>This removes the form from your workspace without permanently deleting its data.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={deleteForm.isPending} onClick={() => deleteForm.mutate({ formId })}>
                {deleteForm.isPending ? "Deleting…" : "Move to trash"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )

}

function SortableFieldCard({
  field,
  selected,
  onSelect,
  onDelete,
}: {
  field: BuilderField
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const meta = getTypeMeta(field.type)
  const Icon = meta.icon

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={selected ? "relative rounded-2xl border border-primary bg-primary/5 shadow-sm" : "relative rounded-2xl border bg-background shadow-sm"}
    >
      <div className="flex w-full items-center gap-3 p-3 text-left">
        <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-3 overflow-hidden text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{field.label || "Untitled question"}</p>
              {field.isRequired && <Badge variant="secondary">Required</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{meta.label}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground"
            aria-label="Drag field"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="size-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground"
            aria-label="Delete field"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {isDragging && <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-primary/60" />}
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div className="space-y-8 p-6 lg:p-8">
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-120 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  )
}
