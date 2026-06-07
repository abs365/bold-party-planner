"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UK_PHONE_RE = /^(\+44\s?|0)[0-9]{9,10}$/;

export async function updateProfilePhoneAction(formData: FormData): Promise<{ error?: string }> {
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";

  if (phone && !UK_PHONE_RE.test(phone.replace(/\s/g, ""))) {
    return { error: "Please enter a valid UK phone number (e.g. 07700 900000)" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ phone: phone || null, phone_verified: false })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Reset phone_verified on the vendor row too (fire-and-forget; no-op if no vendor row)
  await supabase
    .from("vendors")
    .update({ phone_verified: false })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/settings");
  return {};
}
