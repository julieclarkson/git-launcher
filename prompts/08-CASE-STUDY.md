# Step 8: Case Study Maker Integration

## Check
Does `.case-study/` or `.casestudy/` folder exist in the project root?
- If NO: Skip this step. Output: "No Case Study Maker data found. Skipping."
- If YES: Continue below.

## What to Read
- `events.json` — Build events log
- Any `.md` files — Build notes, reflections, decisions
- `media/` — Screenshots captured during build

## What to Enhance
Using the case study data, enrich these previously generated files:

### README Enhancement
- Add a "Development Story" or "Built With" section near the end
- Include key decisions and why they were made
- Add a "Lessons Learned" subsection if relevant data exists

### Launch Kit Enhancement
- Enrich the Dev.to article with the build narrative (makes a much better blog post)
- Add decision rationale to the HN first comment
- Add "why I built this" personal angle to Reddit post and Twitter thread

### New Output
- Generate `git-launch/CASE_STUDY.md` — a standalone technical case study document
  covering: problem, approach, key decisions, challenges, results
  This can be linked from the README or published separately.

## Output
Enhanced files in `git-launch/` + new `git-launch/CASE_STUDY.md`
Confirm: "Case study data integrated — enhanced [N] files, generated standalone case study"
