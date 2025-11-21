// tools/screenshot.js
// Puppeteer script to capture two screenshots:
// 1) the gallery scene (full viewport)
// 2) after clicking the center of the canvas to open the modal (if modal opens)
//
// Usage:
// 1) Serve your project (from the repo root):
//    python -m http.server 8080
//    (or npx http-server -p 8080)
// 2) Install puppeteer:
//    npm init -y
//    npm install puppeteer
// 3) Run:
//    node tools/screenshot.js http://localhost:8080
//
// Output: screenshots/scene.png and screenshots/modal.png

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:8080';
  const outDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for canvas to be appended by the Three.js script
    await page.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 10000 });

    // small delay to let textures load and animations settle
    await page.waitForTimeout(1000);

    // Full viewport screenshot (scene)
    const scenePath = path.join(outDir, 'scene.png');
    await page.screenshot({ path: scenePath, fullPage: false });
    console.log('Saved scene screenshot to', scenePath);

    // Attempt to click the center of canvas to trigger the frame click (open modal)
    // Find the canvas bounding box and click center
    const canvasBox = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });

    if (canvasBox) {
      const centerX = Math.floor(canvasBox.x + canvasBox.width / 2);
      const centerY = Math.floor(canvasBox.y + canvasBox.height / 2);
      await page.mouse.click(centerX, centerY, { delay: 100 });
      // wait for modal to appear
      await page.waitForTimeout(1200);
      // If modal is present, screenshot
      const modalVisible = await page.evaluate(() => {
        const m = document.getElementById('video-modal');
        return m && m.getAttribute('aria-hidden') === 'false';
      });
      if (modalVisible) {
        const modalPath = path.join(outDir, 'modal.png');
        await page.screenshot({ path: modalPath, fullPage: false });
        console.log('Saved modal screenshot to', modalPath);
      } else {
        console.log('Modal did not appear after clicking center; inspect page manually.');
      }
    } else {
      console.log('Canvas not found for clicking; only scene screenshot saved.');
    }
  } catch (err) {
    console.error('Error during screenshot run:', err);
  } finally {
    await browser.close();
  }
})();
