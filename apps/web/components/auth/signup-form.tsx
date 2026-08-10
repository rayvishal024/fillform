"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { GoogleSignInButton } from "~/components/auth/google-sign-in-button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { cn } from "~/lib/utils"
import { trpc } from "~/trpc/client"

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be no longer than 100 characters")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character"),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
})

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  })
  const createUser = trpc.auth.createUserWithEmailAndPassword.useMutation({
    onSuccess: () => router.push("/dashboard"),
  })

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit((values) => createUser.mutate({ fullName: values.fullName, email: values.email, password: values.password }))}
      noValidate
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">Create your FillForm workspace in a few seconds.</p>
        </div>
        <Field>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input id="fullName" type="text" placeholder="Xyz" autoComplete="name" aria-invalid={!!form.formState.errors.fullName} {...form.register("fullName")} />
          <FieldError errors={[form.formState.errors.fullName]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input id="signup-email" type="email" placeholder="m@example.com" autoComplete="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <Input id="signup-password" type="password" placeholder="........" autoComplete="new-password" aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
          <FieldDescription>Use minimum 8 characters with upper, lower, number, and special character.</FieldDescription>
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input id="confirmPassword" type="password" placeholder="........" autoComplete="new-password" aria-invalid={!!form.formState.errors.confirmPassword} {...form.register("confirmPassword")} />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>
        {createUser.error && <FieldError>{createUser.error.message}</FieldError>}
        <Button type="submit" className="w-full" disabled={createUser.isPending}>
          {createUser.isPending ? "Creating account…" : "Create account"}
        </Button>
        <FieldSeparator>Or continue with</FieldSeparator>
        <GoogleSignInButton />
        <FieldDescription className="text-center">
          Already have an account? <a href="/signin" className="underline underline-offset-4">Sign in</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
