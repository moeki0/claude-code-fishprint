import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

// OSキーチェーンからトークンを取得
function getKeychainToken(service: string, account: string): string | null {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      return execSync(`security find-generic-password -a "${account}" -s "${service}" -w 2>/dev/null`).toString().trim();
    } else if (platform === "linux") {
      return execSync(`secret-tool lookup service "${service}" key "${account}" 2>/dev/null`).toString().trim();
    }
  } catch {
    return null;
  }
  return null;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Usage:
//   ./run.sh read <url>                              # ページのテキストを読み取る
//   ./run.sh <url> <config.json>                     # Gyazoにアップロード
//   ./run.sh <url> <config.json> --local <dir>       # ローカルに保存
const command = process.argv[2];

// --local <dir> オプションを検出
let localDir: string | null = null;
const localIdx = process.argv.indexOf("--local");
if (localIdx !== -1 && process.argv[localIdx + 1]) {
  localDir = process.argv[localIdx + 1];
}

async function launchPage(pageUrl: string, width = 1280) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    userAgent: UA,
  });
  const page = await context.newPage();
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  return { browser, page };
}

async function saveImage(imageBuffer: Buffer, title?: string): Promise<string> {
  if (localDir) {
    // ローカル保存
    if (!existsSync(localDir)) mkdirSync(localDir, { recursive: true });
    const filename = `${randomUUID().slice(0, 8)}.png`;
    const filepath = join(localDir, filename);
    writeFileSync(filepath, imageBuffer);
    console.error(`Saved: ${filepath}`);
    return filepath;
  } else {
    // Gyazoアップロード（キーチェーンから取得）
    const token = getKeychainToken("newsletter", "gyazo");
    if (!token) {
      console.error("Gyazo token not found in keychain. Set it with:");
      console.error("  macOS: security add-generic-password -a gyazo -s newsletter -w YOUR_TOKEN -U");
      console.error("  Linux: secret-tool store --label=newsletter service newsletter key gyazo");
      console.error("Or use --local <dir> for local storage.");
      process.exit(1);
    }

    const formData = new FormData();
    formData.append("access_token", token);
    formData.append("imagedata", new Blob([imageBuffer], { type: "image/png" }), "capture.png");
    if (title) formData.append("title", title);

    const res = await fetch("https://upload.gyazo.com/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Gyazo upload failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json() as Record<string, any>;
    const imageUrl = data.image_url || data.url || data.permalink_url;
    console.error(`Uploaded: ${imageUrl}`);
    return imageUrl;
  }
}

// --- read: ページのテキストを読み取る ---
async function readPage() {
  const url = process.argv[3];
  if (!url) {
    console.error("Usage: ./run.sh read <url>");
    process.exit(1);
  }

  const { browser, page } = await launchPage(url);
  console.error(`Reading: ${url}`);

  const text = await page.evaluate(() => {
    const main =
      document.querySelector("article") ||
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.querySelector(".post-content, .entry-content, .article-content, .content") ||
      document.body;
    return main.innerText;
  });

  await browser.close();
  console.log(text);
}

// --- shoot: 指定セクションを翻訳+スクショ ---
// config.json format:
// [
//   { "selector": "h1", "translated": "翻訳されたタイトル" },
//   { "selector": ".intro > p:nth-of-type(1)", "translated": "翻訳された段落" },
//   { "selector": "div.x", "translated": "text", "capture": false }
// ]
async function shootSections() {
  const url = command;
  const configPath = process.argv[3];
  if (!configPath) {
    console.error("Usage: ./run.sh <url> <config.json> [--local <dir>]");
    process.exit(1);
  }

  const sections: { selector: string; translated: string; capture?: boolean }[] = JSON.parse(
    readFileSync(configPath, "utf-8"),
  );

  const { browser, page } = await launchPage(url);
  console.error(`Opening: ${url}`);

  // バナー・オーバーレイを非表示
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      if ((style.position === 'fixed' || style.position === 'sticky') && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
        (el as HTMLElement).style.display = 'none';
      }
    }
  });

  // 翻訳テキストを注入
  await page.evaluate((secs) => {
    for (const sec of secs) {
      try {
        const el = document.querySelector(sec.selector);
        if (el && sec.translated) {
          el.textContent = sec.translated;
        }
      } catch (e) {
        // セレクタが無効な場合はスキップ
      }
    }
  }, sections);

  await page.waitForTimeout(500);

  // 各要素を element.screenshot() でキャプチャ
  const images: string[] = [];

  for (const sec of sections) {
    if (sec.capture === false) continue;
    try {
      const el = await page.$(sec.selector);
      if (!el) {
        console.error(`Selector not found: ${sec.selector}`);
        continue;
      }
      const screenshot = await el.screenshot();
      const imageUrl = await saveImage(Buffer.from(screenshot), url);
      images.push(imageUrl);
    } catch (e) {
      console.error(`Failed to capture ${sec.selector}: ${e}`);
    }
  }

  await browser.close();

  console.log(JSON.stringify({
    source_url: url,
    sections_captured: images.length,
    images,
  }, null, 2));
}

