import type { Metadata } from "next";
import { buildLocationMetadata, LocationPage } from "@/app/(locations)/location-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocationMetadata("london");
}

export const dynamic = "force-dynamic";

export default function LondonPage() {
  return <LocationPage location="london" />;
}
