#!/usr/bin/env bash
# One-command setup for Git Launcher. Run from your project root.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Installing Git Launcher..."
npm install
echo ""
echo "Installing Chromium for screenshots..."
npx playwright install chromium
echo ""
node scripts/verify-setup.js
echo ""
echo "Setup complete."
echo ""
echo "Next: In your AI IDE, tell the agent to read .git-launcher/prompts/00-MAIN.md and execute the workflow."
echo "Then, in Terminal from your project folder, run: node .git-launcher/scripts/screenshot-runner.js . --preview"
