import { expect, type Page } from '@playwright/test';

export async function captureUiAudit(page: Page, name: string): Promise<void> {
  const originalViewport = page.viewportSize();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('main')).toBeVisible();
    const geometry = await page.evaluate(() => {
      const offenders = Array.from(document.body.querySelectorAll('*'))
        .map((element) => ({
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${
            typeof element.className === 'string' && element.className.trim()
              ? `.${element.className.trim().replace(/\s+/g, '.')}`
              : ''
          }`,
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
        }))
        .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
        .slice(0, 8);
      const edgeElements = Array.from(document.body.querySelectorAll('*'))
        .map((element) => ({
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${
            typeof element.className === 'string' && element.className.trim()
              ? `.${element.className.trim().replace(/\s+/g, '.')}`
              : ''
          }`,
          right: Math.round(element.getBoundingClientRect().right),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }))
        .filter((item) => item.right > window.innerWidth - 16 || item.scrollWidth > item.clientWidth + 2)
        .slice(0, 30);
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        offenders,
        edgeElements,
      };
    });
    expect(geometry.documentWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(
      geometry.viewportWidth + 1,
    );
    for (const radio of await page.getByRole('radio').all()) {
      if (!(await radio.isVisible())) continue;
      const bounds = await radio.boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(24);
      expect(bounds?.height).toBeLessThanOrEqual(24);
    }
    const screenshotPath = name.startsWith('account/')
      ? `test-results/ui-audit/account/${width}/${name.slice('account/'.length)}.png`
      : `test-results/ui-audit/${name}-${width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }
  if (originalViewport) await page.setViewportSize(originalViewport);
}
