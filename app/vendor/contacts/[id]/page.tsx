import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ContactDetailClient } from "@/components/vendor/ContactDetailClient";
import { ManualContactNotes } from "@/components/vendor/ManualContactNotes";
import { SourceBadge } from "@/components/vendor/SourceBadge";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, Calendar, StickyNote, ExternalLink } from "lucide-react";
import type { ManualContact, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: contactId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "vendor") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single();
  if (!vendor) redirect("/vendor/apply");

  const { data: contact } = await supabase
    .from("manual_contacts")
    .select("id, display_name, display_email, display_phone, source, source_detail, notes, linked_profile_id, is_archived, gdpr_anonymised, stage, follow_up_at, created_at, updated_at")
    .eq("id", contactId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (!contact) notFound();

  // Fetch linked marketplace profile if converted
  const linkedProfile = contact.linked_profile_id
    ? (await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", contact.linked_profile_id)
        .maybeSingle()
      ).data
    : null;

  return (
    <DashboardLayout user={profile as Profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <Link
          href="/vendor/contacts"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </Link>

        {/* Header card — static info + interactive edit/archive */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/20 flex items-center justify-center text-xl font-bold text-orange-300 flex-shrink-0">
                {contact.display_name[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-white">{contact.display_name}</h1>
                  <SourceBadge source={contact.source} />
                  {contact.is_archived && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-slate-500/10 text-slate-400 border-slate-500/25">
                      Archived
                    </span>
                  )}
                  {contact.linked_profile_id && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                      Converted
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {contact.display_email && (
                    <a
                      href={`mailto:${contact.display_email}`}
                      className="flex items-center gap-1.5 text-sm text-white/50 hover:text-brand-300 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {contact.display_email}
                    </a>
                  )}
                  {contact.display_phone && (
                    <a
                      href={`tel:${contact.display_phone}`}
                      className="flex items-center gap-1.5 text-sm text-white/50 hover:text-brand-300 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {contact.display_phone}
                    </a>
                  )}
                  {contact.source_detail && (
                    <span className="text-sm text-white/35">{contact.source_detail}</span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-white/35">
                    <Calendar className="w-3.5 h-3.5" />
                    Added {formatDate(contact.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Context notes from creation */}
          {contact.notes && (
            <div className="mt-4 bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-3 flex gap-2.5">
              <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-white/60 text-sm leading-relaxed">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Converted customer link */}
        {linkedProfile && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-emerald-300 text-sm font-medium">This contact has joined Elbold</p>
              <p className="text-white/40 text-xs mt-0.5">
                Linked to marketplace account: {linkedProfile.full_name ?? linkedProfile.email}
              </p>
            </div>
            <Link
              href={`/vendor/customers/${linkedProfile.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View CRM profile
            </Link>
          </div>
        )}

        {/* Two-column layout: edit form + notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit / Archive — takes 2 cols */}
          <div className="lg:col-span-2">
            <ContactDetailClient contact={contact as ManualContact} />
          </div>

          {/* Notes sidebar */}
          <div>
            <ManualContactNotes contactId={contactId} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
