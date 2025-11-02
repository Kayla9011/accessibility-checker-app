// lib/runAxe.ts
"use server";

import { getBrowser } from "@/lib/browser";
import path from "node:path";
import { constants as FS } from "node:fs";
import { readFile, access } from "node:fs/promises";

async function resolveAxePath(): Promise<string> {
  // 1) 基于项目根目录的真实路径（最不容易被 RSC 干扰）
  const p1 = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
  try {
    await access(p1, FS.R_OK);
    return p1;
  } catch {
    // ignore
  }

  // 2) 回退到 createRequire(import.meta.url)（只在 Node 端 & 函数内调用）
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const p2 = require.resolve("axe-core/axe.min.js");
    await access(p2, FS.R_OK);
    return p2;
  } catch {
    // ignore
  }

  throw new Error(
    "Cannot locate axe-core/axe.min.js"
  );
}

export async function runAxe(url: string) {
  const browser = await getBrowser();

  // Playwright：用 context 才能 bypass CSP
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();

  try {
    // Playwright 没有 "networkidle0"，用 "networkidle"
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });

    // 以内联方式注入 axe 源码，避免 CSP 对外链 script 的限制
    const axePath = await resolveAxePath();
    const axeSource = await readFile(axePath, "utf8");
    await page.addScriptTag({ content: axeSource });

    const result = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run(document, {
        resultTypes: ["violations"],
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      });
    });

    return (result?.violations ?? []) as any[];
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}
