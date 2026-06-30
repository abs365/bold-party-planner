import { NextResponse } from "next/server";
import { requireAdminRole, forbidden } from "@/lib/auth/guards";
import { createAuditLog, ipFromRequest } from "@/lib/audit";
import { createGovernanceDecision } from "@/lib/governance";
import type { AdminRole } from "@/lib/auth/guards";

export async function GET() {
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { data, error } = await auth.db
    .from("admin_roles")
    .select(`
      id, role, granted_at, revoked_at, notes,
      user:user_id ( id, email:users(email) ),
      granted_by_profile:granted_by ( id, email:users(email) )
    `)
    .order("granted_at", { ascending: false });

  if (error) {
    // Fallback: simpler query without nested join if the above fails
    const { data: simple, error: simpleError } = await auth.db
      .from("admin_roles")
      .select("id, user_id, role, granted_by, granted_at, revoked_at, notes")
      .order("granted_at", { ascending: false });

    if (simpleError) return NextResponse.json({ error: simpleError.message }, { status: 500 });
    return NextResponse.json(simple ?? []);
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  // Role grant requires Global Admin minimum — Ops Admin cannot grant any roles
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { user_id, role, notes } = await request.json() as {
    user_id: string;
    role: string;
    notes?: string;
  };

  if (!user_id || !role) {
    return NextResponse.json({ error: "user_id and role are required" }, { status: 400 });
  }

  const validRoles: string[] = ["global_admin", "ops_admin", "reviewer"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Only Founder can grant global_admin
  if (role === "global_admin" && auth.role !== "founder") {
    return NextResponse.json(
      { error: "Only the Founder Admin can grant Global Admin." },
      { status: 403 }
    );
  }

  // Check for existing active role
  const { data: existing } = await auth.db
    .from("admin_roles")
    .select("id, role")
    .eq("user_id", user_id)
    .is("revoked_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `User already has an active role: ${existing.role}. Revoke it first.` },
      { status: 409 }
    );
  }

  const { data: newRole, error } = await auth.db
    .from("admin_roles")
    .insert({
      user_id,
      role,
      granted_by: auth.user.id,
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ip = ipFromRequest(request);

  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole:   auth.role,
    action:      "admin.role.grant",
    entityType:  "admin_role",
    entityId:    newRole.id,
    after:       { user_id, role },
    ipAddress:   ip,
  });

  void createGovernanceDecision({
    actorUserId: auth.user.id,
    actorEmail:  auth.user.email ?? "",
    actorRole:   auth.role,
    actionType:  "role.granted",
    entityType:  "admin_role",
    entityId:    newRole.id,
    newStatus:   role as AdminRole,
    adminNotes:  notes,
    ipAddress:   ip,
  });

  return NextResponse.json({ id: newRole.id, role, user_id });
}

export async function DELETE(request: Request) {
  // Role revoke requires Global Admin minimum — Ops Admin cannot revoke any roles
  const auth = await requireAdminRole("global_admin");
  if (!auth) return forbidden();

  const { role_id } = await request.json() as { role_id: string };

  if (!role_id) {
    return NextResponse.json({ error: "role_id is required" }, { status: 400 });
  }

  const { data: roleRow } = await auth.db
    .from("admin_roles")
    .select("id, user_id, role")
    .eq("id", role_id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!roleRow) {
    return NextResponse.json({ error: "Active role not found" }, { status: 404 });
  }

  // Only Founder can revoke a global_admin
  if (roleRow.role === "global_admin" && auth.role !== "founder") {
    return NextResponse.json(
      { error: "Only the Founder Admin can revoke Global Admin." },
      { status: 403 }
    );
  }

  const { error } = await auth.db
    .from("admin_roles")
    .update({ revoked_at: new Date().toISOString(), revoked_by: auth.user.id })
    .eq("id", role_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ip = ipFromRequest(request);

  void createAuditLog({
    actorUserId: auth.user.id,
    actorRole:   auth.role,
    action:      "admin.role.revoke",
    entityType:  "admin_role",
    entityId:    role_id,
    before:      { role: roleRow.role, user_id: roleRow.user_id },
    ipAddress:   ip,
  });

  void createGovernanceDecision({
    actorUserId:    auth.user.id,
    actorEmail:     auth.user.email ?? "",
    actorRole:      auth.role,
    actionType:     "role.revoked",
    entityType:     "admin_role",
    entityId:       role_id,
    previousStatus: roleRow.role,
    ipAddress:      ip,
  });

  return NextResponse.json({ success: true });
}
