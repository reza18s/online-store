const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('@playwright/test');

const packageDir = __dirname;
const evidenceDir = path.join(packageDir, 'evidence');
const model = JSON.parse(
  fs.readFileSync(path.join(packageDir, 'mobile-search-design.json'), 'utf8'),
);
const sceneGraph = JSON.parse(fs.readFileSync(path.join(packageDir, 'scene-graph.json'), 'utf8'));
const tokens = JSON.parse(fs.readFileSync(path.join(packageDir, 'tokens.json'), 'utf8')).tokens;
const sourceIndex = JSON.parse(fs.readFileSync(path.join(packageDir, 'source-index.json'), 'utf8'));
const assetIndex = JSON.parse(fs.readFileSync(path.join(packageDir, 'asset-index.json'), 'utf8'));
const baseUrl = process.env.MOBILE_SEARCH_BASE_URL ?? 'http://127.0.0.1:5175';

function validateSemanticReferences() {
  const sourceIds = new Set(sourceIndex.sources.map((source) => source.id));
  const assetIds = new Set(assetIndex.assets.map((asset) => asset.id));
  const tokenIds = new Set(Object.keys(tokens));
  const knownNodes = new Set(sceneGraph.nodes.map((node) => node.id));

  for (const id of model.sourceIds) assert(sourceIds.has(id), `Unknown model source ID: ${id}`);
  for (const id of model.assetIds) assert(assetIds.has(id), `Unknown model asset ID: ${id}`);
  for (const component of model.components) {
    for (const id of component.sourceIds)
      assert(sourceIds.has(id), `Unknown ${component.id} source ID: ${id}`);
    for (const id of component.assetIds)
      assert(assetIds.has(id), `Unknown ${component.id} asset ID: ${id}`);
    for (const id of component.tokenRefs)
      assert(tokenIds.has(id), `Unknown ${component.id} token ID: ${id}`);
  }
  for (const node of sceneGraph.nodes) {
    if (node.parentId)
      assert(knownNodes.has(node.parentId), `Unknown ${node.id} parent: ${node.parentId}`);
    for (const id of node.sourceIds)
      assert(sourceIds.has(id), `Unknown ${node.id} source ID: ${id}`);
    for (const id of node.tokenRefs) assert(tokenIds.has(id), `Unknown ${node.id} token ID: ${id}`);
    for (const id of node.assetIds ?? [])
      assert(assetIds.has(id), `Unknown ${node.id} asset ID: ${id}`);
  }
}

