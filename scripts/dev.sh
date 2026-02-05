#!/usr/bin/env bash
# =============================================================================
# Iris & Aegis Vibe Coding Platform - Development Helper Script
# =============================================================================
# This script starts all services in development mode with hot reloading.
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored message
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# =============================================================================
# Parse Arguments
# =============================================================================

MODE="all"  # Default mode
USE_DOCKER=false
DETACHED=false

show_help() {
    echo "Iris & Aegis Development Script"
    echo ""
    echo "Usage: ./dev.sh [OPTIONS] [MODE]"
    echo ""
    echo "Modes:"
    echo "  all       Start all services (default)"
    echo "  iris      Start only Iris frontend"
    echo "  aegis     Start only Aegis backend"
    echo "  docker    Start services using Docker Compose"
    echo ""
    echo "Options:"
    echo "  -d, --detached    Run in detached mode (Docker only)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh              # Start all services locally"
    echo "  ./dev.sh iris         # Start only Iris"
    echo "  ./dev.sh docker       # Start with Docker"
    echo "  ./dev.sh docker -d    # Start with Docker (detached)"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--detached)
            DETACHED=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        all|iris|aegis|docker)
            MODE=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Header
echo ""
echo "=============================================="
echo "  Iris & Aegis Development Mode"
echo "=============================================="
echo ""

# =============================================================================
# Docker Mode
# =============================================================================

if [ "$MODE" == "docker" ]; then
    print_step "Starting services with Docker Compose..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi

    # Build and start services
    if [ "$DETACHED" = true ]; then
        docker-compose up -d --build
        echo ""
        print_success "Services started in detached mode"
        echo ""
        print_info "View logs: docker-compose logs -f"
        print_info "Stop services: docker-compose down"
    else
        print_info "Starting services (Ctrl+C to stop)..."
        echo ""
        docker-compose up --build
    fi

    exit 0
fi

# =============================================================================
# Local Development Mode
# =============================================================================

# Check if dependencies are installed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    print_warning "Dependencies not installed. Running npm install..."
    npm install
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    print_step "Stopping services..."

    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true

    # Kill any processes on our ports
    lsof -ti:3000 | xargs -r kill 2>/dev/null || true
    lsof -ti:8080 | xargs -r kill 2>/dev/null || true

    print_success "All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# =============================================================================
# Start Redis (if using local development)
# =============================================================================

start_redis() {
    if command -v redis-server &> /dev/null; then
        if ! pgrep -x redis-server > /dev/null; then
            print_step "Starting local Redis server..."
            redis-server --daemonize yes
            print_success "Redis started"
        else
            print_success "Redis is already running"
        fi
    else
        print_warning "Redis not installed locally. Using Docker..."
        if docker info &> /dev/null 2>&1; then
            # Start Redis in Docker if not already running
            if ! docker ps | grep -q "vibe-code.*redis"; then
                docker run -d --name vibe-redis -p 6379:6379 redis:7-alpine 2>/dev/null || \
                docker start vibe-redis 2>/dev/null || true
            fi
            print_success "Redis running in Docker"
        else
            print_warning "Redis not available. Some features may not work."
        fi
    fi
}

# =============================================================================
# Start Services
# =============================================================================

case $MODE in
    all)
        print_step "Starting all services..."
        echo ""

        # Start Redis
        start_redis
        echo ""

        print_info "Starting Iris (Frontend) on http://localhost:3000"
        print_info "Starting Aegis (Backend) on http://localhost:8080"
        echo ""
        print_info "Press Ctrl+C to stop all services"
        echo ""

        # Run concurrently
        npm run dev
        ;;

    iris)
        print_step "Starting Iris frontend..."
        echo ""
        print_info "Starting Iris on http://localhost:3000"
        print_info "Press Ctrl+C to stop"
        echo ""

        npm run dev:iris
        ;;

    aegis)
        print_step "Starting Aegis backend..."
        echo ""

        # Start Redis
        start_redis
        echo ""

        print_info "Starting Aegis on http://localhost:8080"
        print_info "Press Ctrl+C to stop"
        echo ""

        npm run dev:aegis
        ;;
esac

# =============================================================================
# Wait for processes
# =============================================================================

wait
