const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('http://127.0.0.1:8080/?clock=analog&rows=2&photo=sarajevo-city-hall', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const catalogue = await page.evaluate(() => ({
    sarajevo: Wallpaper.list().filter(w => w.collection === 'sarajevo').length,
    total: Wallpaper.list().length,
    quickActions: document.querySelectorAll('#quick-actions .quick-action').length,
    analog: document.getElementById('home').classList.contains('clock-analog'),
    twoRows: document.getElementById('home').classList.contains('dock-two-rows')
  }));
  if (catalogue.sarajevo < 29) throw new Error('Expected at least 29 Sarajevo photos');
  if (catalogue.quickActions !== 5 || !catalogue.analog || !catalogue.twoRows) throw new Error('Home controls did not render');

  await page.locator('body').press('ArrowDown');
  const afterFirstDown = await page.locator('.focused .label').textContent();
  if (afterFirstDown !== 'Netflix') throw new Error('Two-row Down navigation missed Netflix: ' + afterFirstDown);
  await page.locator('body').press('ArrowDown');
  if (await page.evaluate(() => UI.current()) !== 'all') throw new Error('Second Down did not open All apps');

  await page.goto('http://127.0.0.1:8080/?clock=digital-arabic&rows=1&photo=sarajevo-sebilj', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const arabicTime = await page.locator('#time-main').textContent();
  if (!/[٠-٩]/.test(arabicTime)) throw new Error('Arabic clock digits are missing');

  await page.goto('http://127.0.0.1:8080/?clock=digital-latin&rows=1#appearance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const appearance = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('#appearance-body .setting-block'));
    return {
      blocks: blocks.length,
      lastBottom: blocks[blocks.length - 1].getBoundingClientRect().bottom,
      clockChoices: Array.from(blocks[0].querySelectorAll('.chip')).map(x => x.textContent.trim())
    };
  });
  if (appearance.blocks !== 7 || appearance.lastBottom > 940) throw new Error('Appearance page overflows');
  if (errors.length) throw new Error('Page errors: ' + errors.join(' | '));

  console.log(JSON.stringify({ catalogue, afterFirstDown, arabicTime, appearance }, null, 2));
  await browser.close();
})().catch(err => { console.error(err.stack || err); process.exit(1); });
