import { FormEditor } from "~/components/forms/form-editor"
import { WorkspaceShell } from "~/components/workspace-shell"

export default async function FieldsRoute({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  const parsedFormId = Number(formId)

  return (
    <WorkspaceShell title="Field builder">
      <FormEditor formId={parsedFormId} view="fields" />
    </WorkspaceShell>
  )
}
