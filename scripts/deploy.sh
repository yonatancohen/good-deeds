#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Good Deeds — full deploy: web (Vercel) + mobile OTA (EAS Update)
# ----------------------------------------------------------------------------
# Usage:
#   bash scripts/deploy.sh           # preview deploy (web preview URL + EAS preview channel)
#   bash scripts/deploy.sh --prod    # production (web prod URL + EAS production channel)
# ----------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"; BLUE="\033[0;34m"; NC="\033[0m"
say()  { printf "${BLUE}==>${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}✓${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$*"; }
die()  { printf "${RED}✗${NC} %s\n" "$*"; exit 1; }

PROD=0
if [ "${1:-}" = "--prod" ] || [ "${1:-}" = "-p" ]; then
  PROD=1
fi

# ---------- preflight ----------
# Prefer the project's local CLIs (installed by deploy-setup.sh as devDeps),
# fall back to global if a user installed them that way.
export PATH="$PROJECT_ROOT/node_modules/.bin:$PATH"
command -v vercel >/dev/null 2>&1 || die "vercel CLI not installed. Run: npm run deploy:setup"
command -v eas    >/dev/null 2>&1 || die "eas CLI not installed. Run: npm run deploy:setup"
[ -f "$PROJECT_ROOT/.vercel/project.json" ] || die "Vercel project not linked. Run: npm run deploy:setup"

if grep -q "REPLACE_WITH_EAS_PROJECT_ID" "$PROJECT_ROOT/app.json"; then
  die "EAS projectId not set in app.json. Run: npm run deploy:setup"
fi

# Block accidental prod deploys with uncommitted changes
if [ "$PROD" = "1" ] && [ -d ".git" ]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    warn "You have uncommitted changes."
    read -r -p "Continue with PRODUCTION deploy anyway? [y/N] " ans
    [[ "$ans" =~ ^[Yy]$ ]] || die "Aborted."
  fi
fi

# ---------- web ----------
if [ "$PROD" = "1" ]; then
  say "Deploying web to Vercel (PRODUCTION)…"
  vercel --prod --yes
  ok "Web production deploy complete"
else
  say "Deploying web to Vercel (preview)…"
  vercel --yes
  ok "Web preview deploy complete"
fi

# ---------- mobile OTA ----------
BRANCH="preview"
[ "$PROD" = "1" ] && BRANCH="production"

MSG="$(date '+%Y-%m-%d %H:%M')"
if [ -d ".git" ]; then
  GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo)"
  [ -n "$GIT_SHA" ] && MSG="$MSG ($GIT_SHA)"
fi

say "Pushing OTA update to EAS branch '$BRANCH'…"
eas update --branch "$BRANCH" --message "$MSG"
ok "Mobile OTA update published to '$BRANCH' channel"

echo
ok "All done."
echo
echo "Web:    check the URL printed by Vercel above."
echo "Mobile: phones running the '$BRANCH' channel will fetch the new JS on next launch."
echo "        For Expo Go testing during dev, run:  npm start"
