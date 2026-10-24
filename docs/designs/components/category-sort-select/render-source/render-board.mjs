import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(sourceDir, '..');
const pageUrl = pathToFileURL(resolve(sourceDir, 'board.html')).href;
const browser = await chromium.launch({ headless: true });
const rendererVersion = (await import('@playwright/test/package.json', { with: { type: 'json' } })).default.version;
const browserVersion = browser.version();
const captures = [
  { file: '01-Visual-Design-Board.png', width: 1536, height: 1024, clean: false },
  { file: '02-Clean-Reference.png', width: 560, height: 420, clean: true },
  { file: '03-Clean-Reference-Mobile.png', width: 390, height: 460, clean: true }
];
const results = [];

for (const capture of captures) {
  const page = await browser.newPage({ viewport: { width: capture.width, height: capture.height }, deviceScaleFactor: 1 });
  await page.goto(pageUrl, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (capture.clean) await page.locator('.board').evaluate((element) => element.classList.add('clean'));
  const select = page.locator('#sort-select');
  await select.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const state = await select.evaluate((element) => {
    const picker = getComputedStyle(element, '::picker(select)');
    const selected = element.querySelector('option:checked');
    const selectedStyle = getComputedStyle(selected);
    const bounds = selected.getBoundingClientRect();
    return {
      open: element.matches(':open'),
      value: element.value,
      appearance: getComputedStyle(element).appearance,
      pickerBackground: picker.backgroundColor,
      pickerBorderRadius: picker.borderRadius,
      pickerMinInlineSize: picker.minInlineSize,
      selectedBackground: selectedStyle.backgroundColor,
      selectedColor: selectedStyle.color,
      selectedHeightPx: bounds.height,
      selectedFocused: selected.matches(':focus'),
      selectedFocusOutline: selectedStyle.outlineColor,
      support: CSS.supports('appearance', 'base-select')
    };
  });
  if (!state.open || state.appearance !== 'base-select' || !state.support) throw new Error('Customizable select did not open: ' + JSON.stringify(state));
  await page.screenshot({ path: resolve(packageDir, capture.file), fullPage: false });
  const bytes = await readFile(resolve(packageDir, capture.file));
  const dimensions = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  results.push({ file: capture.file, ...dimensions, sha256, state });
  await page.close();
}
await browser.close();
const metadata = { renderer: { name: 'Playwright Chromium', version: rendererVersion, browserVersion, font: 'Tahoma' }, captures: results };
await writeFile(resolve(sourceDir, 'render-report.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
process.stdout.write(JSON.stringify(metadata, null, 2) + '\n');
