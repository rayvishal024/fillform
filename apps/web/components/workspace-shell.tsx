"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, LayoutDashboard, LogOut, MoonStar, Settings, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { TooltipProvider } from "~/components/ui/tooltip"
import { trpc } from "~/trpc/client"

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Forms", href: "/forms", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function WorkspaceShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentUser = trpc.auth.getCurrentUser.useQuery()
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => router.replace("/signin") })
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (currentUser.isLoading || !currentUser.data) {
    return null
  }

  const initials = currentUser.data.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

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
                      <SidebarMenuButton asChild isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))} tooltip={item.label}>
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
            <h1 className="text-sm font-semibold">{title}</h1>

            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label={mounted && resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {mounted && resolvedTheme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
