# SECURITY_README.md — AI Agent Security Reference

> **Audience:** AI agents (Cursor, Claude Code, Copilot, Cline, etc.) performing security audits, updates, or hardening tasks on this codebase.
>
> **Purpose:** Machine-readable security inventory. Scan this file to understand the current security posture, identify what to check, and know where to apply patches as threats evolve.
>
> **Update cadence:** Review and update this file whenever security controls change. AI agents should re-read this file at the start of any security-related task.

---

## SECURITY_POSTURE

```yaml
project: git-launcher
version: 0.1.0
last_audit: 2026-03-05
audit_result: PASS
vulnerability_count: 0
secrets_required: false
network_required: false
cloud_services: none
```

---

## THREAT_MODEL

Each threat has an ID for reference. When patching or auditing, cite the threat ID.

```yaml
threats:
  - id: T001
    name: SSRF via screenshot URL
    severity: HIGH
    vector: "--url flag pointed at internal network or cloud metadata endpoint"
    status: MITIGATED
    control: URL allowlist in screenshot-runner.js
    file: scripts/screenshot-runner.js
    test: "Verify URL validation rejects http://169.254.169.254, http://internal.corp.net"

  - id: T002
    name: Path traversal on file output
    severity: HIGH
    vector: "--output flag writing files outside project boundary"
    status: MITIGATED
    control: resolve() + startsWith(cwd) prefix check
    file: scripts/image-generator.js
    test: "Verify --output ../../etc/passwd is rejected"

  - id: T003
    name: Directory traversal on scan input
    severity: MEDIUM
    vector: "projectRoot argument aimed at /, $HOME, /etc"
    status: MITIGATED
    control: Forbidden path list + depth limits
    files:
      - scripts/analyze-codebase.js
      - scripts/detect-project.js
    test: "Verify / and $HOME are rejected as projectRoot"

  - id: T004
    name: Secret leakage from host project
    severity: MEDIUM
    vector: ".env files or hardcoded keys copied into generated README/launch posts"
    status: MITIGATED
    control: Pre-build scanner checks workspace for secrets before any task runs
    file: scripts/pre-build-check.js
    test: "Create .env with dummy key, verify pre-build-check exits 1"

  - id: T005
    name: Dependency supply chain attack
    severity: MEDIUM
    vector: "Compromised npm package injected via loose version range"
    status: MITIGATED
    control: Exact version pinning + npm audit + pre-commit hook
    files:
      - package.json
      - hooks/pre-commit
    test: "Verify package.json has no ^, ~, or * version ranges"

  - id: T006
    name: XSS/injection in generated HTML/SVG
    severity: LOW
    vector: "Malicious project name injected into SVG text or HTML template"
    status: MITIGATED
    control: escapeXml() on all user strings, CSP meta tag, color input validation
    files:
      - scripts/image-generator.js
      - templates/social-preview.html
    test: "Verify <script>alert(1)</script> as --title is escaped in SVG output"

  - id: T007
    name: Container escape in hermetic build
    severity: LOW
    vector: "Breakout from Docker container accessing host filesystem"
    status: MITIGATED
    control: Non-root user, read-only root fs, no capabilities, no-new-privileges
    files:
      - Dockerfile
      - docker-compose.yml
    test: "Verify container runs as UID 1000, cannot write to /etc"

  - id: T008
    name: OS artifact leakage
    severity: LOW
    vector: ".DS_Store or Thumbs.db committed to repo exposing directory structure"
    status: MITIGATED
    control: .gitignore + pre-commit hook blocks OS artifacts
    files:
      - ../.gitignore
      - hooks/pre-commit
    test: "Verify git add .DS_Store is blocked by pre-commit hook"
```

---

## SECURITY_CONTROLS

### 1. Input Validation

