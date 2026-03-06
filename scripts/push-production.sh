#!/usr/bin/env bash
# Push production build to git-launcher (public repo).
# Builds to production/, then pushes contents to https://github.com/julieclarkson/git-launcher

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCHER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$LAUNCHER_DIR")"
PROD="$PROJECT_ROOT/production"
PRODUCTION_REPO="https://github.com/julieclarkson/git-launcher.git"
PROD_CLONE="$PROJECT_ROOT/.prod-clone"

cleanup() {
  rm -rf "$PROD_CLONE"
}
trap cleanup EXIT

echo "=== Deploy to Production ==="
echo ""

# 1. Build
echo "Step 1: Building production copy..."
bash "$SCRIPT_DIR/build-production.sh"
echo ""

# 2. Clone production repo, copy production over, push
echo "Step 2: Pushing to $PRODUCTION_REPO ..."
rm -rf "$PROD_CLONE"
git clone "$PRODUCTION_REPO" "$PROD_CLONE"
cd "$PROD_CLONE"
rsync -a --delete --exclude='.git' "$PROD/" .
git add -A
if git diff --staged --quiet; then
  echo "No changes to push."
  exit 0
fi
git commit -m "Production build $(date +%Y-%m-%d)"
git push origin main
echo ""
echo "=== Done. Production repo updated. ==="
