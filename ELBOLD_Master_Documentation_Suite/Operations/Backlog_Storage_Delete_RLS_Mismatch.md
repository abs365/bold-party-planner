# Backlog Item: Storage Delete RLS Policy Mismatch

**ID:** BUG-001
**Priority:** P3
**Status:** Open — No Current User Impact
**Discovered:** 2026-06-05 (P1-05 Launch Hardening Audit)
**Component:** Supabase Storage RLS / Vendor Media

---

## Summary

The storage bucket delete RLS policies in migration 037 check `auth.uid()` as the path prefix, but vendor media is stored under `vendorId/` (the vendor record's UUID from the `vendors` table). These two values are different PKs and the policy will always deny vendor-initiated direct storage deletions.

---

## Current Behaviour

### RLS Policy (migration 037)

```sql
CREATE POLICY "Vendors can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Upload Path (app/api/uploads/route.ts:153)

```typescript
const fileName = `${vendorId}/${Date.now()}_${safeName}.${ext}`;
//                 ^^^^^^^^
//                 vendors.id (vendor record UUID)
//                 NOT auth.uid() (user's auth UUID)
```

### Path Mismatch

| Value | Source | Example |
|---|---|---|
| `auth.uid()` | Supabase Auth (user ID) | `a1b2c3d4-...` |
| `vendorId` | `vendors.id` column | `f9e8d7c6-...` |

These are different UUIDs. A vendor who uploads a file to `f9e8d7c6/photo.jpg` cannot delete it via direct storage API because `storage.foldername(name)[1]` = `f9e8d7c6` ≠ `auth.uid()` = `a1b2c3d4`.

---

## Current Impact

**None.** The bug is dormant because:

1. No vendor-facing delete endpoint exists. All vendor media deletion is **soft-delete only** — sets `vendor_media.deleted_at` timestamp via DB update, which goes through Supabase DB RLS (not storage RLS).

2. The `storage.remove()` call in `app/api/uploads/route.ts:191` is a **rollback path only** — it runs on DB insert failure using `adminClient` (service role), which bypasses all RLS.

3. The admin moderation delete (`/api/admin/moderation/media/[id]`) also does soft-delete, not physical storage deletion.

---

## Future Risk

This bug WILL cause silent failure if any of the following features are built:

- "Vendor deletes their own media file" — direct storage delete call
- "Vendor replaces a photo" — delete old + upload new flow
- Any feature that calls `supabase.storage.from('vendor-images').remove([path])` using the vendor's authenticated session (not service role)

The failure mode is silent: the RLS policy will deny the delete with no error visible to the user. The DB record may be removed but the file remains in storage (orphaned object).

---

## Correct Fix

When this feature is built, fix the RLS policy to use the vendor's record ID instead of `auth.uid()`:

**Option A — Fix the RLS policy to join against the vendors table:**

```sql
DROP POLICY IF EXISTS "Vendors can delete own images" ON storage.objects;
CREATE POLICY "Vendors can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM vendors WHERE user_id = auth.uid()
  )
);
```

**Option B — Change upload path to use `auth.uid()` as the prefix:**

```typescript
// In app/api/uploads/route.ts — change:
const fileName = `${vendorId}/${Date.now()}_${safeName}.${ext}`;
// To:
const fileName = `${user.id}/${Date.now()}_${safeName}.${ext}`;
```

If Option B is chosen, all existing file paths remain valid but new uploads will use a different prefix scheme. The old files would not be deletable by the new policy either, so a data migration would be needed.

**Recommendation:** Option A (fix the policy). It requires no change to existing file paths and no data migration.

---

## Do Not Fix Until

- A vendor-facing media delete or replace feature is being built
- The feature adds any `storage.remove()` call using a non-service-role client

---

## Test Case (write when fixing)

```typescript
// As an authenticated vendor:
// 1. Upload a file → should succeed
// 2. Attempt to delete the file via direct storage API → should succeed (currently would fail)
// 3. Confirm file is removed from Supabase storage
// 4. Confirm vendor_media DB row is updated/deleted
```

---

## References

- Migration: `supabase/migrations/037_storage_buckets.sql`
- Upload route: `app/api/uploads/route.ts:153`
- Discovered during: P1-05 Launch Hardening Audit, 2026-06-05
