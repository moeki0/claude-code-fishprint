---
name: go
description: Browse X timeline, capture interesting tweets as screenshots, and write context. Use when asked for "news", "what's happening", "timeline", or "tweets".
user-invocable: true
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Bash(mkdir *)
  - Bash(ls *)
  - mcp__kiri__*
  - mcp__claude-in-chrome__*
---

# Kiri — X timeline digest with tweet screenshots

Arguments: `$ARGUMENTS`

## What Kiri does

1. Browse the user's X timeline
2. Pick interesting tweets matching the theme
3. Screenshot each tweet (auto-archive / 魚拓)
4. Research background context via WebSearch
5. Write a Markdown digest: tweet screenshots + context

## Theme

Priority:
1. **If arguments are provided** → use as theme (e.g., `/kiri:go AI`)
2. **If `./scrapbook.json` exists** → read theme, output, images from it
3. **Neither** → ask the user

Defaults when using arguments only:
- `output`: `kiri_{{date}}.md` (current directory)
- `images`: `local` (`./kiri_images/`)

## scrapbook.json (optional)

```json
{
  "name": "AI News",
  "theme": "AI, LLM, machine learning developments",
  "output": "ai_news_{{date}}.md",
  "images": "local",
  "instructions": "Write in Japanese."
}
```

- `images`: `"gyazo"` or `"local"`
- `instructions` → Custom directives applied to all phases

**If `./scrapbook.json` exists, always follow `instructions`.**

## Flow

### Phase 0: Load config

**First, check if `./scrapbook.json` exists.** If it does, read it with the Read tool.

### Phase 1: Collect tweets from X

Requires claude-in-chrome MCP.

**A. Following timeline:**
1. `tabs_context_mcp` to check current tabs
2. `navigate` to `https://x.com/home`, then click the "Following" tab via `javascript_tool`
3. **Incremental scroll collection** — X virtualizes the DOM (only ~5-7 tweets exist at a time). You MUST:
   a. Initialize a global collector: `window.__kiriTweets = {}`
   b. Run a loop: collect visible tweets into `__kiriTweets`, then `scrollBy(0, 800)` — small scroll to avoid skipping
   c. Each iteration is a **separate `javascript_tool` call** (NOT async/await in one call — it will timeout)
   d. Repeat 15-20 times to collect 30+ tweets
   e. After collection, read all results from `window.__kiriTweets`

**B. Explore / Trending:**
1. `navigate` to `https://x.com/explore/tabs/trending`
2. Same incremental scroll collection
3. Also check `https://x.com/explore/tabs/news`

Merge results from A and B.

### Phase 2: Select

Pick **5-10 tweets** that match the theme. Aim for diversity.

### Phase 3: Capture tweets

For each selected tweet, open its permalink and screenshot the tweet element.

1. Call `kiri_open(tweet_url)` — opens the tweet page
2. Call `kiri_capture(["article[data-testid='tweet']"], localDir)` — screenshots the tweet
3. Repeat for each tweet

### Phase 4: Research & write

For each captured tweet, research the background:

- **WebSearch** for related context (what is this about? why does it matter?)
- **WebFetch** to read linked articles if the tweet references one

### Phase 5: Generate Markdown

Write the Markdown yourself. For each tweet:

```markdown
## Brief topic description

![](tweet_screenshot.png)

Background context in 2-3 sentences. What is this about, why it matters,
what the implications are.

→ [Tweet](https://x.com/user/status/123)

---
```

**Rules for output:**
- `##` heading: brief topic label (not the tweet text)
- Tweet screenshot
- 2-3 sentences of context/background researched via WebSearch
- Link to original tweet
- `---` between topics

## Rules

- No duplicates
- Translate foreign tweets in the context text, not in screenshots
- On error, skip and move on
