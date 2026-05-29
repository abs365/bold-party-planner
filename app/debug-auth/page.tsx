import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebugAuthPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(
    (c) => c.name.includes("auth") || c.name.includes("supabase") || c.name.startsWith("sb-")
  );

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  let profile = null;
  let profileError = null;
  if (user) {
    const res = await supabase.from("profiles").select("id, role, full_name, email").eq("id", user.id).single();
    profile = res.data;
    profileError = res.error?.message ?? null;
  }

  console.log("[AUTH-DEBUG] /debug-auth —", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: error?.message,
    totalCookies: allCookies.length,
    authCookieNames: authCookies.map((c) => c.name),
    profile,
    profileError,
  });

  return (
    <div style={{ fontFamily: "monospace", padding: "2rem", background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh" }}>
      <h1 style={{ color: "#d946ef", marginBottom: "1.5rem" }}>[debug-auth] SSR Auth Diagnostics</h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Auth User</h2>
        <pre style={{ background: "#1e1e2e", padding: "1rem", borderRadius: "0.5rem", marginTop: "0.5rem", overflowX: "auto" }}>
          {JSON.stringify({ id: user?.id, email: user?.email, error: error?.message ?? null }, null, 2)}
        </pre>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Profile</h2>
        <pre style={{ background: "#1e1e2e", padding: "1rem", borderRadius: "0.5rem", marginTop: "0.5rem", overflowX: "auto" }}>
          {JSON.stringify({ profile, profileError }, null, 2)}
        </pre>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Auth Cookies ({authCookies.length} of {allCookies.length} total)
        </h2>
        <pre style={{ background: "#1e1e2e", padding: "1rem", borderRadius: "0.5rem", marginTop: "0.5rem", overflowX: "auto" }}>
          {JSON.stringify(
            authCookies.map((c) => ({ name: c.name, valueLen: c.value.length, valueStart: c.value.slice(0, 20) + "…" })),
            null, 2
          )}
        </pre>
      </section>

      <section>
        <h2 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>All Cookie Names</h2>
        <pre style={{ background: "#1e1e2e", padding: "1rem", borderRadius: "0.5rem", marginTop: "0.5rem", overflowX: "auto" }}>
          {JSON.stringify(allCookies.map((c) => c.name), null, 2)}
        </pre>
      </section>
    </div>
  );
}
