import { readFileSync } from "fs";
import { launchPage, saveImage, parseLocalDir } from "./lib";

const url = process.argv[2];
const configPath = process.argv[3];
if (!url || !configPath) {
  console.error("Usage: kiri-capture.sh <url> <sections.json> [--local <dir>]");
  process.exit(1);
}

const localDir = parseLocalDir();
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
    } catch (e) {}
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
    const imageUrl = await saveImage(Buffer.from(screenshot), url, localDir);
    images.push(imageUrl);
  } catch (e) {
    console.error(`Failed to capture ${sec.selector}: ${e}`);
  }
}

await browser.close();
console.log(JSON.stringify({ source_url: url, sections_captured: images.length, images }, null, 2));
