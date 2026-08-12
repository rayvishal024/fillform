"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { trpc } from "~/trpc/client"

const createFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a form title").max(255, "Title must be 255 characters or fewer"),
  description: z.string().trim().max(5000, "Description must be 5,000 characters or fewer").optional(),
})

type CreateFormValues = z.infer<typeof createFormSchema>

export function FormCreateDialog() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [open, setOpen] = useState(false)
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { title: "", description: "" },
  })

  const createForm = trpc.form.create.useMutation({
    onSuccess: async ({ id }) => {
      await utils.form.list.invalidate()
      toast.success("Form created")
      form.reset()
      setOpen(false)
      router.push(`/forms/${id}`)
    },
    onError: (error) => toast.error(error.message || "Unable to create form"),
  })

  const submit = form.handleSubmit((values) => createForm.mutate({
    title: values.title,
    ...(values.description ? { description: values.description } : {}),
  }))

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen)
      if (!nextOpen) form.reset()
    }}>
      <DialogTrigger asChild>
        <Button size="lg"><Plus /> Create form</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new form</DialogTitle>
          <DialogDescription>Start with a title and optional description. You can add fields from the editor.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-form-title">Title</FieldLabel>
              <Input id="new-form-title" placeholder="Customer feedback" autoFocus aria-invalid={!!form.formState.errors.title} {...form.register("title")} />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-form-description">Description <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
              <Textarea id="new-form-description" placeholder="Tell people what this form is for" rows={4} aria-invalid={!!form.formState.errors.description} {...form.register("description")} />
              <FieldDescription>Up to 5,000 characters.</FieldDescription>
              <FieldError errors={[form.formState.errors.description]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createForm.isPending}>{createForm.isPending ? "Creating…" : "Create form"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
