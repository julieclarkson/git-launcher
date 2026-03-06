<p align="center">
  <img src="assets/logo.svg" alt="Git Launcher" width="200"/>
</p>

# Git Launcher

![License](https://img.shields.io/github/license/julieclarkson/git-launcher)
![Version](https://img.shields.io/github/package-json/v/julieclarkson/git-launcher)
![Last Commit](https://img.shields.io/github/last-commit/julieclarkson/git-launcher)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

Your project is built. Now ship it properly.

Git Launcher is an AI agent plugin that reads your finished codebase and generates everything you need to launch on GitHub — a polished README, metadata files, screenshots, architecture diagrams, a social preview image, and platform-specific launch posts for Reddit, Hacker News, Twitter/X, Product Hunt, and Dev.to.

**No API keys. No cloud. No cost.** Runs entirely inside your AI IDE (Cursor, Claude Code, Cowork) using the built-in AI.

## Features

- **Codebase Analysis** — Detects your language, framework, dependencies, and project structure automatically
- **README Generation** — Writes a complete README with badges, features, install instructions, and architecture overview
- **Screenshot Capture** — Uses Playwright to photograph your running app at desktop, tablet, and mobile viewports (or generates a preview page for CLI projects)
- **Architecture Diagrams** — Parses your imports to generate Mermaid component diagrams
- **Social Preview Image** — Renders a branded 1200x630 OG image for GitHub and link sharing
- **Multi-Platform Launch Kit** — Generates tailored posts for Reddit, HN, Twitter/X, Product Hunt, and Dev.to
- **Security Hardened** — Input validation, SSRF prevention, secret scanning, path traversal protection, and optional container isolation

## Quick Start

### Prerequisites

- **Node.js >= 18** — for screenshot capture, image generation, and codebase analysis
- **AI IDE** — [Cursor](https://cursor.sh), Claude Code, or any IDE with AI agent support

### 1. Add to your project

```bash
git submodule add https://github.com/julieclarkson/git-launcher .git-launcher
```

### 2. Install (one command)

Open **Terminal** (or Command Prompt), go to your project folder, then paste and run:

```bash
bash .git-launcher/install.sh
```

That installs everything, including Chromium for screenshots. When it finishes, you're done.

**Having trouble?** If the install fails partway through, run these one at a time in Terminal:

```bash
cd .git-launcher && npm install
cd .git-launcher && npm run setup:chromium
```

### 3. Run it

Open your project in your AI IDE and tell the agent:

> Read `.git-launcher/prompts/00-MAIN.md` and execute the workflow.

The agent will analyze your project and generate everything into a `git-launch/` folder.

### 4. Capture screenshots

In **Terminal**, from your project folder, run:

```bash
node .git-launcher/scripts/screenshot-runner.js . --preview
```

This adds desktop, tablet, and mobile screenshots to `git-launch/images/`. For web apps, start your dev server first and use `--port 3000` (or your port) instead of `--preview`.

## What Gets Generated

```
git-launch/
├── README.md              # Complete, optimized README
├── CONTRIBUTING.md        # Contributor guide
├── CODE_OF_CONDUCT.md     # Code of conduct
├── LICENSE                # License file
├── ARCHITECTURE.md        # Mermaid diagrams + explanation
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── images/
│   ├── desktop.png       # 1440x900 screenshot
│   ├── tablet.png        # 768x1024 screenshot
│   ├── mobile.png        # 375x812 screenshot
│   └── social-preview.png # 1200x630 OG image
└── LAUNCH_KIT/
    ├── reddit-post.md
    ├── hackernews-post.md
    ├── twitter-thread.md
    ├── producthunt-listing.md
    ├── devto-post.md
    └── github-description.md
```

## How It Works

1. **Analyze** — Scans your codebase to understand what it does, its tech stack, dependencies, and structure
2. **Generate README** — Writes a complete README with badges, features, install instructions, and architecture overview
3. **Capture Screenshots** — Uses Playwright to take screenshots of your running app at 3 viewport sizes (or generates a preview for CLI projects)
4. **Map Architecture** — Parses imports to build component diagrams as Mermaid
5. **Create Social Image** — Renders a branded 1200x630 OG image for GitHub
6. **Write Launch Kit** — Generates platform-specific posts for Reddit, HN, Twitter/X, Product Hunt, and Dev.to
7. **Case Study Integration** — If [Case Study Maker](https://github.com/julieclarkson/case-study-maker) data exists, enriches everything with your build narrative

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime for scripts |
| Playwright | Screenshot capture |
| Sharp | Image generation for social preview |
| Marked | README-to-HTML for CLI preview |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
