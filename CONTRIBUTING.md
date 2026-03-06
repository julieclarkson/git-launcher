# Contributing to Git Launcher

Thanks for your interest in contributing. Here's how to get involved.

## Reporting Bugs

Open an issue using the **Bug Report** template. Include:

- Steps to reproduce
- Expected vs. actual behavior
- Node.js version (`node --version`)
- Operating system
- The project you were analyzing (if relevant)

## Suggesting Features

Open an issue using the **Feature Request** template. Describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

## Submitting Pull Requests

1. Fork the repo and create a branch from `main`
2. Install dependencies: `cd .git-launcher && npm install`
3. Make your changes
4. Run security checks: `npm run security:check`
5. Run the audit: `npm run security:audit`
6. Test against a sample project: `node scripts/detect-project.js /path/to/project`
7. Open a PR with a clear description of the change

### Code Style

- ES modules (`import`/`export`), not CommonJS
- Use `node:` prefix for built-in modules (`node:fs`, `node:path`)
- Keep imports at the top of the file
- No inline imports inside functions
- Pin dependency versions exactly (no `^` or `~`)

### Security Requirements

All PRs must pass:

- `npm run security:check` — no secrets, pinned deps, gitignore coverage
- `npm run security:audit` — no known vulnerabilities
- Input validation on any new CLI flags or file paths
- Path containment checks on any new file output locations

### What Makes a Good PR

- Solves a real problem or adds clear value
- Includes a brief explanation of *why*, not just *what*
- Doesn't introduce new dependencies without justification
- Passes all existing security checks

## Development Setup

```bash
git clone https://github.com/julieclarkson/git-launcher.git
cd git-launcher
bash .git-launcher/install.sh
```

## Questions?

Open an issue. There are no bad questions.
