"use client"

import { SignupForm } from "~/components/auth/signup-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { LayoutBottomIcon } from "@hugeicons/core-free-icons"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} className="size-4" />
            </div>
            FillForm
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.85_0.12_80/.35),transparent_35%),radial-gradient(circle_at_80%_70%,oklch(0.65_0.15_250/.35),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <p className="max-w-md text-4xl font-semibold tracking-tight">
            Turn ideas into forms people love to complete.
          </p>
          <p className="mt-4 max-w-md text-primary-foreground/70">
            Build, share, and manage your forms from one focused workspace.
          </p>
        </div>
      </div>
    </div>
  )
}