| Control | File | What It Validates |
|---------|------|-------------------|
| URL allowlist | `scripts/screenshot-runner.js` | Only localhost, 127.0.0.1, [::1], 0.0.0.0 on http/https |
| Output path containment | `scripts/image-generator.js` | Output must resolve inside `process.cwd()` |
| Project root restriction | `scripts/analyze-codebase.js` | Forbidden: `/`, `/etc`, `/usr`, `/var`, `/tmp`, `/System`, `/Library`, `$HOME` |
| Project root restriction | `scripts/detect-project.js` | Same forbidden list as above |
| Screenshot output containment | `scripts/screenshot-runner.js` | Output dir must resolve inside projectRoot |
| Color format validation | `scripts/image-generator.js` | Must match `/^#[0-9a-fA-F]{6}$/` |
| XML entity escaping | `scripts/image-generator.js` | `escapeXml()` on title, subtitle, tech — handles `& < > " '` |

### 2. Secret Prevention

| Control | File | Behavior |
|---------|------|----------|
| Pre-build secret scanner | `scripts/pre-build-check.js` | Scans workspace for .env files and secret patterns before every task |
| Pre-commit hook | `hooks/pre-commit` | Blocks commits containing .env files or hardcoded secrets |
| .gitignore | `../.gitignore` | Covers .env*, *.pem, *.key, *.p12, *.pfx, secrets.json, credentials.json |

**Secret patterns scanned:**

```yaml
patterns:
  - name: Stripe live key
    regex: "sk_live_[a-zA-Z0-9]{20,}"
  - name: Stripe test key
    regex: "sk_test_[a-zA-Z0-9]{20,}"
  - name: AWS access key
    regex: "AKIA[A-Z0-9]{16}"
  - name: GitHub PAT (classic)
    regex: "ghp_[a-zA-Z0-9]{36}"
  - name: GitHub OAuth token
    regex: "gho_[a-zA-Z0-9]{36}"
  - name: GitHub fine-grained PAT
    regex: "github_pat_[a-zA-Z0-9_]{60,}"
  - name: Private key block
    regex: "-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----"
  - name: Slack token
    regex: "xox[bpsa]-[a-zA-Z0-9-]{10,}"
```

**When adding new secret types:** Add the regex to both `scripts/pre-build-check.js` (the `SECRET_PATTERNS` array) and `hooks/pre-commit` (the grep pattern).

### 3. Dependency Security

| Control | Mechanism |
|---------|-----------|
| Exact version pinning | `package.json` uses `"1.58.2"` not `"^1.58.2"` |
| npm audit | `npm run security:audit` and pre-commit hook |
| Minimal dependencies | Only 3 runtime deps: playwright, sharp, picocolors |
| Lock file integrity | `package-lock.json` committed and used via `npm ci` |

**When updating dependencies:**
1. Update version in `package.json` to exact new version
2. Run `npm install` to update lock file
3. Run `npm audit` to check for new vulnerabilities
4. Run `npm run security:check` to verify pinning
5. Update the version table in `plan/git-launcher/security.md`
6. Update `SECURITY_POSTURE.last_audit` date in this file

### 4. Content Security

| Control | File | Policy |
|---------|------|--------|
| CSP meta tag | `templates/social-preview.html` | `default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; script-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'` |
| SRI utility | `scripts/image-generator.js` | `computeSRI()` generates sha384 hashes for any future external resource references |
| SVG escaping | `scripts/image-generator.js` | All interpolated strings pass through `escapeXml()` |

### 5. Container Security (Hermetic Build)

| Control | File | Setting |
|---------|------|---------|
| Non-root user | `Dockerfile` | `USER agent` (UID 1000) |
| Network isolation | `docker-compose.yml` | `network_mode: "none"` |
| Read-only root filesystem | `docker-compose.yml` | `read_only: true` |
| Drop all capabilities | `docker-compose.yml` | `cap_drop: ALL` |
| No privilege escalation | `docker-compose.yml` | `security_opt: no-new-privileges:true` |
| Production only mounted read-only | `docker-compose.yml` | `../production:/project:ro` |
| Docker context trimmed | `.dockerignore` | Excludes node_modules, .git, .DS_Store, non-essential .md |
| tmpfs for temp files | `docker-compose.yml` | `/tmp:size=100M` |

### 6. Filesystem Depth Limits

