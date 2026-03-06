# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Git Launcher, please report it responsibly.

**Do not open a public issue.**

Instead, email: **security@julieclarkson.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

You will receive an acknowledgment within 48 hours and a detailed response within 7 days.

## Scope

The following are in scope for security reports:

- **Path traversal** — scripts writing or reading outside the intended project directory
- **SSRF** — screenshot runner accessing hosts beyond localhost
- **Injection** — user-supplied strings (project names, descriptions) escaping into SVG/HTML without sanitization
- **Secret leakage** — the tool accidentally exposing `.env` files, API keys, or credentials from the host project into generated output
- **Dependency vulnerabilities** — known CVEs in pinned dependencies (playwright, sharp, picocolors)
- **Container escape** — breakout from the hermetic Docker build container

## Out of Scope

- Vulnerabilities in the user's own project code
- Social engineering
- Denial of service against local development tools
- Issues requiring physical access to the machine

## Security Design

Git Launcher is designed with a minimal attack surface:

- **No network** — operates entirely offline; screenshot capture is restricted to localhost
- **No secrets** — requires zero API keys, tokens, or credentials
- **No cloud** — no data leaves the machine
- **Scoped output** — all generated files go to `git-launch/`, never overwriting host project files without explicit consent
- **Input validation** — all CLI inputs (URLs, paths, colors) are validated before use
- **Pinned dependencies** — exact versions, audited regularly

See `SECURITY_README.md` for the full technical security architecture.
