import { redirect } from "next/navigation";

// EPD-003-WP1: this route is retired — the Pipeline Board is now a view mode
// on the consolidated /admin/vendor-acquisition page (ADR-001). Kept as a
// redirect so existing bookmarks/links continue to work.
export default function VendorPipelineRedirect() {
  redirect("/admin/vendor-acquisition?view=pipeline");
}
