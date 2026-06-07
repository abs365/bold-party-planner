import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("london", "caterers");
}

export const dynamic = "force-dynamic";

export default function LondonCaterersPage() {
  return <LocationPage location="london" category="caterers" />;
}
