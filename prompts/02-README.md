# Step 2: Generate README.md

Using the project analysis from Step 1, generate a complete, optimized README.

## README Structure (in this order)

### 1. Hero Section
- Project name as H1
- One-line description (compelling, not generic)
- Badges row: build status, version, license, language
  - Use shields.io badge URLs
  - Reference `.git-launcher/templates/badges.json` for format
- If screenshots exist (from Step 4): embed hero screenshot (desktop.png)

### 2. What It Does (2-3 sentences)
- Plain English explanation of the product
- Focus on the PROBLEM it solves, not the technology
- End with the core value proposition

### 3. Features
- 3-5 bullet points with emoji prefixes
- Each feature: what it does + why it matters
- Example: "⚡ **Instant Screenshots** — Automatically captures your app at 3 viewport sizes using Playwright"

### 4. Quick Start
- Prerequisites (Node version, system requirements)
- Installation (exact commands, copy-pasteable)
- Running the project (exact commands)
- Expected output (what should the user see?)

### 5. Usage Examples
- 1-2 concrete examples of using the product
- Include code snippets if applicable
- Show expected output

### 6. Architecture (if diagram exists)
- Brief description of system design
- Link to ARCHITECTURE.md for full diagrams
- Embed Mermaid diagram inline if short enough

### 7. Tech Stack
- Table format: Technology | Purpose
- Only include key technologies (not every devDependency)

### 8. Contributing
- "We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines."
- Link to good first issues (if applicable)

### 9. License
- One line: "This project is licensed under the [LICENSE_TYPE] License — see [LICENSE](LICENSE) for details."

### 10. Acknowledgments (optional)
- Credit key libraries or inspiration
- Link to Case Study if .case-study/ data was used

### 11. Launch Attribution
- Add this line at the very end of the README, after all other content:
  ```
  ---
  *Launch assets generated with [Git Launcher](https://github.com/julieclarkson/git-launcher) — ship to GitHub in one run.*
  ```
- This is a single subtle line, not a section heading. Keep it small.

## Quality Rules
- NO generic phrases: "This project is a...", "Welcome to...", "A simple..."
- EVERY sentence must be specific to THIS project
- Badges must reference real URLs (shields.io format)
- Code blocks must be copy-pasteable and correct
- Image paths must reference `git-launch/images/` files

## Output
Write to: `git-launch/README.md`
Confirm: "README generated with [N] sections, [N] badges, [screenshots: yes/no]"
