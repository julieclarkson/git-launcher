# Step 1: Analyze Project

Your goal is to deeply understand this project so that all subsequent steps produce accurate, specific output.

## What to Do

### 1. Run the detection script
Execute: `node .git-launcher/scripts/detect-project.js .`
This returns JSON with: name, language, framework, startCommand, dependencies, etc.

### 2. Read key files
Read these files (if they exist) and extract understanding:
- `package.json` or equivalent (Cargo.toml, go.mod, requirements.txt, pyproject.toml)
- `README.md` (existing — note what's there, what's missing)
- Main entry point file (e.g., `src/index.ts`, `src/app/page.tsx`, `main.py`)
- 2-3 core source files that represent the product's main functionality
- `.env.example` (what environment variables are needed?)
- `tsconfig.json` or build config (what build system?)
- Test files (do tests exist? what framework?)

### 3. Check for Case Study Maker
Does `.case-study/` or `.casestudy/` folder exist? If yes, read:
- `events.json` — captured build events
- Any markdown files with build notes, decisions, reflections

### 4. Synthesize into project profile
Create a mental model of:
- **What this project does** (1-2 sentences, plain English)
- **Who it's for** (target user)
- **Core features** (3-5 key capabilities)
- **Tech stack** (language, framework, key dependencies)
- **How to install and run it** (exact commands)
- **What makes it different** (unique value vs alternatives)

### 5. Store this analysis
Keep this analysis in context — every subsequent prompt will reference it.

## Output
No file output for this step. The analysis is used internally by all subsequent steps.
Confirm to the user: "Project analyzed: [name] — [1-sentence description]. Proceeding to README generation."
