# Step 3: Generate Metadata & Config Files

## Files to Generate

### 3a. CONTRIBUTING.md
- How to report bugs
- How to suggest features
- How to submit PRs
- Code style guidelines (infer from project's linter config or language conventions)
- Development setup instructions (use install/run commands from project analysis)

### 3b. CODE_OF_CONDUCT.md
- Use Contributor Covenant v2.1 (standard)

### 3c. LICENSE
- Based on project analysis:
  - If package.json has "license" field → use that
  - If no license specified → default to MIT
  - Generate full license text with current year and project name

### 3d. GitHub Issue Templates
**git-launch/.github/ISSUE_TEMPLATE/bug_report.md:**
- Title prefix: [Bug]
- Fields: description, steps to reproduce, expected behavior, actual behavior, environment

**git-launch/.github/ISSUE_TEMPLATE/feature_request.md:**
- Title prefix: [Feature]
- Fields: description, use case, proposed solution, alternatives considered

### 3e. PR Template
**git-launch/.github/PULL_REQUEST_TEMPLATE.md:**
- Description of changes
- Type of change (bug fix, feature, breaking change)
- Checklist: tests added, docs updated, no breaking changes

### 3f. GitHub Repository Metadata
**git-launch/LAUNCH_KIT/github-description.md:**
- Repository description (max 350 chars, compelling, keyword-rich)
- Suggested topics (8-12 tags based on tech stack and purpose)
  - Include: language, framework, purpose category, audience
  - Example: ["nextjs", "react", "developer-tools", "readme-generator", "ai", "typescript", "github", "automation"]
- About section text
- Website URL suggestion

## Output
Write each file to its location within `git-launch/`.
Confirm: "Generated: CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE ([type]), 2 issue templates, PR template, repo metadata"
