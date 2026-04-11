import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { execSync } from "child_process";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function getKeychainToken(service: string, account: string): string | null {
  try {
    if (process.platform === "darwin") {
      return execSync(`security find-generic-password -a "${account}" -s "${service}" -w 2>/dev/null`).toString().trim();
    } else if (process.platform === "linux") {
      return execSync(`secret-tool lookup service "${service}" key "${account}" 2>/dev/null`).toString().trim();
    }
  } catch {
    return null;
  }
  return null;
}

export async function launchPage(pageUrl: string, width = 1280) {
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

export function parseLocalDir(): string | null {
  const idx = process.argv.indexOf("--local");
  return (idx !== -1 && process.argv[idx + 1]) ? process.argv[idx + 1] : null;
}

export async function saveImage(imageBuffer: Buffer, title?: string, localDir?: string | null): Promise<string> {
  if (localDir) {
    if (!existsSync(localDir)) mkdirSync(localDir, { recursive: true });
    const filename = `${randomUUID().slice(0, 8)}.png`;
    const filepath = join(localDir, filename);
    writeFileSync(filepath, imageBuffer);
    console.error(`Saved: ${filepath}`);
    return filepath;
  } else {
    const token = getKeychainToken("kiri", "gyazo");
    if (!token) {
      console.error("Gyazo token not found in keychain. Set it with:");
      console.error("  macOS: security add-generic-password -a gyazo -s kiri -w YOUR_TOKEN -U");
      console.error("  Linux: secret-tool store --label=kiri service kiri key gyazo");
      console.error("Or use --local <dir> for local storage.");
      process.exit(1);
    }

    const formData = new FormData();
    formData.append("access_token", token);
    formData.append("imagedata", new Blob([imageBuffer], { type: "image/png" }), "capture.png");
    if (title) formData.append("title", title);

    const res = await fetch("https://upload.gyazo.com/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Gyazo upload failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as Record<string, any>;
    const imageUrl = data.image_url || data.url || data.permalink_url;
    console.error(`Uploaded: ${imageUrl}`);
    return imageUrl;
  }
}
