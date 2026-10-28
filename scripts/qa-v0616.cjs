const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  const logs = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => logs.push(m.text()));
  await page.goto('http://127.0.0.1:8080/?rows=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);

  await page.evaluate(() => UI.focusOn(document.getElementById('wifi')));
  await page.locator('body').press('Enter');
  await page.waitForTimeout(150);
  const wifi = await page.evaluate(() => ({
    view: UI.current(),
    title: document.getElementById('menu-title').textContent,
    entries: Array.from(document.querySelectorAll('#menu-list li')).map(x => x.textContent)
  }));
  if (wifi.view !== 'menu' || wifi.title !== 'Wi‑Fi' || !wifi.entries[0].includes('Home Wi‑Fi')) throw new Error('Wi‑Fi menu failed');
  if (!wifi.entries[1].includes('auto-return in 2 min')) throw new Error('Wi‑Fi return guard is missing');
  await page.locator('body').press('ArrowDown');
  await page.locator('body').press('Enter');
  await page.waitForTimeout(150);
  if (await page.evaluate(() => tizen.alarm._all.length) !== 1) throw new Error('Settings return alarm was not scheduled');

  await page.evaluate(() => UI.show('home'));
  await page.evaluate(() => UI.focusOn(document.getElementById('bluetooth')));
  await page.locator('body').press('Enter');
  await page.waitForTimeout(100);
  const bluetooth = await page.evaluate(() => ({
    title: document.getElementById('menu-title').textContent,
    entries: Array.from(document.querySelectorAll('#menu-list li')).map(x => x.textContent)
  }));
  if (bluetooth.title !== 'Bluetooth' || bluetooth.entries.length !== 4) throw new Error('Bluetooth menu failed');

  await page.locator('body').press('Escape');
  await page.evaluate(() => UI.focusOn(document.querySelector('#apps-row .app')));
  await page.locator('body').press('Enter');
  await page.waitForTimeout(1500);
  if (!logs.some(x => x.includes('launchAppControl') && x.includes('GROUP'))) throw new Error('App did not use GROUP launch mode');
  if (errors.length) throw new Error('Page errors: ' + errors.join(' | '));

  console.log(JSON.stringify({ wifi, bluetooth, groupedLaunch: logs.filter(x => x.includes('launchAppControl')) }, null, 2));
  await browser.close();
})().catch(err => { console.error(err.stack || err); process.exit(1); });
