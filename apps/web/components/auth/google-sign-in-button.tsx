"use client"

import Script from "next/script"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { FieldError } from "~/components/ui/field"
import { env } from "~/env"
import { trpc } from "~/trpc/client"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (element: HTMLElement, options: Record<string, string | number>) => void
        }
      }
    }
  }
}

export function GoogleSignInButton() {
  const router = useRouter()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const loginWithGoogle = trpc.auth.loginUserWithGoogle.useMutation({
    onSuccess: () => router.push("/dashboard"),
  })

  const initializeGoogle = () => {
    if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !buttonRef.current || !window.google) {
      return
    }

    buttonRef.current.replaceChildren()
    window.google.accounts.id.initialize({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: ({ credential }) => loginWithGoogle.mutate({ idToken: credential }),
    })
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: 320,
      logo_alignment: "left",
      border_radius: 10,
      text: "continue_with",
    })
    setScriptReady(true)
  }

  if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return <FieldError>Google authentication is not configured.</FieldError>
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
        onReady={initializeGoogle}
      />
      {!scriptReady && <p className="text-center text-sm text-muted-foreground">Loading Google…</p>}
      <div ref={buttonRef} className="flex min-h-10 w-full justify-center overflow-hidden rounded-xl" />
      {loginWithGoogle.error && <FieldError>{loginWithGoogle.error.message}</FieldError>}
    </div>
  )
}
