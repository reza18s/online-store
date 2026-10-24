/* global console, document, getComputedStyle, process, URL, window */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('@playwright/test');

const root = process.cwd();
const boardDir = path.join(root, 'docs', 'designs', 'components', 'admin-navigation-sidebar');
const renderDir = path.join(boardDir, 'renders');
const model = JSON.parse(fs.readFileSync(path.join(boardDir, 'design-spec.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(boardDir, 'design-spec.schema.json'), 'utf8'));
const bunModules = path.join(root, 'node_modules', '.bun');
const ajvFolder = fs.readdirSync(bunModules).find((name) => name.startsWith('ajv@') && fs.existsSync(path.join(bunModules, name, 'node_modules', 'ajv', 'dist', '2020.js')));
if (!ajvFolder) throw new Error('Ajv 2020 is not available in the installed Bun dependency graph.');
const Ajv2020 = require(path.join(bunModules, ajvFolder, 'node_modules', 'ajv', 'dist', '2020.js')).default;
const validate = new Ajv2020({ allErrors: true }).compile(schema);
if (!validate(model)) throw new Error('Design spec schema validation failed: ' + JSON.stringify(validate.errors));

const ids = new Set(model.nodes.map((node) => node.id));
if (ids.size !== model.nodes.length) throw new Error('Scene graph node IDs must be unique.');
const frameIds = new Set(model.frames.map((frame) => frame.id));
for (const node of model.nodes) {
  if (node.parentId && !ids.has(node.parentId)) throw new Error('Unknown scene parent: ' + node.parentId);
  for (const child of node.children) if (!ids.has(child)) throw new Error('Unknown scene child: ' + child);
  for (const frameId of node.frameIds) if (!frameIds.has(frameId)) throw new Error('Unknown frame: ' + frameId);
}
for (const frame of model.frames) {
  const frameNodeIds = new Set(frame.nodes.map((node) => node.nodeId));
  if (frameNodeIds.size !== frame.nodes.length) throw new Error('Duplicate frame node in ' + frame.id);
}

fs.mkdirSync(renderDir, { recursive: true });
const results = {
  schema: 'PASS',
  sceneGraph: 'PASS',
  runtime: {},
  limitations: ['The live shell uses its neutral unavailable-route page to avoid unrelated dashboard data dependencies.'],
};

function save(name, page, fullPage = true) {
  return page.screenshot({ path: path.join(renderDir, name), fullPage });
}
async function signIn(page, roles) {
  await page.route('**/v1/staff/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 'staff-preview', email: 'preview@nova.local', status: 'ACTIVE', roles } }),
  }));
  await page.goto('http://127.0.0.1:5174/admin/unknown', { waitUntil: 'networkidle' });
  await page.locator('.admin-reference-shell').waitFor({ state: 'visible', timeout: 15000 });
}
async function measure(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: Math.round(rect.x * 10) / 10,
      y: Math.round(rect.y * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      display: style.display,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const boardPage = await browser.newPage({ viewport: { width: 1536, height: 1160 } });
    await boardPage.goto(pathToFileURL(path.join(boardDir, 'board.html')).href);
    await save('01-Visual-Design-Board.png', boardPage, true);
    await boardPage.close();

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await signIn(page, ['admin']);

    results.runtime.desktop1440 = {
      rail: await measure(page, '.admin-reference-sidebar'),
      content: await measure(page, '.admin-reference-content'),
      homeHref: await page.locator('.admin-reference-sidebar .brand-lockup').getAttribute('href'),
    };
    await save('02-Clean-Reference.png', page, false);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(80);
    results.runtime.tablet1024 = {
      rail: await measure(page, '.admin-reference-sidebar'),
      content: await measure(page, '.admin-reference-content'),
    };
    await save('runtime-tablet-1024.png', page, false);
    await page.setViewportSize({ width: 768, height: 900 });
    await page.waitForTimeout(80);
    results.runtime.tablet768 = {
      rail: await measure(page, '.admin-reference-sidebar'),
      content: await measure(page, '.admin-reference-content'),
    };
    await save('runtime-tablet-768.png', page, false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(80);
    results.runtime.phone390Closed = {
      header: await measure(page, '.admin-reference-topbar'),
      menuButton: await measure(page, '.admin-reference-mobile-menu-button'),
      bottomNavigation: await measure(page, '.admin-reference-bottom-nav'),
      horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      dashboardLinksInHeader: await page.locator('.admin-reference-mobile-head a[href="/admin"]').count(),
    };
    await save('runtime-phone-390-closed.png', page, false);
    await page.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await page.locator('#admin-mobile-navigation[open]').waitFor();
    await page.waitForTimeout(450);
    results.runtime.phone390Open = {
      overlay: await measure(page, '#admin-mobile-navigation'),
      panel: await measure(page, '.admin-reference-mobile-dialog__panel'),
      drawerHeader: await measure(page, '.admin-reference-mobile-dialog__header'),
      roleNavigationLinks: await page.locator('.admin-reference-mobile-dialog__nav a').count(),
      bodyScrollLocked: await page.evaluate(() => document.body.style.overflow === 'hidden'),
      isModal: await page.locator('#admin-mobile-navigation').evaluate((dialog) => dialog.matches(':modal')),
    };
    await save('03-Clean-Reference-Mobile.png', page, false);
    await save('runtime-phone-390-open.png', page, false);
    await page.keyboard.press('Shift+Tab');
    const shiftTabRemainedInDialog = await page.locator('#admin-mobile-navigation').evaluate((dialog) => dialog.contains(document.activeElement));
    await page.keyboard.press('Tab');
    const tabRemainedInDialog = await page.locator('#admin-mobile-navigation').evaluate((dialog) => dialog.contains(document.activeElement));
    results.runtime.focusContainment = { shiftTabRemainedInDialog, tabRemainedInDialog };
    await page.getByRole('button', { name: 'بستن ناوبری' }).focus();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#admin-mobile-navigation').open, null, { timeout: 1500 });
    results.runtime.escapeClose = {
      focusReturned: await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'باز کردن ناوبری مدیریت'),
      bodyScrollRestored: await page.evaluate(() => document.body.style.overflow !== 'hidden'),
    };
    await page.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await page.locator('#admin-mobile-navigation[open]').waitFor();
    await page.getByRole('button', { name: 'بستن ناوبری' }).click();
    await page.waitForFunction(() => !document.querySelector('#admin-mobile-navigation').open, null, { timeout: 1500 });
    results.runtime.closeButton = {
      dialogClosed: await page.locator('#admin-mobile-navigation').evaluate((dialog) => !dialog.open),
      bodyScrollRestored: await page.evaluate(() => document.body.style.overflow !== 'hidden'),
    };
    await page.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await page.locator('#admin-mobile-navigation[open]').waitFor();
    await page.waitForTimeout(450);
    await page.locator('.admin-reference-mobile-dialog__scrim').click({ position: { x: 6, y: 400 } });
    await page.waitForFunction(() => !document.querySelector('#admin-mobile-navigation').open, null, { timeout: 1500 });
    results.runtime.backdropClose = {
      dialogClosed: await page.locator('#admin-mobile-navigation').evaluate((dialog) => !dialog.open),
      bodyScrollRestored: await page.evaluate(() => document.body.style.overflow !== 'hidden'),
    };

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(80);
    results.runtime.phone320Closed = {
      header: await measure(page, '.admin-reference-topbar'),
      horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    };
    await save('runtime-phone-320-closed.png', page, false);
    await page.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await page.locator('#admin-mobile-navigation[open]').waitFor();
    await page.waitForTimeout(450);
    const phone320Panel = page.locator('.admin-reference-mobile-dialog__panel');
    const phone320PanelSizes = await phone320Panel.evaluate((panel) => ({
      clientHeight: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
    }));
    results.runtime.phone320Open = {
      overlay: await measure(page, '#admin-mobile-navigation'),
      panel: await measure(page, '.admin-reference-mobile-dialog__panel'),
      horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      roleNavigationLinks: await page.locator('.admin-reference-mobile-dialog__nav a').count(),
      drawerScrollable: phone320PanelSizes.scrollHeight > phone320PanelSizes.clientHeight,
    };
    await save('runtime-phone-320-open.png', page, false);
    await phone320Panel.evaluate((panel) => { panel.scrollTop = panel.scrollHeight; });
    results.runtime.phone320Open.lastDestinationVisibleAfterScroll = await page.locator('.admin-reference-mobile-dialog__nav a[href="/admin/inventory"]').evaluate((link) => {
      const panel = link.closest('.admin-reference-mobile-dialog__panel');
      const linkRect = link.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      return linkRect.top >= panelRect.top && linkRect.bottom <= panelRect.bottom;
    });
    await page.setViewportSize({ width: 768, height: 900 });
    await page.waitForFunction(() => !document.querySelector('#admin-mobile-navigation').open, null, { timeout: 500 });
    results.runtime.phoneToTabletResize = {
      dialogClosed: await page.locator('#admin-mobile-navigation').evaluate((dialog) => !dialog.open),
      bodyScrollRestored: await page.evaluate(() => document.body.style.overflow !== 'hidden'),
    };
    results.runtime.pageErrors = errors;
    await context.close();

    const supportContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const supportPage = await supportContext.newPage();
    await signIn(supportPage, ['support']);
    await supportPage.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await supportPage.locator('#admin-mobile-navigation[open]').waitFor();
    await supportPage.waitForTimeout(450);
    results.runtime.supportDrawer = {
      links: await supportPage.locator('.admin-reference-mobile-dialog__nav a').allTextContents(),
      restrictedDashboardShortcutCount: await supportPage.locator('.admin-reference-mobile-head a[href="/admin"], .admin-reference-mobile-dialog__nav a[href="/admin"]').count(),
      logoHref: await supportPage.locator('.admin-reference-mobile-head .brand-lockup').getAttribute('href'),
    };
    await save('runtime-phone-support-open.png', supportPage, false);
    await supportPage.evaluate(() => {
      const observations = [];
      const originalPushState = window.history.pushState;
      window.__sidebarNavigationPushStates = observations;
      window.history.pushState = function (...args) {
        observations.push({
          path: new URL(args[2], window.location.href).pathname,
          dialogOpen: document.querySelector('#admin-mobile-navigation').open,
        });
        return originalPushState.apply(window.history, args);
      };
    });
    await supportPage.locator('.admin-reference-mobile-dialog__nav').getByRole('link', { name: 'سفارش‌ها' }).click();
    await supportPage.waitForFunction(() =>
      window.location.pathname === '/admin/orders' &&
      !document.querySelector('#admin-mobile-navigation').open &&
      document.body.style.overflow !== 'hidden',
      null,
      { timeout: 2000 },
    );
    results.runtime.supportRouteSelection = {
      path: await supportPage.evaluate(() => window.location.pathname),
      bodyScrollRestored: await supportPage.evaluate(() => document.body.style.overflow !== 'hidden'),
      dialogOpen: await supportPage.locator('#admin-mobile-navigation').evaluate((dialog) => dialog.open),
      activeBottomNavRoute: await supportPage.locator('.admin-reference-bottom-nav a[href="/admin/orders"]').getAttribute('aria-current'),
      navigationPushStates: await supportPage.evaluate(() => window.__sidebarNavigationPushStates),
    };
    await supportContext.close();

    const operationsContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const operationsPage = await operationsContext.newPage();
    await signIn(operationsPage, ['operations']);
    await operationsPage.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await operationsPage.locator('#admin-mobile-navigation[open]').waitFor();
    await operationsPage.waitForTimeout(450);
    results.runtime.operationsDrawer = {
      links: await operationsPage.locator('.admin-reference-mobile-dialog__nav a').allTextContents(),
      adminOnlyDestinationCount: await operationsPage.locator('.admin-reference-mobile-dialog__nav a[href="/admin"], .admin-reference-mobile-dialog__nav a[href="/admin/payments"], .admin-reference-mobile-dialog__nav a[href="/admin/content"], .admin-reference-mobile-dialog__nav a[href="/admin/audit"]').count(),
      logoHref: await operationsPage.locator('.admin-reference-mobile-head .brand-lockup').getAttribute('href'),
    };
    await save('runtime-phone-operations-open.png', operationsPage, false);
    await operationsContext.close();

    const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    await signIn(reducedPage, ['admin']);
    await reducedPage.getByRole('button', { name: 'باز کردن ناوبری مدیریت' }).click();
    await reducedPage.locator('#admin-mobile-navigation[open]').waitFor();
    results.runtime.reducedMotion = {
      dialogOpenedImmediately: await reducedPage.locator('#admin-mobile-navigation').evaluate((dialog) => dialog.open),
      panelWidth: await measure(reducedPage, '.admin-reference-mobile-dialog__panel'),
    };
    await reducedPage.keyboard.press('Escape');
    results.runtime.reducedMotion.closeWasImmediate = await reducedPage.waitForFunction(() => !document.querySelector('#admin-mobile-navigation').open, null, { timeout: 500 }).then(() => true);
    await reducedContext.close();

    function updateFrame(frameId, nodeId, measured) {
      const frame = model.frames.find((entry) => entry.id === frameId);
      const node = frame?.nodes.find((entry) => entry.nodeId === nodeId);
      if (!frame || !node || !measured) throw new Error('Missing measured frame node: ' + frameId + '/' + nodeId);
      node.rect = { x: measured.x, y: measured.y, width: measured.width, height: measured.height };
      node.evidenceStatus = 'MEASURED';
      frame.evidenceStatus = 'VERIFIED';
    }
    updateFrame('desktop-expanded', 'desktop-sidebar', results.runtime.desktop1440.rail);
    updateFrame('desktop-expanded', 'desktop-content', results.runtime.desktop1440.content);
    updateFrame('tablet-compact', 'tablet-sidebar', results.runtime.tablet1024.rail);
    updateFrame('tablet-compact', 'tablet-content', results.runtime.tablet1024.content);
    updateFrame('phone-closed', 'phone-header', results.runtime.phone390Closed.header);
    updateFrame('phone-closed', 'phone-menu-trigger', results.runtime.phone390Closed.menuButton);
    updateFrame('phone-closed', 'phone-bottom-navigation', results.runtime.phone390Closed.bottomNavigation);
    updateFrame('phone-open', 'phone-overlay', results.runtime.phone390Open.overlay);
    updateFrame('phone-open', 'phone-drawer', results.runtime.phone390Open.panel);
    updateFrame('phone-open', 'phone-drawer-header', results.runtime.phone390Open.drawerHeader);
    updateFrame('phone-open-320', 'phone-overlay', results.runtime.phone320Open.overlay);
    updateFrame('phone-open-320', 'phone-drawer', results.runtime.phone320Open.panel);

    model.motion.reactIntegration = 'GSAP is loaded on menu interaction; useEffect cleanup releases the modal and scroll lock.';
    model.motion.durationsStatus = 'SOURCE_DEFINED';
    model.motion.backdropTargetOpacity = 0.48;
    delete model.motion.panelEnterOffsetXPx;
    delete model.motion.panelExitOffsetXPx;
    model.motion.panelEnterOffsetXPercent = 100;
    model.motion.panelExitOffsetXPercent = 100;
    model.limitations = results.limitations;
    const pushStates = results.runtime.supportRouteSelection.navigationPushStates;
    const checks = [
      { id: 'source-coverage', status: 'PASS', method: 'Manual source-to-model review.', evidence: 'Role rules, RTL shell, breakpoints, icons, route helper, and admin reference tokens were traced to their source owners.' },
      { id: 'schema-validation', status: 'PASS', method: 'Ajv Draft 2020-12 validation.', evidence: 'Canonical design spec validated before rendering.' },
      { id: 'scene-graph-integrity', status: 'PASS', method: 'ID and reference validation.', evidence: 'Scene IDs are unique and parent, child, frame references resolve.' },
      { id: 'responsive-rendering', status: results.runtime.pageErrors.length === 0 && !results.runtime.phone390Closed.horizontalOverflow && !results.runtime.phone320Closed.horizontalOverflow && !results.runtime.phone320Open.horizontalOverflow ? 'PASS' : 'FAIL', method: 'Playwright local runtime capture and visual review.', evidence: '1440, 1024, 768, 390 and 320px layouts; no page errors or horizontal overflow.' },
      { id: 'drawer-interactions', status: results.runtime.escapeClose.bodyScrollRestored && results.runtime.escapeClose.focusReturned && results.runtime.closeButton.dialogClosed && results.runtime.closeButton.bodyScrollRestored && results.runtime.backdropClose.dialogClosed && results.runtime.backdropClose.bodyScrollRestored && results.runtime.phoneToTabletResize.dialogClosed && results.runtime.phoneToTabletResize.bodyScrollRestored ? 'PASS' : 'FAIL', method: 'Live browser interactions.', evidence: 'Escape, close button, backdrop, and resize to tablet all dismiss the modal, restore body scroll, and return focus where applicable.' },
      { id: 'narrow-drawer-scroll', status: results.runtime.phone320Open.drawerScrollable && results.runtime.phone320Open.lastDestinationVisibleAfterScroll ? 'PASS' : 'FAIL', method: 'Live browser scroll measurement.', evidence: 'At 320px, the drawer scrolls vertically and its final permitted destination can be brought fully into view.' },
      { id: 'role-filtering', status: results.runtime.supportDrawer.links.length === 4 && results.runtime.supportDrawer.restrictedDashboardShortcutCount === 0 && results.runtime.supportDrawer.logoHref === '/admin/catalog' && results.runtime.operationsDrawer.adminOnlyDestinationCount === 0 && results.runtime.operationsDrawer.links.length === 6 && results.runtime.operationsDrawer.logoHref === '/admin/catalog' ? 'PASS' : 'FAIL', method: 'Live browser role previews.', evidence: 'Support sees four allowed sections; operations sees six allowed sections; neither role receives admin-only links and both logos return to catalog.' },
      { id: 'route-selection', status: results.runtime.supportRouteSelection.path === '/admin/orders' && results.runtime.supportRouteSelection.activeBottomNavRoute === 'page' && results.runtime.supportRouteSelection.bodyScrollRestored && !results.runtime.supportRouteSelection.dialogOpen && pushStates.length === 1 && pushStates[0].path === '/admin/orders' && !pushStates[0].dialogOpen ? 'PASS' : 'FAIL', method: 'Live browser navigation.', evidence: 'Selecting an allowed drawer destination completes one existing route-helper navigation after the drawer closes, restores scroll, and marks the new route active.' },
      { id: 'reduced-motion', status: results.runtime.reducedMotion.dialogOpenedImmediately && results.runtime.reducedMotion.closeWasImmediate ? 'PASS' : 'FAIL', method: 'Playwright reduced-motion emulation.', evidence: 'Modal opens and closes immediately with reduced motion enabled.' },
      { id: 'keyboard-focus', status: results.runtime.focusContainment.shiftTabRemainedInDialog && results.runtime.focusContainment.tabRemainedInDialog && results.runtime.escapeClose.focusReturned ? 'PASS' : 'FAIL', method: 'Native modal keyboard behavior and focus measurement.', evidence: 'Tab and Shift+Tab remain within the modal; Escape returns focus to the menu trigger.' }
    ];
    model.qaResult = {
      status: checks.every((check) => check.status === 'PASS') ? 'PASS_WITH_LIMITATIONS' : 'REVIEW_REQUIRED',
      checks,
    };
    for (const artifact of model.artifactIndex) {
      if (['01-Visual-Design-Board.png', '02-Clean-Reference.png', '03-Clean-Reference-Mobile.png', 'render-source'].includes(artifact.path)) artifact.status = 'GENERATED';
    }
    if (!model.artifactIndex.some((artifact) => artifact.path === 'renders/qa-report.json')) {
      model.artifactIndex.push({ path: 'renders/qa-report.json', kind: 'runtime-qa-report', status: 'GENERATED' });
    }
    const matrixPath = path.join(boardDir, 'coverage-matrix.json');
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
    for (const item of matrix.coverage) item.status = model.qaResult.status === 'PASS_WITH_LIMITATIONS' ? 'VERIFIED' : 'REVIEW_REQUIRED';
    fs.writeFileSync(matrixPath, JSON.stringify(matrix, null, 2) + '\n');
    fs.writeFileSync(path.join(boardDir, 'design-spec.json'), JSON.stringify(model, null, 2) + '\n');
    fs.writeFileSync(path.join(renderDir, 'qa-report.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results, null, 2));
    if (model.qaResult.status !== 'PASS_WITH_LIMITATIONS') throw new Error('One or more navigation QA checks need review.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
