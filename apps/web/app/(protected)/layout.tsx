"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { trpc } from "~/trpc/client"

export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const currentUser = trpc.auth.getCurrentUser.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!currentUser.isLoading && (currentUser.error || !currentUser.data)) {
      router.replace("/signin")
    }
  }, [currentUser.data, currentUser.error, currentUser.isLoading, router])

  if (currentUser.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </main>
    )
  }

  if (currentUser.error || !currentUser.data) {
    return null
  }

  return <>{children}</>
}
