import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("essex", "photographers");
}

export const dynamic = "force-dynamic";

export default function EssexPhotographersPage() {
  return <LocationPage location="essex" category="photographers" />;
}
