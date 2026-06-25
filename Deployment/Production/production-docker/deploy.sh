#!/usr/bin/env bash
# =============================================================================
# Second Brain — Single Server Production Deployment
# =============================================================================
# Usage:
#   ./deploy.sh              Deploy latest from current branch
#   ./deploy.sh --rollback   Rollback to previous version
#   ./deploy.sh --status     Show deployment status
#   ./deploy.sh --logs       Tail container logs
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"
ENV_FILE="$SCRIPT_DIR/.env"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/deploy.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()   { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"; }
ok()    { echo -e "${GREEN}[✓]${NC} $*" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*" | tee -a "$LOG_FILE"; }
err()   { echo -e "${RED}[✗]${NC} $*" | tee -a "$LOG_FILE" >&2; }
die()   { err "$*"; exit 1; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
check_prerequisites() {
    log "Checking prerequisites..."

    command -v docker >/dev/null 2>&1       || die "docker is not installed"
    command -v docker compose >/dev/null 2>&1 || die "docker compose is not installed"

    if [ ! -f "$ENV_FILE" ]; then
        die ".env file not found. Copy .env.example to .env and configure it."
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        die "docker-compose.prod.yml not found at $COMPOSE_FILE"
    fi

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
    mkdir -p "$BACKUP_DIR"

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
# Build & deploy
# ---------------------------------------------------------------------------
build_and_deploy() {
    log "Building Docker images..."
    cd "$PROJECT_ROOT"

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache

    ok "Docker images built successfully"

    log "Stopping old containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

    log "Starting new containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    ok "Containers started"
}

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
wait_for_health() {
    log "Waiting for services to become healthy..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        local backend_healthy=false
        local frontend_healthy=false

        # Check backend
        if docker inspect --format='{{.State.Health.Status}}' second-brain-backend-prod 2>/dev/null | grep -q "healthy"; then
            backend_healthy=true
        fi

        # Check frontend
        if docker inspect --format='{{.State.Health.Status}}' second-brain-frontend-prod 2>/dev/null | grep -q "healthy"; then
            frontend_healthy=true
        fi

        if $backend_healthy && $frontend_healthy; then
            ok "All services healthy!"
            return 0
        fi

        printf "  Waiting... (attempt %d/%d) backend=%s frontend=%s\r" \
            "$attempt" "$max_attempts" \
            "$($backend_healthy && echo "✓" || echo "✗")" \
            "$($frontend_healthy && echo "✓" || echo "✗")"

        sleep 5
    done

    err "Health check timed out after $((max_attempts * 5)) seconds"
    warn "Check logs with: $0 --logs"
    return 1
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

    build_and_deploy
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

    echo "  Containers:"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps 2>/dev/null || echo "  (not running)"
    echo ""

    echo "  Health:"
    for container in second-brain-backend-prod second-brain-frontend-prod; do
        local status
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "not found")
        printf "    %-30s %s\n" "$container:" "$status"
    done
    echo ""

    echo "  Recent logs:"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=5 2>/dev/null || true
    echo ""
}

# ---------------------------------------------------------------------------
# Tail logs
# ---------------------------------------------------------------------------
tail_logs() {
    cd "$PROJECT_ROOT"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    case "${1:-deploy}" in
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
        deploy|"")
            check_prerequisites
            pull_latest
            backup_database
            build_and_deploy
            wait_for_health
            show_status
            ok "Deployment complete!"
            ;;
        *)
            echo "Usage: $0 [--rollback|--status|--logs]"
            exit 1
            ;;
    esac
}

main "$@"
