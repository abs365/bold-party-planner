import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("kent", "djs");
}

export const dynamic = "force-dynamic";

export default function KentDjsPage() {
  return <LocationPage location="kent" category="djs" />;
}
