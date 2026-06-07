import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("kent", "caterers");
}

export const dynamic = "force-dynamic";

export default function KentCaterersPage() {
  return <LocationPage location="kent" category="caterers" />;
}
