# Step 7: Generate Launch Kit

Using project analysis + generated README, create platform-specific launch posts.

## Platforms and Their Rules

### Reddit Post (git-launch/LAUNCH_KIT/reddit-post.md)
- Target subreddits based on project type:
  - Web app → r/webdev, r/SideProject, r/javascript (or relevant language sub)
  - Dev tool → r/programming, r/devtools, r/commandline
  - AI tool → r/MachineLearning, r/artificial, r/LocalLLaMA
  - Python → r/Python
  - Rust → r/rust
  - Go → r/golang
- Format: Title + self-post body
- Title: direct, no clickbait, describe what it does
- Body: problem → solution → link → "happy to answer questions"
- Reddit culture: humble, helpful, not salesy. Lead with the problem you solved.
- Include "Show Reddit" flair suggestion

### Hacker News (git-launch/LAUNCH_KIT/hackernews-post.md)
- Title: "Show HN: [Project Name] – [one-line description]"
- Max 80 chars for title
- First comment: explain motivation, what it does, tech stack, what feedback you want
- HN culture: technical depth appreciated, no marketing speak
- Link directly to GitHub repo

### Twitter/X Thread (git-launch/LAUNCH_KIT/twitter-thread.md)
- 5-7 tweet thread
- Tweet 1: Hook — the problem (relatable, specific)
- Tweet 2: The solution — what you built
- Tweet 3: Key feature with screenshot/GIF placeholder
- Tweet 4: How it works (brief)
- Tweet 5: Tech stack / "built with"
- Tweet 6: Call to action — link to repo
- Tweet 7: "If this is useful, star the repo and follow for more tools like this"
- Use line breaks for readability. No hashtag spam (1-2 max).

### Product Hunt (git-launch/LAUNCH_KIT/producthunt-listing.md)
- Tagline: max 60 chars, catchy
- Description: 3-4 paragraphs explaining problem, solution, features, and who it's for
- First Comment (Maker Comment): personal story, why you built it, what's next
- Topics: suggest 3-5 PH topics
- Gallery images: reference screenshots from git-launch/images/

### Dev.to Article (git-launch/LAUNCH_KIT/devto-post.md)
- Title: "I built [tool] to solve [problem] — here's how"
- Structure: problem → failed attempts → solution → how it works → demo → try it → what's next
- Include code snippets
- Conversational tone
- Tag suggestions: 4 tags relevant to the project

## Quality Rules
- EVERY post must be specific to THIS project (no templates showing through)
- Match each platform's culture and norms
- Include the GitHub repo URL in every post
- Reference screenshots/demos where relevant
- No fake enthusiasm or marketing clichés

## Output
Write all files to `git-launch/LAUNCH_KIT/`.
Confirm: "Launch kit generated: Reddit, HN, Twitter/X, Product Hunt, Dev.to — all tailored to [project name]"
