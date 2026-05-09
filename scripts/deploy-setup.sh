#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Good Deeds — one-shot deployment setup
# ----------------------------------------------------------------------------
# Run this ONCE per machine after cloning the repo.
# It installs the CLIs, logs you in, links the Vercel project, syncs env vars,
# and initializes the EAS (Expo Application Services) project for OTA updates.
#
# Usage:  bash scripts/deploy-setup.sh
# ----------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ---------- helpers ----------
GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"; BLUE="\033[0;34m"; NC="\033[0m"
say()  { printf "${BLUE}==>${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}✓${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$*"; }
die()  { printf "${RED}✗${NC} %s\n" "$*"; exit 1; }

# ---------- preflight ----------
say "Checking prerequisites…"
command -v node >/dev/null 2>&1 || die "node is required (install via nvm or brew)"
command -v npm  >/dev/null 2>&1 || die "npm is required"
ok "node $(node -v) / npm $(npm -v)"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
  warn ".env not found — copying from .env.example. Fill in your Supabase keys before continuing."
  cp .env.example .env
  ${EDITOR:-vi} .env || true
fi

# Source env vars (so we can push them to Vercel)
set -a
# shellcheck disable=SC1091
source "$PROJECT_ROOT/.env"
set +a

[ -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]      || die "EXPO_PUBLIC_SUPABASE_URL is empty in .env"
[ -n "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ] || die "EXPO_PUBLIC_SUPABASE_ANON_KEY is empty in .env"
ok ".env looks good"

# ---------- install CLIs ----------
say "Installing/updating Vercel CLI + EAS CLI (global)…"
npm i -g vercel @expo/eas-cli >/dev/null
ok "vercel $(vercel --version) / eas $(eas --version)"

# ---------- node deps ----------
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  say "Installing project dependencies…"
  npm install --legacy-peer-deps
  ok "node_modules installed"
fi

# Make sure expo-updates is wired up natively (no-op if already)
say "Ensuring expo-updates is configured…"
npx expo install expo-updates >/dev/null 2>&1 || true
ok "expo-updates ready"

# ---------- Vercel ----------
say "Logging into Vercel (browser will open if needed)…"
vercel whoami >/dev/null 2>&1 || vercel login

if [ ! -f "$PROJECT_ROOT/.vercel/project.json" ]; then
  say "Linking this folder to a Vercel project…"
  vercel link
else
  ok "Already linked to a Vercel project"
fi

say "Pushing Supabase env vars to Vercel (production + preview + development)…"
push_env() {
  local key="$1" value="$2" env="$3"
  # Remove existing value silently, then add fresh
  printf "y\n" | vercel env rm "$key" "$env" >/dev/null 2>&1 || true
  printf "%s" "$value" | vercel env add "$key" "$env" >/dev/null
  ok "  $key → $env"
}
for env in production preview development; do
  push_env "EXPO_PUBLIC_SUPABASE_URL"      "$EXPO_PUBLIC_SUPABASE_URL"      "$env"
  push_env "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$EXPO_PUBLIC_SUPABASE_ANON_KEY" "$env"
done

# ---------- EAS ----------
say "Logging into Expo (EAS)…"
eas whoami >/dev/null 2>&1 || eas login

if grep -q "REPLACE_WITH_EAS_PROJECT_ID" "$PROJECT_ROOT/app.json"; then
  say "Initializing EAS project (this writes the projectId into app.json)…"
  eas init --non-interactive --force || eas init
  ok "EAS project linked"
else
  ok "EAS projectId already set in app.json"
fi

# Create the OTA update branches if they don't exist
eas channel:create production >/dev/null 2>&1 || true
eas channel:create preview    >/dev/null 2>&1 || true
ok "EAS channels ready: production, preview"

# ---------- done ----------
echo
ok "Setup complete!"
echo
echo "Next steps:"
echo "  • Web (preview):     npm run deploy:web"
echo "  • Web (production):  npm run deploy:web:prod"
echo "  • Mobile OTA push:   npm run eas:update         (preview channel)"
echo "  • Mobile OTA prod:   npm run eas:update:prod    (production channel)"
echo "  • Everything:        npm run deploy:all         /  npm run deploy:all:prod"
echo
echo "Mobile testing in Expo Go:"
echo "  npm start    →  scan the QR with Expo Go on your phone."