| Script | Max Depth | Purpose |
|--------|-----------|---------|
| `analyze-codebase.js` | 8 levels | Prevent runaway recursion on deep trees |
| `detect-project.js` | 6 levels (files), 4 levels (extensions) | Limit scan scope |
| `pre-build-check.js` | 6 levels | Limit secret scan scope |

---

## IGNORED_DIRECTORIES

All scanning scripts skip these directories. If you add new scanners, use this same list:

```yaml
ignore_dirs:
  - node_modules
  - .git
  - dist
  - build
  - .next
  - __pycache__
  - target
  - vendor
  - .git-launcher
  - git-launch
  - .case-study
  - .casestudy
  - .venv
  - env
  - venv
  - coverage
  - .turbo
```

---

## FILE_INVENTORY

Security-relevant files and their roles:

```yaml
files:
  # Input validation
  - path: scripts/screenshot-runner.js
    controls: [T001, URL_ALLOWLIST, OUTPUT_CONTAINMENT]
    last_hardened: 2026-03-04

  - path: scripts/image-generator.js
    controls: [T002, T006, OUTPUT_CONTAINMENT, XML_ESCAPE, COLOR_VALIDATION, SRI_UTILITY]
    last_hardened: 2026-03-04

  - path: scripts/analyze-codebase.js
    controls: [T003, PATH_RESTRICTION, DEPTH_LIMIT]
    last_hardened: 2026-03-04

  - path: scripts/detect-project.js
    controls: [T003, PATH_RESTRICTION, DEPTH_LIMIT]
    last_hardened: 2026-03-04

  # Secret prevention
  - path: scripts/pre-build-check.js
    controls: [T004, T005, SECRET_SCAN, GITIGNORE_CHECK, PINNING_CHECK]
    last_hardened: 2026-03-04

  - path: hooks/pre-commit
    controls: [T004, T005, T008, SECRET_BLOCK, CRED_FILE_BLOCK, AUDIT, OS_ARTIFACT_BLOCK]
    last_hardened: 2026-03-05

  # Content security
  - path: templates/social-preview.html
    controls: [T006, CSP_HEADER]
    last_hardened: 2026-03-04

  # Container security
  - path: Dockerfile
    controls: [T007, NON_ROOT_USER]
    last_hardened: 2026-03-04

  - path: docker-compose.yml
    controls: [T007, NETWORK_NONE, READ_ONLY_FS, CAP_DROP, NO_NEW_PRIVS, PROD_MOUNT_ONLY]
    last_hardened: 2026-03-05

  - path: .dockerignore
    controls: [T007, BUILD_CONTEXT_TRIM]
    last_hardened: 2026-03-05

  # Configuration
  - path: ../.gitignore
    controls: [T004, T008, SECRET_IGNORE, OS_ARTIFACT_IGNORE]
    last_hardened: 2026-03-04

  - path: package.json
    controls: [T005, EXACT_PINNING, TASK_RUNNER]
    last_hardened: 2026-03-04

  # Policy
  - path: SECURITY.md
    controls: [DISCLOSURE_POLICY]
    last_hardened: 2026-03-04

  # Deploy pipeline
  - path: scripts/push-production.sh
    controls: [CLEANUP_TRAP]
    last_hardened: 2026-03-05

  - path: scripts/build-production.sh
    controls: [CLEAN_BUILD]
    last_hardened: 2026-03-04
```

---

## EVOLUTION_CHECKLIST

When the project evolves, use this checklist to determine if security controls need updating:

