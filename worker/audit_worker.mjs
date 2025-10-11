import fs from "node:fs";
import lighthouse from "lighthouse";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("usage: node audit_worker.mjs <payload.json>");
  process.exit(2);
}
const payload = JSON.parse(fs.readFileSync(args[0], "utf-8"));
const { url, html } = payload;

(async () => {
  // Playwright context
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (html && !url) {
    // data URL fallback if only raw HTML
    const dataUrl = "data:text/html;base64," + Buffer.from(html, "utf8").toString("base64");
    await page.goto(dataUrl, { waitUntil: "load" });
  } else {
    await page.goto(url, { waitUntil: "load" });
  }

  // axe-core
  const axe = new AxeBuilder({ page });
  const axeResults = await axe.analyze();

  // lighthouse (only if url present)
  let lhJson = {};
  if (url) {
    const lh = await lighthouse(url, {
      output: "json",
      onlyCategories: ["accessibility"],
      disableStorageReset: true,
      throttlingMethod: "provided"
    });
    lhJson = lh.lhr;
  }

  await browser.close();

  const out = { lighthouse: lhJson, axe: axeResults };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
