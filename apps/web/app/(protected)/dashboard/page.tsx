"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, LayoutDashboard, LogOut, Settings } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { trpc } from "~/trpc/client"
import { TooltipProvider } from "~/components/ui/tooltip"

export default function DashboardPage() {

  const router = useRouter()
  const currentUser = trpc.auth.getCurrentUser.useQuery()

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => router.replace("/signin"),
  })

  if (currentUser.isLoading || !currentUser.data) {
    return null
  }

  const initials = currentUser.data.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const navigation = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Forms", href: "/forms", icon: FileText },
    { label: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" tooltip="FillForm">
                  <Link href="/dashboard">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">F</span>
                    <span className="font-semibold">FillForm</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip={currentUser.data.fullName}>
                  <Avatar className="size-8">
                    {currentUser.data.avatarUrl && <AvatarImage src={currentUser.data.avatarUrl} alt={currentUser.data.fullName} />}
                    <AvatarFallback>{initials || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="w-full truncate text-sm font-medium">{currentUser.data.fullName}</span>
                    <span className="w-full truncate text-xs text-muted-foreground">{currentUser.data.email}</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sign out" onClick={() => logout.mutate()} disabled={logout.isPending}>
                  <LogOut />
                  <span>{logout.isPending ? "Signing out…" : "Sign out"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b px-4 lg:h-16 lg:px-6">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <h1 className="text-sm font-semibold">Overview</h1>
          </header>
          <main className="flex-1 space-y-8 p-6 lg:p-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground">FillForm workspace</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {currentUser.data.fullName}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create and manage your forms from one focused workspace.</p>
            </div>
            <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">Your workspace is ready. Start by creating your first form.</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
