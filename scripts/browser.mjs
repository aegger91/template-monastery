// Shared Puppeteer setup for the fit test and screenshots. Uses a system
// Chrome: set CHROME_PATH, or it tries the usual install locations.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

export async function launch() {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error('No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.');
  return puppeteer.launch({ executablePath, args: ['--no-sandbox', '--font-render-hinting=none'] });
}

// Scroll through the page so lazy images load and reveals settle.
export async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 20));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 1500); }))
    );
    await document.fonts.ready.catch(() => {});
  });
  await new Promise((r) => setTimeout(r, 100));
}

export const BASE = process.env.BASE_URL || 'http://127.0.0.1:4747';
