// app/api/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const html = await page.content();
    const title = await page.title();
    const text = await page.evaluate(() => document.body.innerText);
    const images = await page.$$eval("img", (imgs) => imgs.map((img) => (img as HTMLImageElement).src).filter(Boolean));

    const packaged = {
      url,
      metadata: { title, timestamp: new Date().toISOString() },
      content: { html, text, images },
    };

    return NextResponse.json(packaged, { status: 200 });
  } catch (err: any) {
    console.error("Scraping failed:", err);
    return NextResponse.json(
      { error: "Scraping failed", details: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
