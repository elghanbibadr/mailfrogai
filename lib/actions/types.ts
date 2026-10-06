import { reportError } from "../validations/monitoring";

export type ActionErrorCode =
  | "LIMIT_REACHED"
  | "INVALID"
  | "UNAUTHORIZED"
  | "FAILED"
  | "GMAIL_NOT_CONNECTED"
  | "GMAIL_DISCONNECTED"
  | "SEND_LIMIT"
  | "RATE_LIMITED";

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

type DbErrorContext = {
  action?: string;
  extra?: Record<string, unknown>;
  /** Overrides the generic user-facing message, for actions that aren't plain saves. */
  message?: string;
};

export function fromDbError(
  error: { message: string },
  context?: DbErrorContext,
): ActionResult<never> {
  if (error.message.includes("LIMIT_REACHED")) {
    // Expected business outcome, not a bug. Don't spend Sentry quota on it.
    return fail("You've reached the Free plan limit. Upgrade to Pro to add more.", "LIMIT_REACHED");
  }

  reportError(error, {
    tags: { source: "fromDbError", action: context?.action ?? "unknown" },
    extra: context?.extra,
  });

  return fail(context?.message ?? "Something went wrong saving your changes. Try again.");
}

export function invalid(error: { issues: { message: string }[] }): ActionResult<never> {
  return fail(error.issues[0]?.message ?? "Check the form and try again.", "INVALID");
}