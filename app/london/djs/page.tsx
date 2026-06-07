import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("london", "djs");
}

export const dynamic = "force-dynamic";

export default function LondonDjsPage() {
  return <LocationPage location="london" category="djs" />;
}
