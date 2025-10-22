import puppeteer from "puppeteer";

export async function POST(req) {
  const { url } = await req.json();

  if (!url) {
    return new Response(
      JSON.stringify({ error: "Missing URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let browser;
  try {
    // 🧭 Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // 🧩 Extract page content
    const html = await page.content();
    const title = await page.title();

    // Extract all text (visible only)
    const text = await page.evaluate(() => document.body.innerText);

    // Extract all image URLs
    const images = await page.$$eval("img", imgs =>
      imgs.map(img => img.src).filter(Boolean)
    );

    // 🧱 Package scraped data
    const packaged = {
      url,
      metadata: {
        title,
        timestamp: new Date().toISOString(),
      },
      content: {
        html,
        text,
        images,
      },
    };

    // Example: Send packaged data to another API or AI model
    // await fetch("https://your-ai-endpoint.com/analyze", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(packaged),
    // });

    return new Response(JSON.stringify(packaged), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Scraping failed:", err);
    return new Response(
      JSON.stringify({ error: "Scraping failed", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (browser) await browser.close();
  }
}
