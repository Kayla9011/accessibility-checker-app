import { chromium, Browser } from "playwright";

let browser: Browser | null = null;

export async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  return browser;
}