// --- images: ページ内の重要画像を抽出 ---
async function extractImages() {
  const url = process.argv[3];
  if (!url) {
    console.error("Usage: ./run.sh images <url> [--local <dir>]");
    process.exit(1);
  }

  const { browser, page } = await launchPage(url);
  console.error(`Extracting images: ${url}`);

  // 大きい画像のみ抽出（アイコン・広告を除外）
  const imgData = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .map((img) => ({
        src: img.src,
        alt: img.alt || "",
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))
      .filter((img) => img.width >= 200 && img.height >= 100 && img.src);
  });

  const results: { src: string; alt: string; image: string }[] = [];

  for (const img of imgData) {
    try {
      const el = await page.$(`img[src="${img.src}"]`);
      if (!el) continue;
      const screenshot = await el.screenshot();
      const saved = await saveImage(Buffer.from(screenshot), img.alt || url);
      results.push({ src: img.src, alt: img.alt, image: saved });
      console.error(`Image: ${img.alt || img.src.slice(-40)}`);
    } catch (e) {
      // skip
    }
  }

  await browser.close();
  console.log(JSON.stringify({ source_url: url, images: results }, null, 2));
}

// --- ocr: OCR読み取り or 翻訳オーバーレイ ---
// Usage:
//   ./run.sh ocr <image_path>                    # OCR → テキスト+位置をJSON出力
//   ./run.sh ocr <image_path> <translations.json> # 翻訳オーバーレイ → 保存/アップロード
async function ocrImage() {
  const imagePath = process.argv[3];
  const translationsPath = process.argv[4];

  if (!imagePath) {
    console.error("Usage: ./run.sh ocr <image_path> [translations.json] [--local <dir>]");
    process.exit(1);
  }

  // 画像読み込み（URLかローカルパス）
  let imageBuffer: Buffer;
  let tmpFile: string | null = null;
  if (imagePath.startsWith("http")) {
    const res = await fetch(imagePath);
    imageBuffer = Buffer.from(await res.arrayBuffer());
    tmpFile = join(__dirname, `ocr_input_${randomUUID().slice(0, 8)}.png`);
    writeFileSync(tmpFile, imageBuffer);
  } else {
    imageBuffer = readFileSync(imagePath);
    tmpFile = imagePath;
  }

  console.error(`OCR: ${imagePath}`);

  // tesseract CLIでTSV出力（行ごとのバウンディングボックス付き）
  let tsvOut: string;
  try {
    tsvOut = execSync(`tesseract "${tmpFile}" stdout tsv 2>/dev/null`).toString();
  } catch (e: any) {
    // tesseractはexit 1でもstdoutに結果を返す場合がある
    tsvOut = e.stdout?.toString() || "";
  }
  const rows = tsvOut.split("\n");
  const header = rows[0].split("\t");

  // level=4 が行、level=5 が単語
  // 行単位でまとめる
  const wordEntries = rows.slice(1).filter(r => r.trim()).map(r => {
    const c = r.split("\t");
    return {
      level: +c[0], pageNum: +c[1], blockNum: +c[2], parNum: +c[3], lineNum: +c[4], wordNum: +c[5],
      left: +c[6], top: +c[7], width: +c[8], height: +c[9], conf: +c[10], text: c[11] || "",
    };
  });

  // 行レベル（level=4）でグループ化
  const lineKey = (w: typeof wordEntries[0]) => `${w.blockNum}-${w.parNum}-${w.lineNum}`;
  const lineMap = new Map<string, typeof wordEntries>();
  for (const w of wordEntries.filter(w => w.level === 5 && w.text.trim())) {
    const key = lineKey(w);
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key)!.push(w);
  }

  const lines = Array.from(lineMap.values()).map(words => {
    const text = words.map(w => w.text).join(" ");
    const x0 = Math.min(...words.map(w => w.left));
    const y0 = Math.min(...words.map(w => w.top));
    const x1 = Math.max(...words.map(w => w.left + w.width));
    const y1 = Math.max(...words.map(w => w.top + w.height));
    return { text, bbox: { x0, y0, x1, y1 } };
  });

  if (!translationsPath || translationsPath === "--local") {
    // OCR結果を出力
    console.log(JSON.stringify({ lines }, null, 2));
  } else {
    // 翻訳オーバーレイを適用
    const translations: { text: string; translated: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] =
      JSON.parse(readFileSync(translationsPath, "utf-8"));

    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;

    // SVGで翻訳オーバーレイを作成（薄い灰色で塗りつぶし + 翻訳テキスト）
    const rects = translations.map((t) => {
      const w = t.bbox.x1 - t.bbox.x0;
      const h = t.bbox.y1 - t.bbox.y0;
      const fontSize = Math.max(10, Math.min(h * 0.75, 24));
      const escaped = t.translated.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<rect x="${t.bbox.x0}" y="${t.bbox.y0}" width="${w}" height="${h}" fill="rgb(235,235,235)" />
<text x="${t.bbox.x0 + 2}" y="${t.bbox.y1 - h * 0.2}" font-size="${fontSize}" font-family="sans-serif" fill="black">${escaped}</text>`;
    }).join("\n");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${rects}</svg>`;

    const overlaid = await sharp(imageBuffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    const saved = await saveImage(Buffer.from(overlaid), imagePath);
    console.log(JSON.stringify({ image: saved }, null, 2));
  }

  // URLからダウンロードした一時ファイルを削除
  if (imagePath.startsWith("http") && tmpFile) {
    try { const { unlinkSync } = require("fs"); unlinkSync(tmpFile); } catch {}
  }
}

// --- main ---
if (command === "read") {
  readPage().catch((e) => { console.error(e); process.exit(1); });
} else if (command === "images") {
  extractImages().catch((e) => { console.error(e); process.exit(1); });
} else if (command === "ocr") {
  ocrImage().catch((e) => { console.error(e); process.exit(1); });
} else {
  shootSections().catch((e) => { console.error(e); process.exit(1); });
}