```yaml
triggers:
  - trigger: "New dependency added"
    action: "Pin exact version, run npm audit, update DEPENDENCY_SECURITY section"

  - trigger: "New script added"
    action: "Add path validation, add to pre-build-check task chain, update FILE_INVENTORY"

  - trigger: "New CLI flag added to any script"
    action: "Validate and sanitize input, add to INPUT_VALIDATION table"

  - trigger: "External URL or API endpoint introduced"
    action: "Add to URL allowlist or reject, update THREAT_MODEL with new SSRF vector"

  - trigger: "New file output location"
    action: "Add path containment check (resolve + startsWith), update OUTPUT_CONTAINMENT"

  - trigger: "User-supplied string interpolated into HTML/SVG/Markdown"
    action: "Escape before interpolation, add to CONTENT_SECURITY controls"

  - trigger: "New secret type needed (API key, token, etc.)"
    action: "Add pattern to pre-build-check.js and hooks/pre-commit, update SECRET_PATTERNS"

  - trigger: "Dependency version bumped"
    action: "Run npm audit, verify exact pinning, update version table in security.md"

  - trigger: "New Docker feature or mount"
    action: "Verify network_mode, read_only, cap_drop still apply, update CONTAINER_SECURITY"

  - trigger: "New ignore directory needed"
    action: "Add to IGNORED_DIRECTORIES list and all scanner scripts"

  - trigger: "npm audit reports new vulnerability"
    action: "Assess severity, update or patch dependency, document in THREAT_MODEL if needed"
```

---

## AUDIT_COMMANDS

Run these commands to verify security posture:

```bash
# Full pre-build security check (secrets, gitignore, pinning, OS artifacts)
cd .git-launcher && npm run security:check

# npm vulnerability audit
cd .git-launcher && npm run security:audit

# Verify setup and dependencies
cd .git-launcher && npm run verify

# Test SSRF protection
node -e "
  const u = new URL('http://169.254.169.254');
  const allowed = new Set(['localhost','127.0.0.1','[::1]','0.0.0.0']);
  console.log(allowed.has(u.hostname) ? 'FAIL: should block' : 'PASS: blocked');
"

# Test path traversal protection
cd .git-launcher && node scripts/analyze-codebase.js / 2>&1
# Expected: {"error":"Refusing to scan sensitive directory: /"}

# Verify dependency pinning (should return nothing)
node -e "
  const pkg = require('./.git-launcher/package.json');
  const deps = {...pkg.dependencies, ...pkg.devDependencies};
  const bad = Object.entries(deps).filter(([,v]) => /[\^~*]/.test(v) || v === 'latest');
  console.log(bad.length ? 'FAIL: ' + JSON.stringify(bad) : 'PASS: all pinned');
"

# Verify Docker security settings
grep -E '(network_mode|read_only|cap_drop|no-new-privileges|USER)' .git-launcher/Dockerfile .git-launcher/docker-compose.yml
```

---

## KNOWN_LIMITATIONS

```yaml
limitations:
  - id: L001
    description: "Agent prompt constraints (00-MAIN.md) are advisory, not enforced by code"
    risk: "Agent could ignore 'NEVER overwrite files outside git-launch/' instruction"
    mitigation: "Path validation in scripts provides code-level enforcement for script operations"
    future: "Add filesystem watcher or post-write verification"

  - id: L002
    description: "Pre-commit hook requires manual installation (npm run hooks:install)"
    risk: "New clones won't have hooks until explicitly installed"
    mitigation: "Document in README, add to setup script"
    future: "Use husky or lefthook for automatic hook management"

  - id: L003
    description: "Secret scanner uses regex patterns, not entropy analysis"
    risk: "Novel secret formats may not be detected"
    mitigation: "Pattern list covers major providers (Stripe, AWS, GitHub, Slack)"
    future: "Add entropy-based scanning for high-entropy strings in code"

  - id: L004
    description: "Container build not integrated into default workflow"
    risk: "Local runs bypass container isolation"
    mitigation: "Scripts have their own input validation independent of container"
    future: "Make container the default execution path for CI/CD"
```

---

## REVISION_LOG

| Date | Agent/Author | Change |
|------|-------------|--------|
| 2026-03-04 | claude-4.6-opus | Initial security architecture: input validation, secret prevention, CSP, container security |
| 2026-03-04 | claude-4.6-opus | Added Dockerfile, docker-compose, pre-commit hooks, SRI utility, color validation, SECURITY.md |
| 2026-03-05 | claude-4.6-opus | Security review #2: synced pre-commit secret patterns with pre-build-check.js, added nested .env + credential file blocking, created .dockerignore, added cleanup trap to push-production.sh, narrowed Docker mount to production/ only, removed unused imports, cleaned up detect-project.js import ordering |
