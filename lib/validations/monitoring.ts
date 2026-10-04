// lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

export function reportError(
  error: unknown,
  context: { tags?: Record<string, string>; extra?: Record<string, unknown> } = {},
) {
  // Supabase errors are plain objects, not Error instances. Sentry groups them
  // badly ("Object captured as exception"), so wrap them.
  const err =
    error instanceof Error
      ? error
      : new Error(
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : String(error),
        );

  Sentry.captureException(err, context);
}