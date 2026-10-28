const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { mkdirSync } = require('node:fs');
const { resolve } = require('node:path');

(async () => {
  const inbox = 'http://127.0.0.1:8096';
  const pin = process.env.DASHBOARD_QA_PIN;
  if (!pin) throw new Error('Set DASHBOARD_QA_PIN to the local test photo-server PIN');
  const sample = readFileSync('src/img/wallpapers/thumbs/sarajevo-web-01.jpg');
  const upload = await fetch(`${inbox}/api/upload?pin=${pin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg', 'X-Filename': 'qa-permanent-photo.jpg' },
    body: sample
  });
  if (!upload.ok) throw new Error(`Photo upload failed: ${upload.status}`);
  const remote = await upload.json();

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.route('https://api.aladhan.com/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      code: 200,
      data: {
        timings: { Fajr: '00:01', Dhuhr: '00:02', Asr: '00:03', Maghrib: '00:04', Isha: '23:59' },
        meta: { timezone: 'Asia/Dubai' }
      }
    })
  }));
  await page.route('**/js/config.local.js', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `window.LAUNCHER_LOCAL=${JSON.stringify({
      photoUpload: { server: inbox, pin },
      prayer: { enabled: true, latitude: 25.2048, longitude: 55.2708, method: 8, school: 0, tune: '' }
    })};`
  }));
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => !document.querySelector('#prayer-card').classList.contains('hidden') && /\d{2}:\d{2}:\d{2}/.test(document.querySelector('#prayer-countdown').textContent));

    const prayer = await page.evaluate(() => ({
      name: document.querySelector('#prayer-name').textContent,
      countdown: document.querySelector('#prayer-countdown').textContent,
      status: document.querySelector('#prayer-status').textContent
    }));
    if (!prayer.status.includes('AlAdhan API')) throw new Error('Prayer API attribution/status missing');

    const languageCount = await page.evaluate(() => Appearance.LOCALES.length);
    if (languageCount !== 7) throw new Error(`Expected 7 languages, got ${languageCount}`);

    const arabic = await page.evaluate(() => {
      Prefs.get().appearance.locale = 'ar-AE';
      Prefs.save();
      Appearance.apply();
      UI.show('home');
      return {
        dir: document.documentElement.dir,
        settings: document.querySelector('#settings h1').textContent,
        dock: document.querySelector('#apps-section h2').textContent
      };
    });
    if (arabic.dir !== 'rtl' || arabic.settings !== 'الإعدادات') throw new Error('Arabic UI/RTL failed');
    const output = resolve('../../outputs/tizen-dashboard');
    mkdirSync(output, { recursive: true });
    await page.screenshot({ path: resolve(output, 'qa-v0618-arabic-home.png'), fullPage: true });

    const german = await page.evaluate(() => {
      Prefs.get().appearance.locale = 'de-DE';
      Prefs.save();
      Appearance.apply();
      return document.querySelector('#settings h1').textContent;
    });
    if (german !== 'Einstellungen') throw new Error('German UI failed');

    const synced = await page.evaluate(() => CustomPhotos.sync());
    if (synced.total < 1 || synced.offline) throw new Error(`Permanent photo sync failed: ${JSON.stringify(synced)}`);
    const first = await page.evaluate(() => Wallpaper.list().find(w => w.key.startsWith('uploaded-')));
    if (!first || !first.file.startsWith('blob:')) throw new Error('Synced photo was not exposed as a TV-local blob');
    await page.evaluate(() => {
      Prefs.get().appearance.locale = 'en-GB';
      Prefs.get().wallpaper.mode = 'photo';
      const custom = CustomPhotos.list()[0];
      Prefs.get().wallpaper.photo = custom.key;
      Prefs.save();
      Appearance.apply();
      Wallpaper.apply();
      UI.show('bg');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(output, 'qa-v0618-permanent-photo.png'), fullPage: true });

    await page.unroute('https://api.aladhan.com/**');
    await page.route('https://api.aladhan.com/**', route => route.abort());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => CustomPhotos.count() >= 1 && /\d{2}:\d{2}:\d{2}/.test(document.querySelector('#prayer-countdown').textContent));
    const persisted = await page.evaluate(() => ({ count: CustomPhotos.count(), title: CustomPhotos.list()[0].title }));
    if (persisted.count < 1) throw new Error('IndexedDB photo did not survive reload');
    const cachedPrayer = await page.evaluate(() => document.querySelector('#prayer-countdown').textContent);
    if (!/^\d{2}:\d{2}:\d{2}$/.test(cachedPrayer)) throw new Error('Cached prayer countdown did not survive API outage');

    await page.evaluate(() => CustomPhotos.clear());
    if (errors.length) throw new Error('Page errors: ' + errors.join(' | '));
    console.log(JSON.stringify({ languageCount, prayer, cachedPrayer, arabic, german, synced, persisted }, null, 2));
  } finally {
    await browser.close();
    await fetch(`${inbox}/api/photos/${encodeURIComponent(remote.id)}?pin=${pin}`, { method: 'DELETE' });
  }
})().catch(err => { console.error(err.stack || err); process.exit(1); });

