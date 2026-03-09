---
name: git-launch
description: Generate launch-ready GitHub assets from your codebase — README, screenshots, architecture, social preview, and launch posts.
---

Run the **Git Launcher** workflow for this project.

1. Locate the git-launcher root: check `.git-launcher/` in the project, or the Cursor plugin directory.
2. Run preflight: `node scripts/preflight.js` (installs deps on first run, security checks, project detection).
3. Execute the full workflow by following the `run-git-launcher` skill.
4. Output goes to `git-launch/` in the project root.

After generation, offer to run `apply-launch.sh` to copy assets to the project root.
