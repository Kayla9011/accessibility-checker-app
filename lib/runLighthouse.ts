import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

export async function runLighthouse(url: string): Promise<number | null> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new"],
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ["accessibility"],
      logLevel: "silent",
    } as any);

    const score = result?.lhr?.categories?.accessibility?.score;
    return typeof score === "number" ? Math.round(score * 100) : null;
  } finally {
    await chrome.kill();
  }
}
