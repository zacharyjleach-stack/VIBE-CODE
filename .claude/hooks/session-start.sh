#!/bin/bash
# =============================================================================
# Vibe Code Platform — Claude Code Web Session Start Hook
# Runs at the start of every remote web session.
#
# Secrets live in .claude/.env.secrets (gitignored).
# Copy .claude/.env.secrets.example → .claude/.env.secrets and fill in values.
# =============================================================================

set -euo pipefail

# Only run in remote (web) Claude Code environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
SECRETS_FILE="$REPO_DIR/.claude/.env.secrets"

echo "🚀 [session-start] Bootstrapping Vibe Code platform..."
echo "   Repo: $REPO_DIR"

# ── 1. Install all npm workspaces ────────────────────────────────────────────
echo ""
echo "📦 Installing npm workspaces..."
cd "$REPO_DIR"
npm install --prefer-offline --no-audit --no-fund 2>&1 | tail -5
echo "   ✓ npm workspaces installed"

# ── 2. Build shared protocol package ─────────────────────────────────────────
echo ""
echo "🔧 Building shared/protocol..."
cd "$REPO_DIR/shared/protocol"
npm run build 2>&1 | tail -5
echo "   ✓ Protocol package built"

# ── 3. Load secrets ──────────────────────────────────────────────────────────
echo ""
echo "🔑 Loading secrets..."

if [ -f "$SECRETS_FILE" ]; then
  # shellcheck source=/dev/null
  source "$SECRETS_FILE"
  echo "   ✓ Secrets loaded from .claude/.env.secrets"
else
  echo "   ⚠ No .claude/.env.secrets found — API-keyed MCPs will be skipped"
fi

# ── 4. Set session environment variables ─────────────────────────────────────
echo ""
echo "🌍 Setting session environment variables..."

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export NODE_ENV=development"
    echo "export AEGIS_PORT=8080"
    echo "export IRIS_PORT=3000"
    echo "export CURSOR_API_KEY=${CURSOR_API_KEY:-}"
  } >> "$CLAUDE_ENV_FILE"
  echo "   ✓ Env vars written to session"
fi

# ── 5. Configure MCP servers ──────────────────────────────────────────────────
echo ""
echo "🔌 Configuring MCP servers..."

CLAUDE_SETTINGS_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_SETTINGS_DIR"

MCP_21ST_KEY="${MCP_21ST_KEY:-}"
MCP_SUPABASE_KEY="${MCP_SUPABASE_KEY:-}"
MCP_VERCEL_TOKEN="${MCP_VERCEL_TOKEN:-}"
MCP_NOTION_KEY="${MCP_NOTION_KEY:-}"

python3 - "$MCP_21ST_KEY" "$MCP_SUPABASE_KEY" "$MCP_VERCEL_TOKEN" "$MCP_NOTION_KEY" "$CLAUDE_SETTINGS_DIR" << 'PYEOF'
import json, sys

mcp_21st_key, mcp_supabase_key, mcp_vercel_token, mcp_notion_key, settings_dir = sys.argv[1:]

servers = {
  "context7": {"command": "npx", "args": ["-y", "@upstash/context7-mcp@latest"]},
  "playwright": {"command": "npx", "args": ["-y", "@playwright/mcp@latest"]},
  "filesystem": {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user", "/tmp"]},
  "memory": {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"]},
  "sequential-thinking": {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]},
}

if mcp_21st_key:
  servers["21st-magic"] = {"command": "npx", "args": ["-y", "@21st-dev/mcp@latest", "API_KEY"], "env": {"API_KEY": mcp_21st_key}}
if mcp_supabase_key:
  servers["supabase"] = {"command": "npx", "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", mcp_supabase_key]}
if mcp_vercel_token:
  servers["vercel"] = {"command": "npx", "args": ["-y", "@vercel/mcp-adapter@latest"], "env": {"VERCEL_TOKEN": mcp_vercel_token}}
if mcp_notion_key:
  servers["notion"] = {"command": "npx", "args": ["-y", "@notionhq/notion-mcp-server@latest"], "env": {
    "OPENAPI_MCP_HEADERS": json.dumps({"Authorization": f"Bearer {mcp_notion_key}", "Notion-Version": "2022-06-28"})
  }}

settings = {
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart": [{"hooks": [{"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"}]}],
    "Stop": [{"matcher": "", "hooks": [{"type": "command", "command": "~/.claude/stop-hook-git-check.sh"}]}]
  },
  "permissions": {"allow": ["Skill"]},
  "mcpServers": servers
}

with open(f"{settings_dir}/settings.json", "w") as f:
  json.dump(settings, f, indent=2)

keyed = [k for k in servers if k not in ("context7","playwright","filesystem","memory","sequential-thinking")]
print(f"   ✓ {len(servers)} MCP servers ({len(servers)-len(keyed)} always-on, {len(keyed)} keyed)")
PYEOF

echo ""
echo "✅ [session-start] Bootstrap complete!"
echo "   npm workspaces: ready | protocol: built | MCPs: configured"
echo ""
