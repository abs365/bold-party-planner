/**
 * Smoke test — verify critical routes return 200 before production deploy.
 * Runs against local dev server on port 3001.
 */

const BASE = "http://localhost:3001";

const ROUTES = [
  { path: "/",               label: "Homepage" },
  { path: "/browse",         label: "Browse vendors" },
  { path: "/how-it-works",   label: "How It Works" },
  { path: "/founding-vendors", label: "Founding Vendors" },
  { path: "/vendor/apply",   label: "Vendor apply" },
  { path: "/login",          label: "Login" },
  { path: "/signup",         label: "Sign up" },
  { path: "/privacy",        label: "Privacy Policy" },
  { path: "/terms",          label: "Terms" },
  { path: "/api/health",     label: "Health API" },
];

let pass = 0;
let fail = 0;

for (const { path, label } of ROUTES) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "follow" });
    const ok = res.status < 400;
    if (ok) {
      console.log(`  ✓  ${res.status}  ${label} (${path})`);
      pass++;
    } else {
      console.log(`  ✗  ${res.status}  ${label} (${path})`);
      fail++;
    }
  } catch (e) {
    console.log(`  ✗  ERR  ${label} (${path}) — ${e.message}`);
    fail++;
  }
}

console.log(`\n${pass}/${pass + fail} routes OK${fail > 0 ? ` — ${fail} FAILED` : ""}`);
if (fail > 0) process.exit(1);
