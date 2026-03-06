# Step 4: Capture Screenshots

## Two Modes

### Mode A: Project has a web UI (startCommand and port)
The user's dev server must be running.

1. Ask user: "Is your dev server running at http://localhost:{port}? If not, please run `{startCommand}` in a separate terminal."
2. Wait for user confirmation
3. Execute: `node .git-launcher/scripts/screenshot-runner.js . --port {port}`
4. Check output JSON and report success or failure

### Mode B: Project has NO web UI (CLI, library, or no startCommand)
Generate a preview of the launch assets and screenshot it. One command does both:

```bash
node .git-launcher/scripts/screenshot-runner.js . --preview
```

This generates `git-launch/preview.html` from the README and launch kit, then captures desktop, tablet, and mobile screenshots. Check output JSON and report success or failure.

## Steps (decide mode first)

1. Check project analysis: if `startCommand` and a reasonable port exist, use Mode A. Otherwise use Mode B.
2. Execute the appropriate mode above
3. If success: Report "Screenshots captured: desktop (1440x900), tablet (768x1024), mobile (375x812)"
4. If failure: Report error and continue. Note: "Screenshots skipped — {reason}"
5. If screenshots exist, update the README (from Step 2) to embed the hero image

## Output
Files: `git-launch/images/desktop.png`, `tablet.png`, `mobile.png`
If failed: Note in LAUNCH_CHECKLIST.md that screenshots need manual capture
