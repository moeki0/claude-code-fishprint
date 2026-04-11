# Kiri

A Claude Code plugin that clips, translates, and compiles web content into a scrapbook.

Captures screenshots of articles and tweets with injected translations, OCR-translates text in images, and assembles everything into a Markdown page.

## Install

```
/plugin marketplace add moeki0/kiri
/plugin install kiri@kiri
```

Then run once in your terminal:

```bash
cd ~/.claude/plugins/cache/kiri/kiri/*/
bun install && bunx playwright install chromium
bun link
```

### Optional

```bash
# For OCR
brew install tesseract        # macOS
sudo apt install tesseract-ocr  # Linux

# For Gyazo image hosting
# macOS
security add-generic-password -a gyazo -s kiri -w YOUR_GYAZO_TOKEN -U
# Linux
secret-tool store --label=kiri service kiri key gyazo
```

## Skills

| Command | Description |
|---------|-------------|
| `/kiri:go <theme>` | Main flow: gather → research → capture → generate Markdown |
| `/kiri:capture <url>` | Take translated screenshots of page elements |
| `/kiri:ocr <image>` | OCR text from images and create translation overlays |

### Examples

```
/kiri:go latest EV market trends
/kiri:go AI model releases this week
/kiri:capture https://x.com/user/status/123
/kiri:ocr ~/Downloads/chart.png
```

## Configuration (optional)

For recurring themes, place a `kiri.json` at your project root:

```json
{
  "name": "AI Weekly",
  "theme": "AI, LLM, and machine learning developments",
  "output": "wiki/ai_news_{{date}}.md",
  "images": "gyazo",
  "sources": ["web", "x"],
  "instructions": "Write in Japanese. Use Obsidian wiki link format."
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `name` | Title for the output page | Auto-generated from theme |
| `theme` | Guides search, selection, and commentary | From arguments |
| `output` | Output path. `{{date}}` → `YYYY_MM_DD` | `kiri_{{date}}.md` |
| `images` | `"gyazo"` or `"local"` | `"local"` |
| `sources` | Information sources (see below) | `["web"]` |
| `instructions` | Custom directives applied to all phases | None |

Without `kiri.json`, pass the theme as an argument or Kiri will ask interactively.

### Sources

| Source | Description | Requirements |
|--------|-------------|--------------|
| `"web"` | Search via WebSearch | None (default) |
| `"x"` | Browse X (Twitter) timeline | [Claude in Chrome](https://chromewebstore.google.com/detail/claude-in-chrome/aeiigcfknpfpdklbppjhgoappogemjim) extension |

`"web"` is always available. `"x"` requires the Claude in Chrome browser extension, which lets Claude Code interact with your logged-in browser to read your X timeline, extract tweets, and capture them.

```json
// Web only (default, no extensions needed)
{ "sources": ["web"] }

// Web + X timeline
{ "sources": ["web", "x"] }
```

## License

MIT
