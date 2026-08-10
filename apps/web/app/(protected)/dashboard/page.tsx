"use client"

import { useRouter } from "next/navigation"

import { Button } from "~/components/ui/button"
import { trpc } from "~/trpc/client"

export default function DashboardPage() {
  const router = useRouter()
  const currentUser = trpc.auth.getCurrentUser.useQuery()
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => router.replace("/signin"),
  })

  if (currentUser.isLoading || !currentUser.data) {
    return null
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">FillForm workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {currentUser.data.fullName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{currentUser.data.email}</p>
        </div>
        <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
          {logout.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </main>
  )
}