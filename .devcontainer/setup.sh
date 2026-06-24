#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           ELBOLD — Cloud Development Setup               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "▶ Node $(node --version) | npm $(npm --version)"
echo ""
echo "▶ Installing dependencies..."
npm install
echo ""

# Check required secrets — warn but do not fail.
# Secrets are injected at container startup from GitHub Codespaces settings.
MISSING=()
for var in \
  NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY \
  STRIPE_SECRET_KEY \
  STRIPE_WEBHOOK_SECRET \
  RESEND_API_KEY \
  OPENAI_API_KEY; do
  if [ -z "${!var:-}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "⚠  Missing secrets (set in GitHub → Repository → Settings"
  echo "   → Secrets and variables → Codespaces, then restart):"
  for var in "${MISSING[@]}"; do
    echo "   • $var"
  done
  echo ""
fi

echo "⚠  STRIPE SAFETY: STRIPE_SECRET_KEY must be a TEST key (sk_test_* or rk_test_*)."
echo "   The app throws if a live key is detected outside Vercel production."
echo ""
echo "⚠  RESEND SAFETY: emails are suppressed in Codespace by default."
echo "   Set RESEND_DEV_OVERRIDE_EMAIL to redirect emails to your inbox."
echo ""
echo "⚠  SUPABASE: use a DEVELOPMENT project — never production credentials."
echo ""
echo "✔ Setup complete. Run: npm run dev"
