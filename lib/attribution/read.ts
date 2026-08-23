import { cookies } from "next/headers";
import { ATTRIBUTION_COOKIE, type AttributionData } from "./shared";

/**
 * Server-side read of the stored first-touch attribution cookie.
 * For Server Components / Server Functions / Route Handlers only —
 * use getStoredAttributionClient() from ./shared in client components.
 */
export async function readStoredAttribution(): Promise<AttributionData | null> {
  try {
    const store = await cookies();
    const raw = store.get(ATTRIBUTION_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttributionData;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}
