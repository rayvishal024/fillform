import { FormsPage } from "~/components/forms/forms-page"
import { WorkspaceShell } from "~/components/workspace-shell"

export default function FormsRoute() {
  return (
    <WorkspaceShell title="Forms">
      <FormsPage />
    </WorkspaceShell>
  )
}
