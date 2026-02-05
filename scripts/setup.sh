#!/usr/bin/env bash
# =============================================================================
# Iris & Aegis Vibe Coding Platform - Initial Setup Script
# =============================================================================
# This script sets up the development environment for the platform.
# Run this once after cloning the repository.
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Header
echo ""
echo "=============================================="
echo "  Iris & Aegis Vibe Coding Platform Setup"
echo "=============================================="
echo ""

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# =============================================================================
# Check Prerequisites
# =============================================================================

print_step "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_success "Node.js $(node -v) installed"
    else
        print_error "Node.js 18+ is required. Found: $(node -v)"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    print_success "npm $(npm -v) installed"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        print_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') installed and running"
    else
        print_warning "Docker is installed but not running. Please start Docker."
    fi
else
    print_warning "Docker is not installed. Docker is required for full platform functionality."
    print_warning "Please install Docker from https://docs.docker.com/get-docker/"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose $(docker-compose --version | cut -d' ' -f4 | tr -d ',') installed"
elif docker compose version &> /dev/null 2>&1; then
    print_success "Docker Compose (plugin) installed"
else
    print_warning "Docker Compose is not installed. Please install Docker Compose."
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git $(git --version | cut -d' ' -f3) installed"
else
    print_error "Git is not installed"
    exit 1
fi

echo ""

# =============================================================================
# Setup Environment Files
# =============================================================================

print_step "Setting up environment files..."

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        print_success "Created .env file from .env.example"
        print_warning "Please review and update .env with your configuration"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_success ".env file already exists"
fi

# Setup client/iris environment
if [ -d "$PROJECT_ROOT/client/iris" ]; then
    if [ ! -f "$PROJECT_ROOT/client/iris/.env.local" ]; then
        cat > "$PROJECT_ROOT/client/iris/.env.local" << EOF
# Iris Local Environment
NEXT_PUBLIC_AEGIS_URL=http://localhost:8080
EOF
        print_success "Created client/iris/.env.local"
    else
        print_success "client/iris/.env.local already exists"
    fi
fi

# Setup server/aegis environment
if [ -d "$PROJECT_ROOT/server/aegis" ]; then
    if [ ! -f "$PROJECT_ROOT/server/aegis/.env" ]; then
        cat > "$PROJECT_ROOT/server/aegis/.env" << EOF
# Aegis Local Environment
PORT=8080
NODE_ENV=development
REDIS_URL=redis://localhost:6379
MAX_WORKER_SLOTS=16
CORS_ORIGINS=http://localhost:3000
EOF
        print_success "Created server/aegis/.env"
    else
        print_success "server/aegis/.env already exists"
    fi
fi

echo ""

# =============================================================================
# Install Dependencies
# =============================================================================

print_step "Installing dependencies..."

# Install root dependencies
npm install

print_success "All dependencies installed"

echo ""

# =============================================================================
# Build Shared Protocol
# =============================================================================

print_step "Building shared protocol..."

if [ -f "$PROJECT_ROOT/shared/protocol/package.json" ]; then
    npm run build:protocol 2>/dev/null || print_warning "Protocol build skipped (may not be configured yet)"
else
    print_warning "Shared protocol package.json not found"
fi

echo ""

# =============================================================================
# Verify Docker Setup (if Docker is available)
# =============================================================================

if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
    print_step "Verifying Docker setup..."

    # Check if docker-compose.yml exists
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_success "docker-compose.yml found"

        # Validate docker-compose configuration
        if docker-compose config -q 2>/dev/null || docker compose config -q 2>/dev/null; then
            print_success "Docker Compose configuration is valid"
        else
            print_warning "Docker Compose configuration may have issues"
        fi
    else
        print_warning "docker-compose.yml not found"
    fi

    echo ""
fi

# =============================================================================
# Make Scripts Executable
# =============================================================================

print_step "Making scripts executable..."

chmod +x "$SCRIPT_DIR/setup.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/dev.sh" 2>/dev/null || true

print_success "Scripts are now executable"

echo ""

# =============================================================================
# Final Summary
# =============================================================================

echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Review and update your .env file"
echo ""
echo "  2. Start development servers:"
echo "     ./scripts/dev.sh"
echo "     # or"
echo "     npm run dev"
echo ""
echo "  3. Or start with Docker:"
echo "     docker-compose up -d"
echo ""
echo "  4. Access the application:"
echo "     - Iris Frontend: http://localhost:3000"
echo "     - Aegis API:     http://localhost:8080"
echo ""
echo "For more information, see README.md"
echo ""
