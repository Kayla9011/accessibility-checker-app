import fs from "node:fs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { launch as launchChrome } from "chrome-launcher";

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("usage: node audit_worker.mjs <in.json> <out.json>");
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(inPath, "utf-8"));
const { url, html } = payload;

(async () => {
  // ---------- 1) Launch Playwright (axe ground truth) ----------
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let targetUrl = url || "";
  if (html && !url) {
    targetUrl = "data:text/html;base64," + Buffer.from(html, "utf8").toString("base64");
  }

  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  // Run axe ----------
  const axeResults = await new AxeBuilder({ page }).analyze();

  // Run Lighthouse (best-effort) ----------
  let lhJson = {};
  if (url) {
    try {
      const chrome = await launchChrome({ chromeFlags: ["--headless", "--no-sandbox"] });
      const lh = await lighthouse(url, {
        output: "json",
        onlyCategories: ["accessibility"],
        disableStorageReset: true,
        throttlingMethod: "provided",
        port: chrome.port
      });
      lhJson = lh.lhr || {};
      await chrome.kill();
    } catch (err) {
      lhJson = { _error: String(err) };
    }
  }

  const diagnostic = {
    targetUrl: url || "(data-url)",
    auditedUrl: await page.url(),
    title: await page.title(),
    htmlLen: (await page.content()).length
  };

  await browser.close();

  // Write single JSON to outPath (no stdout streaming) ----------
  const out = { lighthouse: lhJson, axe: axeResults, _diagnostic: diagnostic };
  fs.writeFileSync(outPath, JSON.stringify(out));
  process.exit(0);
})().catch(err => {
  const out = { lighthouse: {}, axe: { violations: [] }, _diagnostic: { fatal: String(err) } };
  try { fs.writeFileSync(outPath, JSON.stringify(out)); } catch {}
  process.exit(0);
});
