#!/usr/bin/env bash
# Copy git-launch assets into your project root for commit and push.
# Run from project root: bash .git-launcher/scripts/apply-launch.sh
# Or: cd .git-launcher && bash scripts/apply-launch.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCHER_DIR="$(dirname "$SCRIPT_DIR")"
# When submodule: project/.git-launcher, project/git-launch → project root = parent of .git-launcher
# When in launcher repo: git-launch lives at repo root → project root = launcher dir
if [ -d "$LAUNCHER_DIR/git-launch" ]; then
  PROJECT_ROOT="$LAUNCHER_DIR"
else
  PROJECT_ROOT="${1:-$(dirname "$LAUNCHER_DIR")}"
fi
GIT_LAUNCH="$PROJECT_ROOT/git-launch"

if [ ! -d "$GIT_LAUNCH" ]; then
  echo "Error: git-launch/ not found at $GIT_LAUNCH"
  echo "Run the Git Launcher workflow first to generate assets."
  exit 1
fi

echo "=== Apply Launch Assets ==="
echo "Source: $GIT_LAUNCH"
echo "Target: $PROJECT_ROOT"
echo ""

# Files to copy to project root
cp -f "$GIT_LAUNCH/README.md" "$PROJECT_ROOT/README.md"
cp -f "$GIT_LAUNCH/CONTRIBUTING.md" "$PROJECT_ROOT/CONTRIBUTING.md"
cp -f "$GIT_LAUNCH/CODE_OF_CONDUCT.md" "$PROJECT_ROOT/CODE_OF_CONDUCT.md"
cp -f "$GIT_LAUNCH/LICENSE" "$PROJECT_ROOT/LICENSE"
cp -f "$GIT_LAUNCH/ARCHITECTURE.md" "$PROJECT_ROOT/ARCHITECTURE.md"

# .github templates
if [ -d "$GIT_LAUNCH/.github" ]; then
  mkdir -p "$PROJECT_ROOT/.github/ISSUE_TEMPLATE"
  cp -f "$GIT_LAUNCH/.github/PULL_REQUEST_TEMPLATE.md" "$PROJECT_ROOT/.github/" 2>/dev/null || true
  cp -f "$GIT_LAUNCH/.github/ISSUE_TEMPLATE/"*.md "$PROJECT_ROOT/.github/ISSUE_TEMPLATE/" 2>/dev/null || true
fi

# assets (logo for README)
if [ -d "$GIT_LAUNCH/assets" ]; then
  mkdir -p "$PROJECT_ROOT/assets"
  cp -f "$GIT_LAUNCH/assets/"* "$PROJECT_ROOT/assets/" 2>/dev/null || true
fi

# images (screenshots, social preview)
if [ -d "$GIT_LAUNCH/images" ]; then
  mkdir -p "$PROJECT_ROOT/images"
  cp -f "$GIT_LAUNCH/images/"*.png "$PROJECT_ROOT/images/" 2>/dev/null || true
fi

echo "Copied: README, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE, ARCHITECTURE, .github/, assets/, images/"
echo ""
echo "Next steps:"
echo "  1. Review the copied files, then: git add -A && git commit -m \"Add launch assets\""
echo "  2. Set repo Description and Topics from git-launch/LAUNCH_KIT/github-description.md (Settings → General)"
echo "  3. Upload social preview: git-launch/images/social-preview.png → Settings → Social Preview"
echo "  4. git push origin main"
echo ""
echo "──────────────────────────────────────────────"
echo "  If Git Launcher saved you time, give it a ⭐"
echo "  → https://github.com/julieclarkson/git-launcher"
echo "──────────────────────────────────────────────"
echo ""
