import { FormEditor } from "~/components/forms/form-editor"
import { WorkspaceShell } from "~/components/workspace-shell"

export default async function FormEditorRoute({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  const parsedFormId = Number(formId)

  return (
    <WorkspaceShell title="Edit form">
      <FormEditor formId={parsedFormId} />
    </WorkspaceShell>
  )
}
