#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GIT_DIR="$PROJECT_ROOT/.git"

if [ ! -d "$GIT_DIR" ]; then
  echo "No .git directory found at $PROJECT_ROOT"
  echo "Initialize a git repo first: git init"
  exit 1
fi

HOOKS_DIR="$GIT_DIR/hooks"
mkdir -p "$HOOKS_DIR"

cp "$SCRIPT_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "Git hooks installed to $HOOKS_DIR"
echo "  - pre-commit: secret scanning, npm audit, OS artifact blocking"
