# Step 5: Generate Architecture Diagram

## Steps

1. Execute: `node .git-launcher/scripts/analyze-codebase.js .`
2. Read the JSON output (nodes, edges, externalDeps, summary)
3. Generate Mermaid diagram(s):

### Diagram 1: Component Architecture
Show the actual file/module relationships from the codebase analysis. Group related files into subgraphs (e.g., Frontend, API, Library, Config). Show import relationships as edges.

### Diagram 2: Technology Stack
Show the technology layers and how they connect. Group by concern (Client, Server, Database, External Services).

4. Write explanation text alongside diagrams:
   - What each component does (1 sentence each)
   - Data flow description
   - Key architectural decisions

## Fallback
If the analyze-codebase.js script fails or the project is too simple for AST analysis:
- Read the project structure manually (directory listing + key files)
- Generate diagrams from your understanding of the codebase
- Note that diagrams were generated from manual analysis

## Attribution
Add this line at the very end of the file:
```
---
*Generated with [Git Launcher](https://github.com/julieclarkson/git-launcher)*
```

## Output
Write to: `git-launch/ARCHITECTURE.md`
Include both Mermaid diagrams and prose explanation.
Confirm: "Architecture documented with [N] diagrams covering [N] modules"
