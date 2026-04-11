# Scrapbook

A Claude Code plugin that browses your X timeline, screenshots interesting tweets, and writes a digest with context.

## What it does

1. Browses your X Following timeline + Explore/Trending
2. Picks the most interesting tweets
3. Screenshots each tweet (auto-archive / 魚拓)
4. Researches background via WebSearch
5. Generates a Markdown digest: tweet screenshots + context

## Install

```
/plugin marketplace add moeki0/claude-code-scrapbook
/plugin install scrapbook@scrapbook
```

Requires [Claude in Chrome](https://chromewebstore.google.com/detail/claude-in-chrome/aeiigcfknpfpdklbppjhgoappogemjim) extension for X timeline access.

### Setup

```bash
cd ~/.claude/plugins/cache/scrapbook/scrapbook/*/
bun install && bunx playwright install chromium
```

### Optional: Gyazo

```bash
# macOS
security add-generic-password -a gyazo -s scrapbook -w YOUR_GYAZO_TOKEN -U
# Linux
secret-tool store --label=scrapbook service scrapbook key gyazo
```

## Usage

```
/scrapbook:go
```

That's it. No theme, no config needed. It captures whatever is interesting on your timeline right now.

Output: `scrapbook_YYYY_MM_DD.md` with tweet screenshots in `./scrapbook_images/`.

## Configuration (optional)

Place `scrapbook.json` at project root to customize output:

```json
{
  "output": "news/digest_{{date}}.md",
  "images": "gyazo",
  "instructions": "Write in Japanese."
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `output` | Output path. `{{date}}` → `YYYY_MM_DD` | `scrapbook_{{date}}.md` |
| `images` | `"gyazo"` or `"local"` | `"local"` |
| `instructions` | Custom directives | None |

## License

MIT
