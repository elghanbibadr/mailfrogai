export type ActionErrorCode = "LIMIT_REACHED" | "INVALID" | "UNAUTHORIZED" | "FAILED";
import * as Sentry from "@sentry/nextjs";
import { reportError } from "../validations/monitoring";


export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ActionErrorCode };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string, code: ActionErrorCode = "FAILED"): ActionResult<never> => ({
  ok: false,
  error,
  code,
});
export const unauthorized = () => fail("Your session has expired. Sign in again.", "UNAUTHORIZED");

// lib/actions/types.ts — just the updated fromDbError, drop it into your
// existing file in place of the current one. Everything else in that file
// (fail, ok, invalid, unauthorized, ActionResult) is untouched.


// Optional context so call sites that want richer tagging still can,
// without forcing every existing `fromDbError(error)` call to change.
// fromDbError becomes thin
// lib/actions/errors.ts (or wherever fromDbError currently lives)
// keep your existing imports for `fail` and `ActionResult`

type DbErrorContext = {
  action?: string;
  extra?: Record<string, unknown>;
};

export function fromDbError(
  error: { message: string },
  context?: DbErrorContext,
): ActionResult<never> {
  if (error.message.includes("LIMIT_REACHED")) {
    // Expected business outcome, not a bug. Don't spend Sentry quota on it.
    return fail(
      "You've reached the Free plan limit. Upgrade to Pro to add more.",
      "LIMIT_REACHED",
    );
  }

  reportError(error, {
    tags: {
      source: "fromDbError",
      action: context?.action ?? "unknown",
    },
    extra: context?.extra,
  });

  return fail("Something went wrong saving your changes. Try again.");
}



export function invalid(error: { issues: { message: string }[] }): ActionResult<never> {
  return fail(error.issues[0]?.message ?? "Check the form and try again.", "INVALID");
}
