import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("kent", "photographers");
}

export const dynamic = "force-dynamic";

export default function KentPhotographersPage() {
  return <LocationPage location="kent" category="photographers" />;
}