function resolveBrowserPath() {
  const candidates = [
    process.env.EDGE_EXECUTABLE_PATH,
    process.env['ProgramFiles(x86)'] &&
      path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.ProgramFiles &&
      path.join(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.ProgramFiles &&
      path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  const browserPath = candidates.find((candidate) => fs.existsSync(candidate));
  assert(browserPath, 'Set EDGE_EXECUTABLE_PATH to an installed Edge or Chrome executable.');
  return browserPath;
}

async function withBrowserContext(viewport, callback) {
  const tempRoot = path.resolve(os.tmpdir());
  const profilePath = fs.mkdtempSync(path.join(tempRoot, 'nova-mobile-search-'));
  let context;
  try {
    context = await chromium.launchPersistentContext(profilePath, {
      headless: true,
      executablePath: resolveBrowserPath(),
      viewport,
      deviceScaleFactor: 1,
      isMobile: false,
    });
    await callback(context, context.pages()[0] ?? (await context.newPage()));
  } finally {
    if (context) await context.close();
    const resolvedProfilePath = path.resolve(profilePath);
    assert(
      resolvedProfilePath.startsWith(`${tempRoot}${path.sep}`),
      'Refusing to remove a profile outside the temporary folder.',
    );
    fs.rmSync(resolvedProfilePath, { recursive: true, force: true });
  }
}

async function waitForResults(page) {
  await page.waitForLoadState('networkidle');
  await page.locator('#listing-results').waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

async function collectMetrics(page, viewport) {
  return page.evaluate((expectedViewport) => {
    const measure = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const nav = measure('.mobile-bottom-nav');
    const firstAdd = measure('#listing-results .product-card__add');
    const suggestions = document.querySelector('.listing-search-box__suggestions');
    const grid = document.querySelector('#listing-results .product-grid');
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length : 0;
    const intersects = Boolean(
      nav && firstAdd && firstAdd.y < nav.y + nav.height && firstAdd.y + firstAdd.height > nav.y,
    );
    return {
      viewport: expectedViewport,
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      horizontalOverflow: document.documentElement.scrollWidth > expectedViewport.width,
      searchPanel: measure('.listing-search-box'),
      queryInput: measure('#discovery-search'),
      clearButton: measure('.listing-search-box__clear'),
      submitButton: measure('.listing-search-box__submit'),
      suggestionLink: measure('.listing-search-box__suggestion'),
      suggestionStripScrolls: Boolean(
        suggestions && suggestions.scrollWidth > suggestions.clientWidth,
      ),
      columns,
      firstFavorite: measure('#listing-results .product-card__favorite'),
      firstAdd,
      fixedNavigation: nav,
      firstAddIntersectsNavigation: intersects,
    };
  }, viewport);
}

function assertMobileMetrics(metrics) {
  assert.equal(
    metrics.horizontalOverflow,
    false,
    `Horizontal overflow at ${metrics.viewport.width}px.`,
  );
  assert.equal(metrics.columns, 2, `Expected two product columns at ${metrics.viewport.width}px.`);
  for (const [name, target] of [
    ['query input', metrics.queryInput],
    ['clear button', metrics.clearButton],
    ['submit button', metrics.submitButton],
    ['suggestion link', metrics.suggestionLink],
    ['favorite button', metrics.firstFavorite],
    ['add-to-cart button', metrics.firstAdd],
  ]) {
    assert(target && target.height >= 44, `${name} is below 44 px at ${metrics.viewport.width}px.`);
  }
  assert.equal(
    metrics.firstAddIntersectsNavigation,
    false,
    `First add-to-cart action intersects fixed navigation at ${metrics.viewport.width}px.`,
  );
}

async function captureViewport(width, height, screenshotPath) {
  let result;
  await withBrowserContext({ width, height }, async (context, page) => {
    const query = encodeURIComponent('پیراهن');
    await page.goto(`${baseUrl}/products?q=${query}`, { waitUntil: 'domcontentloaded' });
    await waitForResults(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: screenshotPath, fullPage: false });
    result = await collectMetrics(page, { width, height });
    assertMobileMetrics(result);
  });
  return result;
}

async function inspectQueryFlow() {
  const flow = {};
  await withBrowserContext({ width: 390, height: 844 }, async (context, page) => {
    const query = encodeURIComponent('پیراهن');
    const initialUrl = `${baseUrl}/products?q=${query}&sort=price_asc&page=2&size=M`;
    await page.goto(initialUrl, { waitUntil: 'domcontentloaded' });
    await waitForResults(page);
    const input = page.locator('#discovery-search');
    const originalUrl = page.url();
    await input.fill('پیراهن سنتی');
    flow.urlAfterMobileTyping = page.url();
    flow.draftAfterTyping = await input.inputValue();
    assert.equal(
      flow.urlAfterMobileTyping,
      originalUrl,
      'Typing on mobile should leave the submitted query unchanged.',
    );

    await input.press('Enter');
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('q') === 'پیراهن سنتی',
    );
    const submitted = new URL(page.url());
    const submittedUrl = page.url();
    flow.queryAfterSubmit = Object.fromEntries(
      ['q', 'sort', 'page', 'size'].map((key) => [key, submitted.searchParams.get(key)]),
    );
    assert.equal(submitted.searchParams.get('sort'), 'price_asc');
    assert.equal(submitted.searchParams.get('size'), 'M');
    assert.equal(submitted.searchParams.has('page'), false);

    await page.locator('.listing-search-box__clear').click();
    flow.urlAfterClearClick = page.url();
    flow.draftAfterClear = await page.locator('#discovery-search').inputValue();
    assert.equal(
      flow.urlAfterClearClick,
      submittedUrl,
      'Clearing the draft must not submit by itself.',
    );
    assert.equal(flow.draftAfterClear, '');
    await page.locator('#discovery-search').press('Enter');
    await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('q'));
    flow.urlAfterSubmittingEmptyQuery = page.url();
    assert.equal(new URL(page.url()).searchParams.get('sort'), 'price_asc');
    assert.equal(new URL(page.url()).searchParams.get('size'), 'M');

    await page.goBack();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('q') === 'پیراهن سنتی',
    );
    await page.waitForFunction(
      () => document.querySelector('#discovery-search')?.value === 'پیراهن سنتی',
    );
    flow.valueAfterBrowserBack = await page.locator('#discovery-search').inputValue();
    assert.equal(flow.valueAfterBrowserBack, 'پیراهن سنتی');
  });

  await withBrowserContext({ width: 1000, height: 800 }, async (context, page) => {
    const query = encodeURIComponent('پیراهن');
    await page.goto(`${baseUrl}/products?q=${query}`, { waitUntil: 'domcontentloaded' });
    await waitForResults(page);
    await page.locator('#discovery-search').fill('پیراهن لینن');
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('q') === 'پیراهن لینن',
    );
    flow.desktopQueryAfterTyping = new URL(page.url()).searchParams.get('q');
    flow.desktopSubmitButtonVisible = await page.locator('.listing-search-box__submit').isVisible();
    assert.equal(flow.desktopQueryAfterTyping, 'پیراهن لینن');
    assert.equal(flow.desktopSubmitButtonVisible, false);
  });
  return flow;
}

