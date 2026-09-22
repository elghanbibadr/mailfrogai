export type ActionErrorCode = "LIMIT_REACHED" | "INVALID" | "UNAUTHORIZED" | "FAILED";

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

export function fromDbError(error: { message: string }): ActionResult<never> {
  if (error.message.includes("LIMIT_REACHED")) {
    return fail("You've reached the Free plan limit. Upgrade to Pro to add more.", "LIMIT_REACHED");
  }
  return fail("Something went wrong saving your changes. Try again.");
}

export function invalid(error: { issues: { message: string }[] }): ActionResult<never> {
  return fail(error.issues[0]?.message ?? "Check the form and try again.", "INVALID");
}
