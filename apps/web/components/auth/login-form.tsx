"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { GoogleSignInButton } from "~/components/auth/google-sign-in-button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import { trpc } from "~/trpc/client"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string().min(1, "Enter your password").max(100),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  
  const login = trpc.auth.loginUserWithEmailAndPassword.useMutation({
    onSuccess: () => router.push("/dashboard"),
  })

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit((values) => login.mutate(values))}
      noValidate
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-balance text-muted-foreground">Sign in to continue to your FillForm workspace.</p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" autoComplete="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
                      <Input id="password" placeholder="••••••••" type="password" autoComplete="current-password" aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
        {login.error && <FieldError>{login.error.message}</FieldError>}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
        <FieldSeparator>Or continue with</FieldSeparator>
        <GoogleSignInButton />
        <FieldDescription className="text-center">
          Don&apos;t have an account? <Link href="/signup" className="underline underline-offset-4">Create an account</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
