import { ImageResponse } from "next/og";

// Edge runtime: generated once and cached by Next.js CDN.
export const runtime = "edge";
export const alt = "ELBOLD Events – Find Premium Event Vendors Across the UK";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fetch a single weight of Inter from Google Fonts.
// Returns null on any network error so image generation still completes.
async function loadGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; Satori/OG)" } }
    ).then((r) => r.text());

    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    return fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  // Load Inter Extrabold (wordmark) and Regular (tagline / trust row).
  const [interExtrabold, interRegular] = await Promise.all([
    loadGoogleFont("Inter", 800),
    loadGoogleFont("Inter", 400),
  ]);

  const fonts: Array<{
    name: string;
    data: ArrayBuffer;
    style: "normal";
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  }> = [];
  if (interExtrabold) fonts.push({ name: "Inter", data: interExtrabold, style: "normal", weight: 800 });
  if (interRegular)   fonts.push({ name: "Inter", data: interRegular,   style: "normal", weight: 400 });

  const fontFamily = fonts.length ? "Inter" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0D1B3E",
          fontFamily,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow — centred behind the content */}
        <div
          style={{
            position: "absolute",
            width: 860,
            height: 500,
            borderRadius: "430px",
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 68%)",
            top: 65,
            left: 170,
          }}
        />

        {/* Top gold accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, #C9A84C 50%, transparent 100%)",
          }}
        />

        {/* Bottom gold accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, #C9A84C 50%, transparent 100%)",
          }}
        />

        {/* EB monogram circle */}
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            border: "2px solid #C9A84C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: "#C9A84C",
              letterSpacing: "0.14em",
              lineHeight: 1,
            }}
          >
            EB
          </div>
        </div>

        {/* ELBOLD wordmark */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: "#C9A84C",
            letterSpacing: "0.30em",
            lineHeight: 1,
            marginBottom: 10,
          }}
        >
          ELBOLD
        </div>

        {/* EVENTS sub-label */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(201,168,76,0.48)",
            letterSpacing: "0.60em",
            marginBottom: 40,
          }}
        >
          EVENTS
        </div>

        {/* Gold separator rule */}
        <div
          style={{
            width: 72,
            height: 1,
            backgroundColor: "rgba(201,168,76,0.28)",
            marginBottom: 36,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 400,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.02em",
            lineHeight: 1.45,
            textAlign: "center",
            maxWidth: 660,
            marginBottom: 32,
          }}
        >
          Find Premium Event Vendors Across the UK
        </div>

        {/* Trust signals row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            fontSize: 14,
            fontWeight: 400,
            color: "rgba(255,255,255,0.30)",
            letterSpacing: "0.05em",
          }}
        >
          <div>Verified Vendors</div>
          <div style={{ marginLeft: 18, marginRight: 18, color: "rgba(201,168,76,0.28)" }}>·</div>
          <div>Secure Payments</div>
          <div style={{ marginLeft: 18, marginRight: 18, color: "rgba(201,168,76,0.28)" }}>·</div>
          <div>Booking Protection</div>
        </div>

        {/* Domain watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 26,
            right: 44,
            fontSize: 12,
            color: "rgba(255,255,255,0.16)",
            letterSpacing: "0.10em",
          }}
        >
          elbold.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
