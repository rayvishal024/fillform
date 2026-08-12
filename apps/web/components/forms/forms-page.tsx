"use client"

import Link from "next/link"
import { FilePenLine, Trash2 } from "lucide-react"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { FormCreateDialog } from "~/components/forms/form-create-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Skeleton } from "~/components/ui/skeleton"
import { trpc } from "~/trpc/client"

type FormStatus = "draft" | "published" | "closed"
type StatusFilter = FormStatus | "all"

const statusLabels: Record<StatusFilter, string> = {
  all: "All statuses",
  draft: "Draft",
  published: "Published",
  closed: "Closed",
}

function statusVariant(status: FormStatus) {
  if (status === "published") return "default" as const
  if (status === "closed") return "secondary" as const
  return "outline" as const
}

export function FormsPage() {
  const [status, setStatus] = useState<StatusFilter>("all")
  const [offset, setOffset] = useState(0)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const utils = trpc.useUtils()
  const forms = trpc.form.list.useQuery({
    limit: 12,
    offset,
    ...(status === "all" ? {} : { status }),
  })

  const deleteForm = trpc.form.delete.useMutation({
    onSuccess: async () => {
      await utils.form.list.invalidate()
      toast.success("Form moved to trash")
      setDeleteId(null)
    },
    onError: (error) => toast.error(error.message || "Unable to delete form"),
  })

  const items = forms.data?.items ?? []

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your forms</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create and manage the forms that power your workflow.</p>
        </div>
        <FormCreateDialog />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{forms.data ? `${forms.data.items.length} form${forms.data.items.length === 1 ? "" : "s"}` : "Loading forms…"}</p>
        <Select value={status} onValueChange={(value) => { setStatus(value as StatusFilter); setOffset(0) }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(statusLabels) as StatusFilter[]).map((value) => <SelectItem key={value} value={value}>{statusLabels[value]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {forms.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-3xl" />)}
        </div>
      ) : forms.error ? (
        <Card className="rounded-3xl"><CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><p className="font-medium">Unable to load your forms</p><p className="text-sm text-muted-foreground">{forms.error.message}</p><Button variant="outline" onClick={() => forms.refetch()}>Try again</Button></CardContent></Card>
      ) : items.length === 0 ? (
        <Card className="rounded-3xl border-dashed"><CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10"><FilePenLine className="size-6 text-primary" /></div><div><p className="font-medium">{status === "all" ? "Create your first form" : `No ${statusLabels[status].toLowerCase()} forms`}</p><p className="mt-1 text-sm text-muted-foreground">Start collecting thoughtful responses in a few minutes.</p></div>{status === "all" && <FormCreateDialog />}</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((form) => (
              <Card key={form.id} className="group rounded-3xl transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{form.title}</CardTitle>
                      <CardDescription className="mt-1 truncate">/{form.slug}</CardDescription>
                    </div>
                    <Badge variant={statusVariant(form.status)}>{statusLabels[form.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="min-h-10 line-clamp-2 text-sm text-muted-foreground">{form.description || "No description added."}</p>
                  <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{form.responseCount} response{form.responseCount === 1 ? "" : "s"}</span>
                    <span>Updated {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}</span>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <Button asChild className="flex-1"><Link href={`/forms/${form.id}`}><FilePenLine /> Edit form</Link></Button>
                    <Button variant="outline" size="icon" aria-label={`Delete ${form.title}`} onClick={() => setDeleteId(form.id)}><Trash2 /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={offset === 0 || forms.isFetching} onClick={() => setOffset(Math.max(0, offset - 12))}>Previous</Button>
            <Button variant="outline" disabled={forms.data?.nextOffset === null || forms.isFetching} onClick={() => forms.data?.nextOffset !== null && forms.data?.nextOffset !== undefined && setOffset(forms.data.nextOffset)}>Next</Button>
          </div>
        </>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Move this form to trash?</AlertDialogTitle><AlertDialogDescription>This form will disappear from your workspace. This action does not permanently delete its data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleteForm.isPending} onClick={() => deleteId !== null && deleteForm.mutate({ formId: deleteId })}>{deleteForm.isPending ? "Deleting…" : "Move to trash"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
