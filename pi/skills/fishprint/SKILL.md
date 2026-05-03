---
name: fishprint
description: Browse the web with Fishprint, capture 魚拓 screenshots of key source sentences, and write a citation-driven Markdown digest. Use when asked for fishprint, news digests, what is happening, or primary-source web research.
---

# Fishprint for pi — Primary-source web research with 魚拓

Arguments: `$ARGUMENTS`

## What Fishprint does

Fishprint creates a Markdown digest from primary web sources:

1. Discover candidate topics from Exa or curation sites.
2. Open source pages with the local Fishprint daemon.
3. Capture narrow original-language quote screenshots (魚拓) with Gyazo URLs.
4. Write narrative sections in the user's language, with a natural translation below each screenshot.
5. Assemble the final digest with `fishprint_assemble`.

## Required daemon

Before research, call `fishprint_health`.

If it fails, tell the user to start Fishprint:

```bash
cd ~/Development/fishprint/plugins/fishprint && bun run daemon
# or install as LaunchAgent:
cd ~/Development/fishprint/plugins/fishprint && bun run daemon:install
```

Gyazo token is required for captures:

```bash
security add-generic-password -a gyazo -s fishprint -w YOUR_GYAZO_TOKEN -U
```

## Tools

Use the pi Fishprint tools, not raw curl, when available:

- `fishprint_health` — check daemon
- `fishprint_open` — open a URL and inspect summarized DOM/selectors
- `fishprint_capture` — capture screenshots for narrow selectors
- `fishprint_close` — close opened pages
- `fishprint_assemble` — combine `section_N.md` files into the final digest

You may use `bash` for simple discovery calls such as Exa API requests or listing existing Markdown files. Prefer `grep`/`read` for local files.

## Language

Detect the user's language from `$ARGUMENTS` or the conversation. Write the digest in that language. Keep 魚拓 screenshots in the original source language; put a natural translation below each image as a Markdown blockquote.

## Flow

### Phase -1: Avoid duplicates

Scan Markdown files in the current working directory. Skim headings and source URLs to build a seen-topics list. Exclude candidates that cover the same product, paper, event, incident, or finding.

### Phase 0: Pick paths

Choose a unique temporary section directory, e.g. `/tmp/fishprint_YYYYMMDD_HHMMSS`.

Final output path must be absolute and in the current working directory:

- If `$ARGUMENTS` has a theme: `{theme}_YYYY-MM-DD.md`
- If empty: `fishprint_YYYY-MM-DD.md`
- Sanitize `/ \ : * ? " < > |` and replace spaces with `_`.

### Phase 0.5: Resolve time constraints

If `$ARGUMENTS` contains temporal references such as 今日, 今週, today, this week, convert them immediately to absolute date ranges using the current date from system context. Treat the range as a hard filter.

### Phase 1: Discover candidate topics

Primary discovery is Exa if `EXA_API_KEY` is available:

```bash
curl -s -X POST https://api.exa.ai/search \
  -H "x-api-key: $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"<theme in English for global topics>","type":"auto","numResults":15,"contents":{"highlights":{"maxCharacters":600}}}'
```

For global topics, query in English. For local/regional topics, use the relevant language.

Fallback or supplement with curation pages opened through `fishprint_open`:

- Tech: Hacker News, Lobsters
- AI/ML: Reddit MachineLearning / LocalLLaMA, Papers With Code, arXiv
- Security: netsec, Krebs
- Science: arXiv, Phys.org, Reddit science
- General: DuckDuckGo result pages, Reddit, Wikipedia references

Collect 15–20 candidates when possible. Select about 5–8 strongest topics for pi runs; fewer-deeper is better than padding. Keep rejected candidates and reasons for the appendix.

Keep a work log of sources surveyed: Exa queries and curation pages visited.

Close all discovery pages with `fishprint_close` before deep work.

### Phase 2: Write sections

For each selected topic, sequentially:

1. Open candidate source URLs with `fishprint_open`.
2. Read the summarized DOM and identify authoritative paragraphs.
3. Pick 1–3 thesis sentences worth quoting.
4. Capture original-language evidence with `fishprint_capture`.
5. If capture rejects a selector, retry with a narrower selector.
6. Write `/tmp/.../section_N.md` using the `write` tool.
7. Close every opened page with `fishprint_close`.

Selector rules are critical:

- Target one paragraph/list item/blockquote/figcaption or short h2/h3.
- Allowed: `p`, `blockquote`, `li`, `figcaption`, `h2`, `h3`.
- Forbidden: `div`, `section`, `article`, `main`, `aside`, `body`.
- Avoid container classes like `content`, `post-content`, `article-body`, `prose`, `markdown-body`.
- Prefer selectors like `article p:nth-of-type(4)` over broad classes.
- Elements over 600px tall or 1200 chars are rejected; go narrower.

Section format:

```markdown
## Topic title in user's language

Narrative text explaining what happened and why it matters.

![Original-language quote, as shown on the page](https://i.gyazo.com/xxx.png)
https://gyazo.com/xxx

> Natural translation in the user's language.

More narrative connecting the evidence.

**Sources:**
- → [Source title](https://example.com/)
```

Rules:

- Narrative drives the section; 魚拓 + translation are evidence.
- Never stack two image/translation pairs without narrative between them.
- Every image must be followed immediately by the bare Gyazo permalink URL, then the translation blockquote.
- Embed visually central source images (hero image, product screenshot, graph, benchmark chart) using the original image URL when they are essential to the story.
- Always end with source links.

### Phase 3: Assemble — mandatory

Call `fishprint_assemble` with:

- `sectionDir`
- absolute `output`
- localized `preamble`
- localized `appendix` when there are rejected candidates

Preamble must include:

1. A humble scope line: one curator's view, not a complete index.
2. Sources surveyed: exact Exa queries and curation URLs visited.

Appendix format:

```markdown
## Also seen (not selected)

- [Candidate title](https://example.com/) — reason not selected
```

Do not end without assembling unless no sections were successfully written.

## Constraints

- For global/international topics, prefer English-language primary sources.
- Translate quotes naturally into the user's language.
- Use Fishprint daemon pages for anything you quote/capture.
- No duplicates.
- Enforce time constraints strictly.
- On source errors, skip that source and continue.
