import { WorkspaceShell } from "~/components/workspace-shell"

export default function DashboardPage() {
  return (
    <WorkspaceShell title="Overview">
      <div className="space-y-8 p-6 lg:p-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">FillForm workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your forms, in one focused workspace.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create, organize, and publish forms without losing sight of the responses that matter.</p>
        </div>
        <div className="rounded-3xl border border-dashed p-8 text-sm text-muted-foreground">
          Start by opening Forms in the workspace navigation and create your first form.
        </div>
      </div>
    </WorkspaceShell>
  )
}
