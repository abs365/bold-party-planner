import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { formatCurrency } from "@/lib/utils";
import {
  Store, MessageSquare, TrendingUp, CreditCard,
  AlertCircle, CheckCircle2, Clock, ArrowRight, ChevronRight,
  Package, MapPin, Tag, Camera,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

const TARGET_CATEGORIES = [
  "dj", "decorator", "photographer", "videographer", "caterer",
  "event_planner", "cake_maker", "balloon_decorator", "venue", "live_band", "mc",
];

export default async function MarketplaceHealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/");

  const db = await createAdminClient();
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const now     = new Date();
  const week    = new Date(now); week.setDate(week.getDate() - 7);
  const month   = new Date(now); month.setDate(month.getDate() - 30);
  const days30  = new Date(now); days30.setDate(days30.getDate() - 30);

  const [
    approvedVendorsRes,
    pendingVendorsRes,
    packagesRes,
    mediaRes,
    quotesRes,
    bookingsRes,
    paymentsRes,
    newCustomersWeekRes,
  ] = await Promise.all([
    db.from("vendors")
      .select("id, business_name, category, city, bio, phone, last_active_at")
      .eq("status", "approved"),
    db.from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db.from("vendor_packages").select("vendor_id"),
    db.from("vendor_media").select("vendor_id").is("deleted_at", null),
    db.from("quotes").select("id, status, created_at, customer_id"),
    db.from("bookings").select("id, status, payment_status, total_amount, commission_amount, vendor_payout, created_at"),
    db.from("payments").select("amount, type, status"),
    db.from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", week.toISOString()),
  ]);

  const approvedVendors     = approvedVendorsRes.data ?? [];
  const pendingCount        = pendingVendorsRes.count ?? 0;
  const packages            = packagesRes.data ?? [];
  const media               = mediaRes.data ?? [];
  const quotes              = quotesRes.data ?? [];
  const bookings            = bookingsRes.data ?? [];
  const payments            = paymentsRes.data ?? [];
  const newCustomersWeek    = newCustomersWeekRes.count ?? 0;

  // ── Supply ──────────────────────────────────────────────────
  const pkgVendorIds   = new Set(packages.map((p) => p.vendor_id));
  const mediaVendorIds = new Set(media.map((m) => m.vendor_id));

  const quoteReadyVendors = approvedVendors.filter((v) =>
    v.bio && v.bio.length > 10 &&
    v.phone &&
    pkgVendorIds.has(v.id) &&
    mediaVendorIds.has(v.id)
  );

  const categoryMap: Record<string, string[]> = {};
  for (const v of approvedVendors) {
    if (!categoryMap[v.category]) categoryMap[v.category] = [];
    categoryMap[v.category].push(v.business_name);
  }

  const regionMap: Record<string, number> = {};
  for (const v of approvedVendors) {
    const r = v.city || "Unknown";
    regionMap[r] = (regionMap[r] ?? 0) + 1;
  }

  // ── Demand ──────────────────────────────────────────────────
  const quotesThisWeek  = quotes.filter((q) => new Date(q.created_at) >= week).length;
  const quotesThisMonth = quotes.filter((q) => new Date(q.created_at) >= month).length;
  const activeCustomers = new Set(quotes.map((q) => q.customer_id)).size;

  // ── Conversion funnel ────────────────────────────────────────
  const totalQuotes   = quotes.length;
  const responded     = quotes.filter((q) =>
    ["responded", "viewed", "shortlisted", "accepted", "converted"].includes(q.status)
  ).length;
  const totalBookings = bookings.length;
  const depositPaid   = bookings.filter((b) =>
    ["deposit_paid", "fully_paid"].includes(b.payment_status ?? "")
  ).length;
  const completed     = bookings.filter((b) => b.status === "completed").length;

  const pct = (n: number, d: number) => d === 0 ? null : Math.round((n / d) * 100);

  const funnel = [
    { stage: "Quotes Created",     count: totalQuotes,   conversion: pct(responded, totalQuotes),      label: "→ Response" },
    { stage: "Quotes Responded",   count: responded,     conversion: pct(totalBookings, responded),    label: "→ Booking" },
    { stage: "Bookings Created",   count: totalBookings, conversion: pct(depositPaid, totalBookings),  label: "→ Deposit" },
    { stage: "Deposits Paid",      count: depositPaid,   conversion: pct(completed, depositPaid),      label: "→ Completed" },
    { stage: "Bookings Completed", count: completed,     conversion: null,                             label: null },
  ];

  // ── Revenue ──────────────────────────────────────────────────
  const depositsCollected = payments
    .filter((p) => p.type === "deposit" && p.status === "succeeded")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const confirmedBookings = bookings.filter((b) => ["confirmed", "completed"].includes(b.status));
  const gmv        = confirmedBookings.reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const commission = confirmedBookings.reduce((s, b) => s + (b.commission_amount ?? 0), 0);
  const payoutsDue = confirmedBookings.reduce((s, b) => s + (b.vendor_payout ?? 0), 0);

  // ── Alerts ───────────────────────────────────────────────────
  const coveredCategories  = new Set(approvedVendors.map((v) => v.category));
  const emptyCategories    = TARGET_CATEGORIES.filter((c) => !coveredCategories.has(c));
  const inactiveVendors    = approvedVendors.filter((v) =>
    !v.last_active_at || new Date(v.last_active_at) < days30
  );
  const missingMedia       = approvedVendors.filter((v) => !mediaVendorIds.has(v.id));
  const missingPackages    = approvedVendors.filter((v) => !pkgVendorIds.has(v.id));
  const totalAlerts =
    (emptyCategories.length > 0 ? 1 : 0) +
    (pendingCount > 0 ? 1 : 0) +
    (inactiveVendors.length > 0 ? 1 : 0) +
    missingMedia.length + missingPackages.length;

  const userObj = {
    id: user.id, email: user.email ?? "", role: "admin" as const,
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    phone_verified: profile?.phone_verified ?? false,
    avatar_url: profile?.avatar_url ?? null,
    created_at: profile?.created_at ?? new Date().toISOString(),
  };

  return (
    <DashboardLayout user={userObj}>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Marketplace Health</h1>
            <p className="text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/founder" className="btn-secondary text-xs py-2">
              <ArrowRight size={13} className="rotate-180" /> Founder Dashboard
            </Link>
            <Link href="/admin" className="btn-secondary text-xs py-2">
              Command Centre <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── SUPPLY ───────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Store size={11} /> Supply
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Link href="/admin/vendors?status=approved" className="bg-white/4 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="text-xs text-slate-500 mb-2">Approved Vendors</div>
              <div className="text-3xl font-bold text-emerald-400">{approvedVendors.length}</div>
            </Link>
            <Link href="/admin/vendor-activation" className="bg-white/4 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="text-xs text-slate-500 mb-2">Quote-Ready</div>
              <div className="text-3xl font-bold text-brand-400">{quoteReadyVendors.length}</div>
              <div className="text-xs text-slate-600 mt-1">bio + phone + packages + media</div>
            </Link>
            <Link
              href="/admin/vendors?status=pending"
              className={`rounded-xl p-4 transition-colors border ${
                pendingCount > 0
                  ? "bg-amber-500/8 border-amber-500/20 hover:border-amber-500/30"
                  : "bg-white/4 border-white/6 hover:border-white/10"
              }`}
            >
              <div className="text-xs text-slate-500 mb-2">Pending Approvals</div>
              <div className={`text-3xl font-bold ${pendingCount > 0 ? "text-amber-400" : "text-slate-600"}`}>
                {pendingCount}
              </div>
            </Link>
          </div>

          {/* Category coverage */}
          <div className="bg-white/4 border border-white/6 rounded-xl p-5 mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tag size={11} /> Category Coverage
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {TARGET_CATEGORIES.map((cat) => {
                const vendors = categoryMap[cat] ?? [];
                const covered = vendors.length > 0;
                return (
                  <div key={cat} className="flex items-center gap-3 py-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${covered ? "bg-emerald-400" : "bg-red-500"}`} />
                    <span className="text-sm text-slate-300 w-36 flex-shrink-0 capitalize">
                      {cat.replace(/_/g, " ")}
                    </span>
                    <span className="flex-1 text-xs text-slate-500">
                      {covered ? vendors.join(", ") : "No vendor"}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-4 text-right flex-shrink-0 ${
                      covered ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {vendors.length}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/6 flex items-center justify-between text-xs text-slate-500">
              <span>{coveredCategories.size} / {TARGET_CATEGORIES.length} categories covered</span>
              <div className="flex items-center gap-1">
                <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-emerald-400"
                    style={{ width: `${Math.round((coveredCategories.size / TARGET_CATEGORIES.length) * 100)}%` }}
                  />
                </div>
                <span>{Math.round((coveredCategories.size / TARGET_CATEGORIES.length) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Region distribution */}
          {Object.keys(regionMap).length > 0 && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin size={11} /> Vendors by Region
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(regionMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([region, count]) => (
                    <div key={region} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/6 rounded-lg text-xs">
                      <span className="text-white font-medium">{region}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* ── DEMAND ───────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MessageSquare size={11} /> Demand
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Quotes This Week",    value: quotesThisWeek,  color: "text-sky-400",   href: "/admin/quotes" },
              { label: "Quotes This Month",   value: quotesThisMonth, color: "text-blue-400",  href: "/admin/quotes" },
              { label: "Active Customers",    value: activeCustomers, color: "text-brand-400", href: "/admin/customers" },
              { label: "New Customers (7d)",  value: newCustomersWeek, color: "text-slate-300", href: "/admin/customers" },
            ].map(({ label, value, color, href }) => (
              <Link key={label} href={href} className="bg-white/4 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="text-xs text-slate-500 mb-2">{label}</div>
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CONVERSION ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={11} /> Conversion
          </h2>
          <div className="bg-white/4 border border-white/6 rounded-xl overflow-hidden">
            {funnel.map(({ stage, count, conversion, label }, i) => (
              <div key={stage} className={`flex items-center gap-4 px-5 py-4 ${i < funnel.length - 1 ? "border-b border-white/6" : ""}`}>
                <div className="w-40 text-sm text-slate-300 flex-shrink-0">{stage}</div>
                <div className="w-10 text-xl font-bold text-white tabular-nums text-right flex-shrink-0">{count}</div>
                {conversion !== null ? (
                  <>
                    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          conversion >= 50 ? "bg-emerald-400" :
                          conversion >= 20 ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${conversion}%` }}
                      />
                    </div>
                    <div className="w-28 text-right flex-shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${
                        conversion >= 50 ? "text-emerald-400" :
                        conversion >= 20 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {conversion}%
                      </span>
                      <span className="text-xs text-slate-600 ml-1.5">{label}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── REVENUE ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CreditCard size={11} /> Revenue
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Deposits Collected", value: formatCurrency(depositsCollected), color: "text-emerald-400", sub: "real payments received",   href: "/admin/finance" },
              { label: "Revenue (GMV)",       value: formatCurrency(gmv),               color: "text-white",       sub: "confirmed booking value",   href: "/admin/finance" },
              { label: "Commission Earned",   value: formatCurrency(commission),         color: "text-brand-400",   sub: "10% platform take rate",    href: "/admin/payouts" },
              { label: "Vendor Payouts Due",  value: formatCurrency(payoutsDue),         color: "text-amber-400",   sub: "90% owed to vendors",        href: "/admin/payouts" },
            ].map(({ label, value, color, sub, href }) => (
              <Link key={label} href={href} className="bg-white/4 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── ALERTS ───────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle size={11} /> Alerts
            {totalAlerts > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">{totalAlerts}</span>
            )}
          </h2>

          <div className="space-y-2.5">

            {/* Empty categories */}
            {emptyCategories.length > 0 && (
              <div className="bg-red-500/6 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-2">
                      {emptyCategories.length} {emptyCategories.length === 1 ? "category" : "categories"} with no approved vendor
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {emptyCategories.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 capitalize"
                        >
                          {c.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending approvals */}
            {pendingCount > 0 && (
              <Link
                href="/admin/vendors?status=pending"
                className="flex items-center gap-3 bg-amber-500/6 border border-amber-500/20 rounded-xl p-4 hover:bg-amber-500/8 transition-colors"
              >
                <Clock size={14} className="text-amber-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-white">
                  <span className="font-semibold">{pendingCount}</span> vendor{pendingCount !== 1 ? "s" : ""} awaiting approval
                </span>
                <ChevronRight size={13} className="text-amber-400 flex-shrink-0" />
              </Link>
            )}

            {/* Inactive vendors */}
            {inactiveVendors.length > 0 && (
              <div className="bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">
                      {inactiveVendors.length} approved vendor{inactiveVendors.length !== 1 ? "s" : ""} inactive 30+ days
                    </p>
                    <p className="text-xs text-slate-400">{inactiveVendors.map((v) => v.business_name).join(", ")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Missing media */}
            {missingMedia.length > 0 && (
              <div className="bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Camera size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">
                      {missingMedia.length} approved vendor{missingMedia.length !== 1 ? "s" : ""} missing media
                    </p>
                    <p className="text-xs text-slate-400">{missingMedia.map((v) => v.business_name).join(", ")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Missing packages */}
            {missingPackages.length > 0 && (
              <div className="bg-white/4 border border-white/6 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Package size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">
                      {missingPackages.length} approved vendor{missingPackages.length !== 1 ? "s" : ""} missing packages
                    </p>
                    <p className="text-xs text-slate-400">{missingPackages.map((v) => v.business_name).join(", ")}</p>
                  </div>
                </div>
              </div>
            )}

            {totalAlerts === 0 && (
              <div className="flex items-center gap-3 bg-emerald-500/6 border border-emerald-500/20 rounded-xl p-4">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-emerald-400 font-medium">No alerts — marketplace health looks good</span>
              </div>
            )}
          </div>
        </section>

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { href: "/admin/vendors",          label: "All Vendors",    icon: Store },
            { href: "/admin/quotes",           label: "Quote Pipeline", icon: MessageSquare },
            { href: "/admin/finance",          label: "Finance",        icon: CreditCard },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between bg-white/4 border border-white/6 rounded-xl px-4 py-3 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Icon size={13} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{label}</span>
              </div>
              <ChevronRight size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
