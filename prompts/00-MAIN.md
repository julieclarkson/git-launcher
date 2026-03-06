# Git Launcher — Launch Asset Generator

You are an AI agent that generates GitHub launch-ready assets for a project.
Read this file to understand the complete workflow, then execute it step by step.

## Prerequisites
- You are inside a project folder that contains code ready for GitHub launch
- The `.git-launcher/` folder is present with prompts/ and scripts/

## Workflow
Execute these steps IN ORDER. After each step, confirm what was generated before moving to the next.

### Step 1: Analyze Project
Read: `.git-launcher/prompts/01-ANALYZE.md`
Execute the analysis. Store the results — every subsequent step uses this data.

### Step 2: Generate README
Read: `.git-launcher/prompts/02-README.md`
Output: `git-launch/README.md`

### Step 3: Generate Metadata & Config Files
Read: `.git-launcher/prompts/03-METADATA.md`
Output: `git-launch/CONTRIBUTING.md`, `git-launch/LICENSE`, `git-launch/CODE_OF_CONDUCT.md`, `git-launch/.github/` templates

### Step 4: Capture Screenshots
Read: `.git-launcher/prompts/04-SCREENSHOTS.md`
Output: `git-launch/images/desktop.png`, `tablet.png`, `mobile.png`
- **Web app:** `screenshot-runner.js . --port {port}` (user must start dev server first)
- **CLI/library:** `screenshot-runner.js . --preview` (generates preview + screenshots automatically)

### Step 5: Generate Architecture Diagram
Read: `.git-launcher/prompts/05-ARCHITECTURE.md`
Output: `git-launch/ARCHITECTURE.md` with Mermaid diagrams

### Step 6: Generate Social Preview Image
Read: `.git-launcher/prompts/06-SOCIAL.md`
Output: `git-launch/images/social-preview.png`

### Step 7: Generate Launch Kit
Read: `.git-launcher/prompts/07-POSTS.md`
Output: `git-launch/LAUNCH_KIT/` folder with platform-specific posts

### Step 8: Check for Case Study Maker
Read: `.git-launcher/prompts/08-CASE-STUDY.md`
If `.case-study/` or `.casestudy/` folder exists, enrich README and launch posts with build narrative.

### Step 9: Generate Launch Checklist
Output: `git-launch/LAUNCH_CHECKLIST.md` — step-by-step instructions for deploying all generated assets to GitHub. Include the one-command option: `bash .git-launcher/scripts/apply-launch.sh` copies README, CONTRIBUTING, LICENSE, .github/, assets/, images/ to project root.

## Rules
- Create `git-launch/` folder at project root for ALL outputs
- NEVER overwrite files outside `git-launch/` without asking
- If a script fails, skip that step and continue (note what was skipped)
- After completing all steps, present a summary of everything generated
- Ask user if they want to copy `git-launch/README.md` to the project root
