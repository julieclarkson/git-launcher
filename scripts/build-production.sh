#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCHER_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$LAUNCHER_DIR")"
PROD="$PROJECT_ROOT/production"

echo "Building production copy of Git Launcher..."
echo "Source: $LAUNCHER_DIR"
echo "Target: $PROD"
echo ""

rm -rf "$PROD"
mkdir -p "$PROD"

PROD_DIRS=("scripts" "prompts" "templates" "config" "hooks" "assets")

for dir in "${PROD_DIRS[@]}"; do
  if [ -d "$LAUNCHER_DIR/$dir" ]; then
    cp -r "$LAUNCHER_DIR/$dir" "$PROD/$dir"
  fi
done

PROD_FILES=(
  "package.json"
  "package-lock.json"
  "README.md"
  "SECURITY.md"
  "SECURITY_README.md"
  "Dockerfile"
  "docker-compose.yml"
  "install.sh"
)

for file in "${PROD_FILES[@]}"; do
  if [ -f "$LAUNCHER_DIR/$file" ]; then
    cp "$LAUNCHER_DIR/$file" "$PROD/$file"
  fi
done

# Clean dev-only artifacts
find "$PROD" -name '.DS_Store' -delete 2>/dev/null || true
rm -rf "$PROD/git-launch" 2>/dev/null || true

FILE_COUNT=$(find "$PROD" -type f | wc -l | tr -d ' ')
DIR_COUNT=$(find "$PROD" -type d | wc -l | tr -d ' ')

echo "Production build complete."
echo "Output: $PROD"
echo "Files:  $FILE_COUNT"
echo "Dirs:   $DIR_COUNT"
echo ""
echo "Contents:"
find "$PROD" -type f | sort | sed "s|$PROD/|  |"
