// lib/runAxe.ts
import { getBrowser } from "@/lib/browser";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { constants as FS } from "node:fs";
import { createRequire } from "node:module";

async function resolveAxePath(): Promise<string> {
  // 1) 优先用真正的 Node 解析（不要用 RSC 虚拟 require）
  try {
    const require = createRequire(process.cwd() + "/");
    const p = require.resolve("axe-core/axe.min.js");
    // 确认文件存在
    await access(p, FS.R_OK);
    return p;
  } catch {}

  // 2) 退回到基于项目根目录的绝对路径
  try {
    const p = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");
    await access(p, FS.R_OK);
    return p;
  } catch {}

  // 3) 明确提示：没装或路径异常
  throw new Error(
    "Cannot locate axe-core/axe.min.js. Make sure `npm i axe-core` is installed and Next API route runs on Node.js runtime."
  );
}

export async function runAxe(url: string) {
  const browser = await getBrowser();
  // Playwright 需要用 context 来 bypassCSP
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();

  try {
    // Playwright 支持的等待方式
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });

    // 解析并读取 axe 源码（以内联注入，避免 CSP 限制外链）
    const axePath = await resolveAxePath();
    const axeSource = await readFile(axePath, "utf8");
    await page.addScriptTag({ content: axeSource });

    // 只跑 violations，限定 A/AA
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
