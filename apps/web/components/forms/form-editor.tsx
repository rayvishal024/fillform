"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Copy, Save, Trash2 } from "lucide-react"
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

const statuses = ["draft", "published", "closed"] as const

export function FormEditor({ formId }: { formId: number }) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const formQuery = trpc.form.getById.useQuery({ formId }, { enabled: Number.isInteger(formId) && formId > 0 })
  const detailsForm = useForm<FormDetailsValues>({
    resolver: zodResolver(formDetailsSchema),
    defaultValues: { title: "", description: "", bannerUrl: "", status: "draft" },
  })
  const slugForm = useForm<SlugValues>({ resolver: zodResolver(slugSchema), defaultValues: { slug: "" } })

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

  if (formQuery.isLoading) return <EditorSkeleton />
  if (formQuery.error || !formQuery.data) {
    return <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-6 text-center"><p className="font-medium">Form not found</p><p className="text-sm text-muted-foreground">This form may have been deleted or you may not have access to it.</p><Button asChild variant="outline"><Link href="/forms"><ArrowLeft /> Back to forms</Link></Button></div>
  }

  const submitDetails = detailsForm.handleSubmit((values) => updateForm.mutate({
    formId,
    title: values.title,
    description: values.description || null,
    bannerUrl: values.bannerUrl || null,
    status: values.status,
  }))
  const submitSlug = slugForm.handleSubmit((values) => updateSlug.mutate({ formId, slug: values.slug }))

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-3"><Link href="/forms"><ArrowLeft /> Back to forms</Link></Button>
          <div className="flex items-center gap-3"><h2 className="text-3xl font-semibold tracking-tight">Edit form</h2><Badge variant={formQuery.data.status === "published" ? "default" : "outline"}>{formQuery.data.status}</Badge></div>
          <p className="mt-2 text-sm text-muted-foreground">Update the form details and public URL.</p>
        </div>
        <Button variant="outline" onClick={() => setDeleteOpen(true)}><Trash2 /> Move to trash</Button>
      </div>

      <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Form details</CardTitle><CardDescription>These details are shown to people filling out your form.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={submitDetails} noValidate>
              <FieldGroup>
                <Field><FieldLabel htmlFor="form-title">Title</FieldLabel><Input id="form-title" aria-invalid={!!detailsForm.formState.errors.title} {...detailsForm.register("title")} /><FieldError errors={[detailsForm.formState.errors.title]} /></Field>
                <Field><FieldLabel htmlFor="form-description">Description</FieldLabel><Textarea id="form-description" rows={5} aria-invalid={!!detailsForm.formState.errors.description} {...detailsForm.register("description")} /><FieldDescription>Explain what responses you are looking for.</FieldDescription><FieldError errors={[detailsForm.formState.errors.description]} /></Field>
                <Field><FieldLabel htmlFor="form-banner">Banner image URL <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel><Input id="form-banner" type="url" placeholder="https://example.com/banner.jpg" aria-invalid={!!detailsForm.formState.errors.bannerUrl} {...detailsForm.register("bannerUrl")} /><FieldError errors={[detailsForm.formState.errors.bannerUrl]} /></Field>
                <Field><FieldLabel htmlFor="form-status">Status</FieldLabel><Controller control={detailsForm.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="form-status"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>)}</SelectContent></Select>} /><FieldError errors={[detailsForm.formState.errors.status]} /></Field>
                <div className="flex justify-end"><Button type="submit" disabled={updateForm.isPending || !detailsForm.formState.isDirty}><Save />{updateForm.isPending ? "Saving…" : "Save changes"}</Button></div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl"><CardHeader><CardTitle>Form URL</CardTitle><CardDescription>Choose the slug that will identify this form when its public page is enabled.</CardDescription></CardHeader><CardContent><form onSubmit={submitSlug} className="space-y-4" noValidate><Field><FieldLabel htmlFor="form-slug">Slug</FieldLabel><Input id="form-slug" aria-invalid={!!slugForm.formState.errors.slug} {...slugForm.register("slug")} /><FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription><FieldError errors={[slugForm.formState.errors.slug]} /></Field><Button type="submit" variant="outline" className="w-full" disabled={updateSlug.isPending || !slugForm.formState.isDirty}>{updateSlug.isPending ? "Updating…" : "Update slug"}</Button></form><Button variant="ghost" size="sm" className="mt-5" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}`).then(() => toast.success("Link copied"))}><Copy /> Copy dashboard link</Button></CardContent></Card>
          <Card className="rounded-3xl bg-muted/30"><CardContent className="space-y-3 p-5"><p className="text-sm font-medium">Responses</p><p className="text-3xl font-semibold">{formQuery.data.responseCount}</p><p className="text-sm text-muted-foreground">Responses collected for this form.</p></CardContent></Card>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Move this form to trash?</AlertDialogTitle><AlertDialogDescription>This removes the form from your workspace without permanently deleting its data.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleteForm.isPending} onClick={() => deleteForm.mutate({ formId })}>{deleteForm.isPending ? "Deleting…" : "Move to trash"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}

function EditorSkeleton() {
  return <div className="space-y-8 p-6 lg:p-8"><Skeleton className="h-24 w-full rounded-3xl" /><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><Skeleton className="h-120 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" /></div></div>
}