async function renderBoard() {
  const boardPath = path.join(packageDir, 'board.html');
  await withBrowserContext({ width: 1920, height: 1360 }, async (context, page) => {
    await page.goto(pathToFileURL(boardPath).href, { waitUntil: 'load' });
    const annotations = [
      [
        'search-query-form',
        'Draft, clear, submit',
        'Mobile edits stay local until submit. Clear and submit each use a 44 px control.',
      ],
      [
        'search-suggestions',
        'One RTL suggestion strip',
        'Keep 44 px links in one horizontal row and recover the vertical space used by wrapped chips.',
      ],
      [
        'result-controls',
        'Filter and sort',
        'Keep the existing catalog controls together in a two-column mobile row.',
      ],
      [
        'product-results',
        'Two-column product cards',
        'Keep the 44 px favorite and add actions visible above the fixed navigation.',
      ],
    ];
    const annotationsHtml = annotations
      .map(([id, title, body], index) => {
        const component = model.components.find((item) => item.id === id);
        assert(component, `Missing board component: ${id}`);
        return `<div class="annotation"><span class="badge">${index + 1}</span><div><h3>${title}</h3><p>${body}</p></div></div>`;
      })
      .join('');
    const swatchNames = ['page', 'surface', 'surfaceSoft', 'ink', 'primary', 'line'];
    const swatchesHtml = swatchNames
      .map((name) => {
        const token = tokens[name];
        assert(token, `Missing board token: ${name}`);
        return `<div class="swatch"><div class="swatch-color" style="background:${token.value}"></div><div class="swatch-label"><b>${name}</b>${token.value}</div></div>`;
      })
      .join('');
    await page.locator('#board-title').evaluate((element) => {
      element.textContent = 'Mobile product search';
    });
    await page.locator('#annotation-list').evaluate((element, html) => {
      element.innerHTML = html;
    }, annotationsHtml);
    await page.locator('#token-list').evaluate((element, html) => {
      element.innerHTML = html;
    }, swatchesHtml);
    await page.screenshot({ path: path.join(packageDir, '01-Visual-Design-Board.png') });
  });
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  validateSemanticReferences();
  const referencePath = path.join(packageDir, '02-Clean-Reference.png');
  const mobile390 = await captureViewport(390, 844, referencePath);
  fs.copyFileSync(referencePath, path.join(evidenceDir, 'after-results-390x844.png'));
  const mobile360 = await captureViewport(
    360,
    800,
    path.join(evidenceDir, 'after-results-360x800.png'),
  );
  const interactions = await inspectQueryFlow();
  await renderBoard();

  const qa = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    fixtureMode: 'development-only storefront fixtures',
    semanticReferences: 'passed',
    actualAppViewports: [mobile390, mobile360],
    browserInteractionReview: interactions,
    checks: {
      mobilePageHasNoHorizontalOverflow: true,
      twoProductColumnsAt360And390: true,
      mobileSearchAndCardTargetsAtLeast44Px: true,
      firstAddActionClearsFixedNavigation: true,
      mobileQueryDraftAndSubmit: true,
      filterSortPreservedAndPageReset: true,
      browserBackRestoresQueryField: true,
      desktopLiveQueryPreserved: true,
    },
  };
  fs.writeFileSync(path.join(evidenceDir, 'qa-metrics.json'), `${JSON.stringify(qa, null, 2)}\n`);
  fs.writeFileSync(
    path.join(evidenceDir, 'interaction-flow.json'),
    `${JSON.stringify(interactions, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(qa, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
