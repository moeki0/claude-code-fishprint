---
name: capture
description: Webページの要素を翻訳してスクショを撮る。「スクショ撮って」「キャプチャして」「ページを翻訳して撮って」と言った時に使う。
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash(*/run.sh *)
---

# /kiri:capture — 翻訳スクショ

引数: `$ARGUMENTS`

Webページの指定要素に翻訳テキストを注入し、要素単位でスクショを撮影してGyazo/ローカルに保存する。

## フロー

1. `run.sh read "<url>"` でページのテキストを読む
2. 翻訳すべきセクションとセレクタを決定
3. 翻訳JSONを書き出し

```json
[
  { "selector": "h1", "translated": "翻訳タイトル" },
  { "selector": "p.intro", "translated": "翻訳本文" },
  { "selector": "div.text", "translated": "翻訳", "capture": false }
]
```

4. キャプチャ実行

```bash
${CLAUDE_SKILL_DIR}/run.sh "<url>" /tmp/sections.json
${CLAUDE_SKILL_DIR}/run.sh "<url>" /tmp/sections.json --local <dir>
```

- `translated` が空 → 翻訳注入しない
- `capture: false` → 翻訳注入だけしてスクショしない

引数にURLがあればそれを使う。なければユーザーに聞く。
