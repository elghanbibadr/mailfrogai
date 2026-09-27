"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validations/auth";

type FormValues = LoginInput & Partial<Pick<SignupInput, "fullName">>;

export function AuthForm({ mode, notice }: { mode: "login" | "signup"; notice?: string }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [serverError, setServerError] = useState<string | null>(notice ?? null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // The two schemas differ only by fullName, so pick the right one for the page.
    resolver: zodResolver(isSignup ? signupSchema : loginSchema) as never,
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const submit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      console.log("data",data)
      console.log("error",error)

      if (error) return setServerError(error.message);
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // Email confirmation is enabled: the session starts after they click the link.
        setConfirmEmail(values.email);
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) return setServerError(error.message);
    router.push("/dashboard");
    router.refresh();
  };

  if (confirmEmail) {
    return (
      <div className="text-center mt-10">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="text-foreground">{confirmEmail}</span>. Open it to finish
          creating your account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isSignup ? "Start with 10 free AI generations each month." : "Log in to your MailForge AI workspace."}
        </p>
      </div>

      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {isSignup && (
          <Field label="Name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
          </Field>
        )}
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint={isSignup ? "At least 8 characters." : undefined}
        >
          <Input
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        {serverError && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          {isSignup ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New to MailForge AI?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-foreground underline-offset-4 hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </>
  );
}
