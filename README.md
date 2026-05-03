# Fishprint

> Primary-source 魚拓 archive for the web — a [Claude Code](https://claude.ai/code) plugin.

Browse curated media (Hacker News, Lobsters, Reddit, arXiv, …), capture 魚拓 (screenshots) of the key sentences quoted, and write a citation-driven topic digest in Markdown.

Each 魚拓 shows the original page **exactly as published** — original language, original layout. A natural translation is rendered directly below as a blockquote. You get both: the primary-source evidence *and* the readable summary.

## Install

Claude Code plugin:

```
/plugin marketplace add moeki0/fishprint
/plugin install fishprint@fishprint
```

Pi package:

```bash
pi install https://github.com/moeki0/fishprint
# local development checkout:
pi install /path/to/fishprint
```

See [plugins/fishprint/README.md](plugins/fishprint/README.md) for prerequisites and detailed usage.

## Quick start

Claude Code:

```
/fishprint AI agents
/fishprint Rust async
/fishprint              # no theme — whatever is interesting right now
```

Pi:

```
/fishprint AI agents
/fishprint Rust async
/skill:fishprint AI agents
```

## License

MIT
