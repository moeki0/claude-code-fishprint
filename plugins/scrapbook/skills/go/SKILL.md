---
name: go
description: Browse the web, collect quotes, and write a text-driven digest with citations. Use when asked for "news", "what's happening", "scrapbook", or to research a topic.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - mcp__scrapbook__*
  - Skill(scrapbook:write)
---

# Scrapbook — Web Research & Citation Digest

Arguments: `$ARGUMENTS`

## What Scrapbook does

1. Browse the web for a given theme/topic
2. For each article, read it and invoke `/scrapbook:write` to generate a section
3. Concatenate all sections into a single Markdown digest

**Output format: narrative text with blockquote citations, all in the user's language.** No screenshots, no images (except important figures from articles).

**Language: detect the language the user used in `$ARGUMENTS` (or the conversation). Write everything in that language.**

## Sources

**Choose sources appropriate for the theme.** Do not rely on a fixed list — pick sources where the topic is actively discussed. Examples:

- **Tech general**: Hacker News (`news.ycombinator.com`, `hn.algolia.com/?q=QUERY`), Lobsters (`lobste.rs`)
- **AI/ML**: /r/MachineLearning, /r/LocalLLaMA, Papers With Code
- **Security**: /r/netsec, Krebs on Security
- **Design**: Designer News, /r/design
- **Science**: /r/science, Phys.org
- **Academic / Papers**: arXiv (`arxiv.org/list/{subject}/recent`), Semantic Scholar (`semanticscholar.org`), Google Scholar (`scholar.google.com`), Papers With Code, ACM Digital Library, OpenReview (`openreview.net`)
- **Programming languages**: respective community forums, Weekly newsletters
- **Any topic**: Reddit (`old.reddit.com/r/{topic}`) works as a universal curation layer
- **X/Twitter**: if curated sites link to tweets, follow and capture them (public tweets work without login)

**For global/international topics, use English-language sources only.** English sources have the highest volume, fastest updates, and best coverage for tech, science, AI, security, etc. Only use non-English sources when the topic is specifically regional (e.g. Japanese domestic policy, local events).

**Finding sources:** Use DuckDuckGo via `open("https://duckduckgo.com/?q=QUERY")` to discover good pages for any topic. Also try Wikipedia as a starting point and follow its references.

## Flow

### Phase 1: Browse & collect URLs

Use `open(url)` to browse sites. Read the DOM structure to find interesting posts and articles.

1. Choose as many sources as possible for the theme
2. Browse front pages and/or search for the theme
3. Follow links to source articles

Collect **as many candidate article URLs as possible** (20+).

### Phase 2: Read articles & generate sections

**Run everything in parallel.** Open pages, read content, and generate sections concurrently:

1. Call `open(url)` for up to 4 articles in parallel — each returns a page ID
2. As each page loads, read its content and follow outbound links to primary sources
3. Invoke `/scrapbook:write` for each article in parallel — each call produces one independent section
4. `close(id)` to free pages when done

**Maximize concurrency.** open calls, write calls — all can run in parallel since each article is independent.

### Phase 3: Assemble final digest

Each `/scrapbook:write` call should save its section to a temporary file (e.g. `/tmp/scrapbook_section_1.md`, `/tmp/scrapbook_section_2.md`, ...).

Then assemble the final file:

```bash
echo "# Scrapbook: {theme} — {date}" > output.md
echo "" >> output.md
for f in /tmp/scrapbook_section_*.md; do cat "$f" >> output.md; echo -e "\n---\n" >> output.md; done
```

## Rules

- **For global/international topics, use English-language sources only**
- **Citations must be translated to the user's language** — translate quotes naturally, not machine-translation style
- **NEVER use WebSearch or WebFetch tools.** All browsing must go through the `open` MCP tool.
- **NEVER invoke Python, Node, or any programming language via Bash.** Bash is for simple commands (ls, mkdir) only.
- No duplicates
- On error, skip and move on
- If `$ARGUMENTS` is empty, cover whatever is interesting on major tech curation sites right now
