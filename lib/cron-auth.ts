// Vercel's native Cron Jobs feature sends the CRON_SECRET value as
// `Authorization: Bearer <CRON_SECRET>` (confirmed against Vercel's current
// docs, 2026-07-10: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
// Routes previously checked only a custom `x-cron-secret` header, which
// Vercel's scheduler never sends. Both are accepted here so a Vercel-
// triggered invocation succeeds, while any existing manual/internal
// server-to-server call using the old header (e.g. the reconciliation
// cron's own internal fetch to /api/admin/reconciliation) keeps working
// unchanged.
export function isAuthorisedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${cronSecret}`) return true;

  const legacyHeader = request.headers.get("x-cron-secret");
  return legacyHeader === cronSecret;
}
