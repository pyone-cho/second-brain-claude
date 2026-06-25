#!/usr/bin/env bash
# =============================================================================
# Second Brain — Single Server Production Deployment (No Docker)
# =============================================================================
# Usage:
#   ./deploy.sh              Deploy latest from current branch
#   ./deploy.sh --setup      First-time server setup (install dependencies)
#   ./deploy.sh --rollback   Rollback to previous version
#   ./deploy.sh --status     Show deployment status
#   ./deploy.sh --logs       Tail application logs
#   ./deploy.sh --restart    Restart services
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$SCRIPT_DIR/.env"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_DIR="$SCRIPT_DIR/logs"
DEPLOY_LOG="$LOG_DIR/deploy.log"

# Load environment
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "Error: .env file not found. Copy .env.example to .env"
    exit 1
fi

# Defaults
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-80}"
NODE_ENV="${NODE_ENV:-production}"
PM2_APP_NAME="${PM2_APP_NAME:-second-brain-backend}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

log()   { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$DEPLOY_LOG"; }
ok()    { echo -e "${GREEN}[✓]${NC} $*" | tee -a "$DEPLOY_LOG"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*" | tee -a "$DEPLOY_LOG"; }
err()   { echo -e "${RED}[✗]${NC} $*" | tee -a "$DEPLOY_LOG" >&2; }
die()   { err "$*"; exit 1; }

# ---------------------------------------------------------------------------
# First-time server setup
# ---------------------------------------------------------------------------
setup_server() {
    log "Starting server setup..."

    # Update packages
    log "Updating system packages..."
    sudo apt update && sudo apt upgrade -y

    # Install Node.js 18 LTS
    if ! command -v node &>/dev/null; then
        log "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    ok "Node.js $(node -v) installed"

    # Install build essentials (for native modules like better-sqlite3)
    log "Installing build essentials..."
    sudo apt install -y build-essential python3

    # Install PM2 globally
    if ! command -v pm2 &>/dev/null; then
        log "Installing PM2..."
        sudo npm install -g pm2
    fi
    ok "PM2 installed"

    # Install Nginx
    if ! command -v nginx &>/dev/null; then
        log "Installing Nginx..."
        sudo apt install -y nginx
    fi
    ok "Nginx installed"

    # Configure firewall
    log "Configuring firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    ok "Firewall configured"

    # Create data directory
    mkdir -p "$PROJECT_ROOT/backend/data"

    # Setup PM2 to start on boot
    pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true

    ok "Server setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Configure .env:  nano $ENV_FILE"
    echo "  2. Deploy:          ./deploy.sh"
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
check_prerequisites() {
    log "Checking prerequisites..."

    command -v node &>/dev/null    || die "node is not installed (run: ./deploy.sh --setup)"
    command -v npm &>/dev/null     || die "npm is not installed"
    command -v pm2 &>/dev/null     || die "pm2 is not installed (run: npm i -g pm2)"
    command -v nginx &>/dev/null   || die "nginx is not installed (run: apt install nginx)"

    ok "Prerequisites satisfied"
}

# ---------------------------------------------------------------------------
# Git pull
# ---------------------------------------------------------------------------
pull_latest() {
    log "Pulling latest changes..."
    cd "$PROJECT_ROOT"

    local branch
    branch=$(git rev-parse --abbrev-ref HEAD)
    log "Current branch: $branch"

    git fetch origin
    git pull origin "$branch"

    local commit
    commit=$(git rev-parse --short HEAD)
    ok "Updated to commit: $commit"
}

# ---------------------------------------------------------------------------
# Backup database
# ---------------------------------------------------------------------------
backup_database() {
    log "Backing up database..."

    local db_path="$PROJECT_ROOT/backend/data/second-brain.db"
    if [ -f "$db_path" ]; then
        local backup_name="second-brain-$(date +'%Y%m%d-%H%M%S').db"
        cp "$db_path" "$BACKUP_DIR/$backup_name"
        ok "Database backed up to $BACKUP_DIR/$backup_name"

        # Keep only last 10 backups
        ls -t "$BACKUP_DIR"/*.db 2>/dev/null | tail -n +11 | xargs -r rm
    else
        warn "No existing database found, skipping backup"
    fi
}

# ---------------------------------------------------------------------------
# Install dependencies & build
# ---------------------------------------------------------------------------
build_backend() {
    log "Building backend..."
    cd "$BACKEND_DIR"

    npm ci --omit=dev
    npm run build

    ok "Backend built successfully"
}

build_frontend() {
    log "Building frontend..."
    cd "$FRONTEND_DIR"

    npm ci
    npm run build

    ok "Frontend built successfully"
}

# ---------------------------------------------------------------------------
# Configure Nginx
# ---------------------------------------------------------------------------
configure_nginx() {
    log "Configuring Nginx..."

    local nginx_conf="/etc/nginx/sites-available/second-brain"
    local nginx_enabled="/etc/nginx/sites-enabled/second-brain"

    # Copy nginx config
    sudo cp "$SCRIPT_DIR/nginx.conf" "$nginx_conf"

    # Update port in config
    sudo sed -i "s|listen 80|listen $FRONTEND_PORT|g" "$nginx_conf"

    # Enable site
    sudo ln -sf "$nginx_conf" "$nginx_enabled"

    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test and reload
    sudo nginx -t || die "Nginx configuration test failed"
    sudo systemctl reload nginx

    ok "Nginx configured and reloaded"
}

# ---------------------------------------------------------------------------
# Start/restart backend with PM2
# ---------------------------------------------------------------------------
start_backend() {
    log "Starting backend with PM2..."

    cd "$BACKEND_DIR"

    # Stop existing instance if running
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || true

    # Start with PM2
    pm2 start "$SCRIPT_DIR/ecosystem.config.cjs"

    # Save PM2 process list
    pm2 save

    ok "Backend started on port $BACKEND_PORT"
}

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
wait_for_health() {
    log "Waiting for services to become healthy..."

    local max_attempts=20
    local attempt=0

    # Wait for backend
    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        if curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
            ok "Backend is healthy"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            err "Backend health check failed"
            warn "Check logs: pm2 logs $PM2_APP_NAME"
            return 1
        fi

        sleep 2
    done

    # Check frontend (nginx)
    if curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        ok "Frontend is healthy"
    else
        warn "Frontend may not be accessible on port $FRONTEND_PORT"
    fi
}

# ---------------------------------------------------------------------------
# Rollback
# ---------------------------------------------------------------------------
rollback() {
    log "Rolling back to previous version..."
    cd "$PROJECT_ROOT"

    local previous_commit
    previous_commit=$(git rev-parse HEAD~1)
    log "Rolling back to: $(git rev-parse --short HEAD~1)"

    git checkout "$previous_commit"

    build_backend
    build_frontend
    configure_nginx
    start_backend
    wait_for_health

    ok "Rollback complete"
    warn "You are now on a detached HEAD. Create a branch if needed."
}

# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------
show_status() {
    echo ""
    echo "========================================="
    echo "  Second Brain — Deployment Status"
    echo "========================================="
    echo ""

    cd "$PROJECT_ROOT"

    local commit
    commit=$(git rev-parse --short HEAD)
    echo "  Git commit:   $commit"
    echo "  Branch:       $(git rev-parse --abbrev-ref HEAD)"
    echo ""

    echo "  PM2 Status:"
    pm2 list 2>/dev/null || echo "  (PM2 not running)"
    echo ""

    echo "  Nginx Status:"
    sudo systemctl is-active nginx 2>/dev/null || echo "  (Nginx not running)"
    echo ""

    echo "  Health:"
    if curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
        echo "    Backend:  ✓ healthy"
    else
        echo "    Backend:  ✗ unhealthy"
    fi

    if curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        echo "    Frontend: ✓ healthy"
    else
        echo "    Frontend: ✗ unhealthy"
    fi
    echo ""

    echo "  Recent Backend Logs:"
    pm2 logs "$PM2_APP_NAME" --lines 5 --nostream 2>/dev/null || echo "  (no logs)"
    echo ""
}

# ---------------------------------------------------------------------------
# Tail logs
# ---------------------------------------------------------------------------
tail_logs() {
    pm2 logs "$PM2_APP_NAME"
}

# ---------------------------------------------------------------------------
# Restart services
# ---------------------------------------------------------------------------
restart_services() {
    log "Restarting services..."

    pm2 restart "$PM2_APP_NAME"
    sudo systemctl restart nginx

    ok "Services restarted"
    wait_for_health
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    case "${1:-deploy}" in
        --setup)
            setup_server
            ;;
        --rollback)
            check_prerequisites
            rollback
            ;;
        --status)
            show_status
            ;;
        --logs)
            tail_logs
            ;;
        --restart)
            restart_services
            ;;
        deploy|"")
            check_prerequisites
            pull_latest
            backup_database
            build_backend
            build_frontend
            configure_nginx
            start_backend
            wait_for_health
            show_status
            ok "Deployment complete!"
            ;;
        *)
            echo "Usage: $0 [--setup|--rollback|--status|--logs|--restart]"
            exit 1
            ;;
    esac
}

main "$@"
