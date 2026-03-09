---
name: run-git-launcher
description: Generate launch-ready GitHub assets from a codebase — README, screenshots, architecture diagrams, social preview, and multi-platform launch posts. Use when the user says "run git launcher", "git launch", "generate launch assets", or wants to prepare a project for GitHub.
---

# Run Git Launcher

Analyze a codebase and generate everything needed to launch on GitHub: README, CONTRIBUTING, LICENSE, CODE_OF_CONDUCT, architecture diagrams, screenshots, social preview image, and platform-specific launch posts.

## Prerequisites

- You are inside a project folder that contains code ready for GitHub launch
- Node.js >= 18 is available

## Step 0: Locate Git Launcher

Find the git-launcher root directory. Try in order:

1. `.git-launcher/` in the project root (submodule install)
2. The directory containing this skill file's grandparent (Cursor plugin install — navigate from `skills/run-git-launcher/SKILL.md` up to the plugin root)

Store this path as `GL_ROOT` — all scripts and prompts are relative to it.

Verify it exists:
```bash
ls "$GL_ROOT/prompts/00-MAIN.md"
```

## Step 1: Preflight

Run preflight checks (installs dependencies on first run, verifies security, detects project):

```bash
node "$GL_ROOT/scripts/preflight.js"
```

If preflight fails, stop and report the issue. Do not proceed with generation.

## Step 2: Analyze Project

Read and execute: `$GL_ROOT/prompts/01-ANALYZE.md`

Store the analysis results — every subsequent step uses this data.

## Step 3: Generate README

Read and execute: `$GL_ROOT/prompts/02-README.md`

Output: `git-launch/README.md`

## Step 4: Generate Metadata and Config Files

Read and execute: `$GL_ROOT/prompts/03-METADATA.md`

Output: `git-launch/CONTRIBUTING.md`, `git-launch/LICENSE`, `git-launch/CODE_OF_CONDUCT.md`, `git-launch/.github/` templates

## Step 5: Capture Screenshots

Read and execute: `$GL_ROOT/prompts/04-SCREENSHOTS.md`

Output: `git-launch/images/desktop.png`, `tablet.png`, `mobile.png`

- **Web app:** `node "$GL_ROOT/scripts/screenshot-runner.js" . --port {port}` (user must start dev server first)
- **CLI/library:** `node "$GL_ROOT/scripts/screenshot-runner.js" . --preview` (generates preview + screenshots automatically)

## Step 6: Generate Architecture Diagram

Read and execute: `$GL_ROOT/prompts/05-ARCHITECTURE.md`

Output: `git-launch/ARCHITECTURE.md` with Mermaid diagrams

## Step 7: Generate Social Preview Image

Read and execute: `$GL_ROOT/prompts/06-SOCIAL.md`

Output: `git-launch/images/social-preview.png`

## Step 8: Generate Launch Kit

Read and execute: `$GL_ROOT/prompts/07-POSTS.md`

Output: `git-launch/LAUNCH_KIT/` with platform-specific posts for Reddit, HN, Twitter/X, Product Hunt, and Dev.to

## Step 9: Check for Case Study Maker

Read and execute: `$GL_ROOT/prompts/08-CASE-STUDY.md`

If `.case-study/` or `.casestudy/` folder exists, enrich README and launch posts with the build narrative.

## Step 10: Generate Launch Checklist

Output: `git-launch/LAUNCH_CHECKLIST.md` — step-by-step deploy instructions.

Include the one-command option: `bash "$GL_ROOT/scripts/apply-launch.sh"` to copy README, CONTRIBUTING, LICENSE, .github/, assets/, images/ to the project root.

## Step 11: Summary

After all steps complete, present a summary of everything generated and ask the user if they want to:
1. Copy `git-launch/README.md` to project root
2. Run `apply-launch.sh` to copy all launch assets to project root

## Rules

- Create `git-launch/` folder at project root for ALL outputs
- NEVER overwrite files outside `git-launch/` without asking
- If a script fails, skip that step and continue (note what was skipped)
- Execute steps IN ORDER — confirm what was generated before moving to the next
