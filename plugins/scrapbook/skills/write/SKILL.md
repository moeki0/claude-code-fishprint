---
name: write
description: Generate a text-driven Markdown digest with original-language citations. Called by /scrapbook:go after research phase.
user-invocable: true
allowed-tools:
  - Read
  - Write
---

# /scrapbook:write — Generate citation digest

Arguments: `$ARGUMENTS` (output path, theme, date, language, collected quotes)

## What this does

Write a text-driven article in the user's language, embedding verbatim citations from original sources as blockquotes. The narrative explains and contextualizes; the blockquotes prove it with the original words.

## Structure

```markdown
# Scrapbook: {theme} — {date}

## Topic or article title (in user's language)

Narrative text explaining the context and significance in the user's language.
What happened, why it matters, what the key points are.

> Verbatim quote from the original source in its original language.
> Copied exactly as written — not paraphrased, not translated.
>
> — Author/Source name

Further narrative connecting this quote to the next point.
Analysis, context, implications — all in the user's language.

> Another verbatim quote supporting or contrasting the point.
> Multiple paragraphs of the original text if needed.
>
> — Author/Source name

### Sub-topic or referenced primary source

Narrative explaining what this source adds to the picture.

> Quote from the primary source (paper, official blog, etc.)
>
> — Source name

→ [Source](https://example.com/article)

---

## Next topic

...

---
```

## Rules for output

- **Narrative text in the user's language, citations in the original language.** This is the core format.
- **Citations are verbatim blockquotes** — exact original text, never paraphrased or translated. Include `— Author/Source` attribution.
- **Text drives the narrative, citations are evidence.** Never stack blockquotes without narrative text between them.
- Narrative text between citations should:
  - Explain what the citation says (for readers who don't read the original language)
  - Contextualize why it matters
  - Connect it to the broader theme
  - Transition to the next point
- `##` heading: topic title in user's language
- `---` between major topics
- Link to original source at the end of each section
- **Include as many citations as possible** — the more evidence, the better
- If `instructions` from scrapbook.json are provided, follow them
