#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# deploy.sh — Deploy Second Brain to Vercel with Turso
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Check prerequisites ──────────────────────────────────────

info "Checking prerequisites..."

command -v node  >/dev/null 2>&1 || err "Node.js not found. Install v18+: https://nodejs.org"
command -v npm   >/dev/null 2>&1 || err "npm not found."
command -v vercel >/dev/null 2>&1 || err "Vercel CLI not found. Install: npm install -g vercel"
command -v turso >/dev/null 2>&1 || err "Turso CLI not found. Install: curl -sSfL https://get.tur.so/install.sh | bash"

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
[[ "$NODE_VER" -ge 18 ]] || err "Node.js v18+ required, found v$NODE_VER"

ok "All prerequisites met"

# ── Config ───────────────────────────────────────────────────

DB_NAME="${TURSO_DB_NAME:-second-brain}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$PROJECT_ROOT"

# ── Step 1: Turso database ───────────────────────────────────

info "Setting up Turso database..."

# Check if already logged in
if ! turso auth whoami >/dev/null 2>&1; then
  warn "Not logged in to Turso. Opening login..."
  turso auth login
fi

TURSO_ORG=$(turso auth whoami 2>/dev/null | head -1 || echo "unknown")
info "Turso org: $TURSO_ORG"

# Create database if it doesn't exist
if turso db show "$DB_NAME" >/dev/null 2>&1; then
  ok "Database '$DB_NAME' already exists"
else
  info "Creating database '$DB_NAME'..."
  turso db create "$DB_NAME"
  ok "Database '$DB_NAME' created"
fi

# Get URL
TURSO_URL=$(turso db show "$DB_NAME" --url)
info "Database URL: $TURSO_URL"

# Create auth token
info "Creating auth token..."
TURSO_TOKEN=$(turso db tokens create "$DB_NAME")
ok "Auth token created"

# ── Step 2: Frontend build test ──────────────────────────────

info "Testing frontend build..."

cd "$PROJECT_ROOT/frontend"
npm install --quiet
npm run build

ok "Frontend builds successfully"

# ── Step 3: Vercel project ───────────────────────────────────

info "Setting up Vercel project..."

cd "$PROJECT_ROOT"

# Check if project is already linked
if [[ -f ".vercel/project.json" ]]; then
  ok "Vercel project already linked"
else
  info "Linking Vercel project..."
  vercel link --yes
  ok "Vercel project linked"
fi

# ── Step 4: Environment variables ────────────────────────────

info "Setting environment variables in Vercel..."

# Set for production
echo "$TURSO_URL" | vercel env add TURSO_DATABASE_URL production 2>/dev/null && \
  ok "TURSO_DATABASE_URL set (production)" || warn "TURSO_DATABASE_URL already exists (production)"

echo "$TURSO_TOKEN" | vercel env add TURSO_AUTH_TOKEN production 2>/dev/null && \
  ok "TURSO_AUTH_TOKEN set (production)" || warn "TURSO_AUTH_TOKEN already exists (production)"

# Set for preview
echo "$TURSO_URL" | vercel env add TURSO_DATABASE_URL preview 2>/dev/null && \
  ok "TURSO_DATABASE_URL set (preview)" || warn "TURSO_DATABASE_URL already exists (preview)"

echo "$TURSO_TOKEN" | vercel env add TURSO_AUTH_TOKEN preview 2>/dev/null && \
  ok "TURSO_AUTH_TOKEN set (preview)" || warn "TURSO_AUTH_TOKEN already exists (preview)"

# ── Step 5: Deploy ───────────────────────────────────────────

info "Deploying to Vercel production..."

cd "$PROJECT_ROOT"
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-z0-9-]+\.vercel\.app' | tail -1)

if [[ -n "$DEPLOY_URL" ]]; then
  ok "Deployed to: $DEPLOY_URL"
else
  err "Deployment failed:\n$DEPLOY_OUTPUT"
fi

# ── Step 6: Verify ───────────────────────────────────────────

info "Verifying deployment..."

HEALTH=$(curl -sf "$DEPLOY_URL/api/health" 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  ok "Health check passed: $HEALTH"
else
  warn "Health check failed — the API may need a moment to warm up"
fi

# ── Done ─────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Production URL:  ${BLUE}$DEPLOY_URL${NC}"
echo -e "  Turso DB:        ${BLUE}$TURSO_URL${NC}"
echo -e "  Turso DB Name:   ${BLUE}$DB_NAME${NC}"
echo ""
echo -e "  API Health:      ${BLUE}$DEPLOY_URL/api/health${NC}"
echo -e "  API Items:       ${BLUE}$DEPLOY_URL/api/items${NC}"
echo ""
