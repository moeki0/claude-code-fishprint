import { launchPage } from "./lib";

const url = process.argv[2];
if (!url) {
  console.error("Usage: kiri-read.sh <url>");
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
