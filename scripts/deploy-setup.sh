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

# ---------- node deps ----------
# .npmrc in this project already pins us to the public registry, but pass it
# explicitly too so this works even if someone overrides it.
PUBLIC_REGISTRY="https://registry.npmjs.org/"
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  say "Installing project dependencies…"
  npm install --legacy-peer-deps --registry="$PUBLIC_REGISTRY"
  ok "node_modules installed"
fi

# ---------- install CLIs as project devDependencies ----------
# Local install (not global) — keeps the global npm config untouched and
# everything stays version-pinned in package.json. Binaries land in
# node_modules/.bin and `npm run …` scripts pick them up automatically.
# Public registry is forced because the work-computer JFrog mirror may not
# have these packages (which is what bit us originally).
#
# Inherits min-release-age=21 from the project .npmrc.
say "Installing Vercel + EAS CLI as project devDependencies…"
npm install --save-dev --legacy-peer-deps \
  --registry="$PUBLIC_REGISTRY" \
  vercel eas-cli >/dev/null
VERCEL_BIN="$PROJECT_ROOT/node_modules/.bin/vercel"
EAS_BIN="$PROJECT_ROOT/node_modules/.bin/eas"
ok "vercel $("$VERCEL_BIN" --version) / eas $("$EAS_BIN" --version)"
# Make these visible to the rest of this script (and any subshell)
export PATH="$PROJECT_ROOT/node_modules/.bin:$PATH"

# expo-updates is already declared in package.json. We deliberately do NOT
# run `npx expo install expo-updates` here because that command auto-rewrites
# the package.json to whatever Expo's SDK currently recommends, which often
# breaks the project's 21-day min-release-age policy.
ok "expo-updates ready (declared in package.json)"

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
