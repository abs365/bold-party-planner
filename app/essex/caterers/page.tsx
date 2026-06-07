import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("essex", "caterers");
}

export const dynamic = "force-dynamic";

export default function EssexCaterersPage() {
  return <LocationPage location="essex" category="caterers" />;
}
