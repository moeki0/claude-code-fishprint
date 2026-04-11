# Kiri

Webコンテンツを切り取り、翻訳し、まとめるClaude Codeプラグイン。

記事やツイートのスクショに翻訳を注入したり、画像内のテキストをOCRで翻訳オーバーレイしたり、それらをまとめてMarkdownページを生成する。

## インストール

```
/plugin marketplace add moeki0/kiri
/plugin install kiri@kiri
```

依存関係（Playwright等）は初回実行時に自動インストールされます。

### オプション

```bash
# OCR機能を使う場合
brew install tesseract        # macOS
sudo apt install tesseract-ocr  # Linux

# Gyazoを使う場合
# macOS
security add-generic-password -a gyazo -s kiri -w YOUR_GYAZO_TOKEN -U
# Linux
secret-tool store --label=kiri service kiri key gyazo
```

## スキル一覧

| コマンド | 説明 |
|---------|------|
| `/kiri:go <theme>` | メインフロー。テーマに沿って情報収集→背景調査→翻訳スクショ→Markdownページ生成 |
| `/kiri:read <url>` | Webページのテキストを読み取る |
| `/kiri:capture <url>` | ページ要素に翻訳を注入してスクショ |
| `/kiri:ocr <image>` | 画像内テキストをOCRし、翻訳オーバーレイを作成 |

### 例

```
/kiri:go AI最新ニュース
/kiri:go 量子コンピュータの研究動向
/kiri:read https://example.com/article
/kiri:capture https://x.com/user/status/123
/kiri:ocr ~/Downloads/chart.png
```

## 設定（オプション）

繰り返し同じテーマで使う場合、プロジェクトルートに `kiri.json` を配置：

```json
{
  "name": "週刊AIニュース",
  "theme": "AI・LLM・機械学習の最新動向",
  "output": "wiki/ai_news_{{date}}.md",
  "images": "gyazo",
  "instructions": "解説は技術者向けに書く。Obsidianのwiki link形式を使う。"
}
```

| フィールド | 説明 | デフォルト |
|-----------|------|----------|
| `name` | 出力ページのタイトル | テーマから自動生成 |
| `theme` | 検索・選別・解説の判断軸 | 引数から取得 |
| `output` | 出力先パス。`{{date}}`は`YYYY_MM_DD`に置換 | `kiri_{{date}}.md` |
| `images` | `"gyazo"` or `"local"` | `"local"` |
| `instructions` | すべてのフェーズに適用されるカスタム指示 | なし |

`kiri.json`がない場合は引数でテーマを渡すか、対話で設定します。

## ライセンス

MIT
