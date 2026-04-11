---
name: go
description: Browse X timeline, capture interesting tweets as screenshots, and write context. Use when asked for "news", "what's happening", "timeline", or "scrapbook".
user-invocable: true
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Bash(mkdir *)
  - Bash(ls *)
  - mcp__scrapbook__*
  - mcp__claude-in-chrome__*
---

# Scrapbook — What's happening on X right now

Arguments: `$ARGUMENTS`

## What Scrapbook does

1. Browse the user's X timeline (Following + Trending)
2. Pick the most interesting/noteworthy tweets
3. Screenshot each tweet (auto-archive / 魚拓)
4. Research background via WebSearch
5. Write a Markdown digest: tweet screenshots + context

**No theme filtering. Capture whatever is interesting right now.**

**Tweet collection is from X timeline only. Do NOT use X search — it's unreliable.**
**WebSearch/WebFetch are used for background research only.**

## Output

- `output`: `scrapbook_{{date}}.md` (current directory)
- `images`: `local` (`./scrapbook_images/`)

If `./scrapbook.json` exists, read `output`, `images`, and `instructions` from it.

## Flow

### Phase 0: Load config (optional)

Check if `./scrapbook.json` exists. If it does, read it. Only `output`, `images`, and `instructions` are used. No theme.

### Phase 1: Collect tweets from X

Requires claude-in-chrome MCP.

**A. Following timeline:**
1. `tabs_context_mcp` to check current tabs
2. `navigate` to `https://x.com/home`, then click the "Following" tab via `javascript_tool`
3. **Incremental scroll collection** — X virtualizes the DOM (only ~5-7 tweets exist at a time). You MUST:
   a. Initialize a global collector: `window.__scrapbookTweets = {}`
   b. Run a loop: collect visible tweets into `__scrapbookTweets`, then `scrollBy(0, 800)` — small scroll to avoid skipping
   c. Each iteration is a **separate `javascript_tool` call** (NOT async/await in one call — it will timeout)
   d. Repeat 15-20 times to collect 30+ tweets
   e. After collection, read all results from `window.__scrapbookTweets`

**B. Explore / Trending:**
1. `navigate` to `https://x.com/explore/tabs/trending`
2. Same incremental scroll collection
3. Also check `https://x.com/explore/tabs/news`

Merge results from A and B.

### Phase 2: Select

Pick **5-10 of the most interesting tweets**. No theme filter — just pick what's noteworthy, surprising, important, or funny.

### Phase 3: Capture tweets

For each selected tweet, open its permalink and screenshot the tweet element.

1. Call `kiri_open(tweet_url)` — opens the tweet page
2. Call `kiri_capture(["article[data-testid='tweet']"], localDir)` — screenshots the tweet
3. Repeat for each tweet

### Phase 4: Research & write context

For each captured tweet, research the background:

- **WebSearch** for related context (what is this about? why does it matter?)
- **WebFetch** to read linked articles if the tweet references one
- If the tweet is in a foreign language, translate the key points in text

### Phase 5: Generate Markdown

Write the Markdown yourself. For each tweet:

```markdown
## Brief topic description

![](tweet_screenshot.png)

Background context in 2-3 sentences.

→ [Tweet](https://x.com/user/status/123)

---
```

**Rules for output:**
- `##` heading: brief topic label
- Tweet screenshot
- 2-3 sentences of context
- Link to original tweet
- `---` between topics

## Rules

- **Never use X search** — only Following timeline + Explore/Trending
- WebSearch/WebFetch are for background research only, not for finding tweets
- No duplicates
- Translate foreign tweets in the context text, not in screenshots
- On error, skip and move on
