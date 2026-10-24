/* global process, document, getComputedStyle, innerWidth, innerHeight, HTMLElement, console */

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
const sourceDir = import.meta.dirname;
const packageDir = path.resolve(sourceDir, '..');
const repoRoot = path.resolve(sourceDir, '../../../../..');
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const toFileUrl = (filePath) => pathToFileURL(filePath).href;

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

async function captureFrame(page, frameId, state, nodeIds) {
  return page.evaluate(
    ({ frameId, state, nodeIds }) => {
      const round = (value) => Math.round(value * 100) / 100;
      const nodes = nodeIds.map((id) => {
        const element = document.querySelector(`[data-node-id="${id}"]`);
        if (!element) return { id, visible: false, bounds: null };
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const visible =
          !element.hidden &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0;
        return {
          id,
          visible,
          content: (element.getAttribute('aria-label') ?? element.innerText ?? '').trim().replace(/\s+/g, ' '),
          bounds: visible
            ? {
                x: round(rect.x),
                y: round(rect.y),
                width: round(rect.width),
                height: round(rect.height),
              }
            : null,
          computed: {
            display: style.display,
            direction: style.direction,
            position: style.position,
            borderRadius: style.borderRadius,
            maxHeight: style.maxHeight,
          },
        };
      });
      return {
        id: frameId,
        state,
        viewport: { widthPx: innerWidth, heightPx: innerHeight, deviceScaleFactor: 1 },
        nodes,
        fonts: {
          tahoma: document.fonts.check('12px Tahoma'),
          vazirmatn: document.fonts.check('12px Vazirmatn'),
        },
      };
    },
    { frameId, state, nodeIds },
  );
}

function toSceneGraph(measurements) {
  const parents = {
    'desktop-page': null,
    'desktop-header': 'desktop-page',
    'desktop-listing-header': 'desktop-page',
    'desktop-filter-toggle': 'desktop-listing-header',
    'desktop-listing-layout': 'desktop-page',
    'desktop-filter-rail': 'desktop-listing-layout',
    'desktop-close-button': 'desktop-filter-rail',
    'desktop-apply-button': 'desktop-filter-rail',
    'desktop-reset-link': 'desktop-filter-rail',
    'desktop-listing-content': 'desktop-listing-layout',
    'desktop-product-grid': 'desktop-listing-content',
    'mobile-page': null,
    'mobile-header': 'mobile-page',
    'mobile-listing-header': 'mobile-page',
    'mobile-filter-trigger': 'mobile-page',
    'mobile-product-grid': 'mobile-page',
    'mobile-overlay': 'mobile-page',
    'mobile-filter-sheet': 'mobile-overlay',
    'mobile-close-button': 'mobile-filter-sheet',
    'mobile-apply-button': 'mobile-filter-sheet',
    'mobile-reset-link': 'mobile-filter-sheet',
  };
  const roles = {
    'desktop-page': 'main',
    'desktop-header': 'header',
    'desktop-listing-header': 'listing-header',
    'desktop-filter-toggle': 'button',
    'desktop-listing-layout': 'desktop-grid',
    'desktop-filter-rail': 'filter-rail',
    'desktop-close-button': 'button',
    'desktop-apply-button': 'button',
    'desktop-reset-link': 'link',
    'desktop-listing-content': 'results-region',
    'desktop-product-grid': 'product-grid',
    'mobile-page': 'main',
    'mobile-header': 'header',
    'mobile-listing-header': 'listing-header',
    'mobile-filter-trigger': 'button',
    'mobile-product-grid': 'product-grid',
    'mobile-overlay': 'modal-backdrop',
    'mobile-filter-sheet': 'modal-dialog',
    'mobile-close-button': 'button',
    'mobile-apply-button': 'button',
    'mobile-reset-link': 'link',
  };
  const sourceRefs = {
    'desktop-page': ['S2'],
    'desktop-header': ['S7'],
    'desktop-listing-header': ['S2'],
    'desktop-filter-toggle': ['S2'],
    'desktop-listing-layout': ['S4'],
    'desktop-filter-rail': ['S2', 'S4', 'S6'],
    'desktop-close-button': ['S2'],
    'desktop-apply-button': ['S2'],
    'desktop-reset-link': ['S2'],
    'desktop-listing-content': ['S2', 'S4'],
    'desktop-product-grid': ['S4'],
    'mobile-page': ['S2'],
    'mobile-header': ['S7'],
    'mobile-listing-header': ['S2'],
    'mobile-filter-trigger': ['S2', 'S9'],
    'mobile-product-grid': ['S5'],
    'mobile-overlay': ['S3', 'S5'],
    'mobile-filter-sheet': ['S3', 'S5', 'S6'],
    'mobile-close-button': ['S3', 'S9'],
    'mobile-apply-button': ['S3', 'S9'],
    'mobile-reset-link': ['S3', 'S9'],
  };
  const tokenRefs = {
    'desktop-page': ['page'],
    'desktop-header': ['surface', 'line'],
    'desktop-filter-rail': ['surface', 'line', 'shadow'],
    'desktop-filter-toggle': ['rosewood'],
    'desktop-apply-button': ['rosewood'],
    'desktop-reset-link': ['rosewood'],
    'mobile-page': ['page'],
    'mobile-header': ['surface', 'line'],
    'mobile-overlay': ['overlay'],
    'mobile-filter-sheet': ['surface', 'line', 'shadow'],
    'mobile-filter-trigger': ['rosewood'],
    'mobile-close-button': ['surface-soft', 'ink'],
    'mobile-apply-button': ['rosewood'],
    'mobile-reset-link': ['rosewood'],
  };
  const interactionRefs = {
    'desktop-filter-toggle': ['desktop-open', 'desktop-close'],
    'desktop-close-button': ['desktop-close'],
    'desktop-apply-button': ['desktop-apply'],
    'desktop-reset-link': ['desktop-reset'],
    'mobile-filter-trigger': ['mobile-open'],
    'mobile-overlay': ['mobile-backdrop-close'],
    'mobile-close-button': ['mobile-close-button'],
    'mobile-apply-button': ['mobile-apply-close'],
    'mobile-reset-link': ['mobile-reset'],
  };
  const nodesById = new Map();
  for (const frame of measurements.frames) {
    for (const node of frame.nodes) {
      const existing = nodesById.get(node.id) ?? {
        id: node.id,
        parentId: parents[node.id],
        role: roles[node.id],
        children: [],
        sourceRefs: sourceRefs[node.id],
        tokenRefs: tokenRefs[node.id] ?? [],
        assetRefs: [],
        interactionRefs: interactionRefs[node.id] ?? [],
        content: node.content,
        frames: {},
      };
      existing.frames[frame.id] = {
        visible: node.visible,
        bounds: node.bounds,
        computed: node.computed,
      };
      nodesById.set(node.id, existing);
    }
  }
  const nodes = [...nodesById.values()];
  for (const node of nodes) {
    if (node.parentId) nodesById.get(node.parentId)?.children.push(node.id);
  }
  const interactions = [
    ['desktop-open', 'desktop filter button', 'click', 'desktop-closed', 'desktop-open', 'power2.out', ['gridTemplateColumns', 'columnGap', 'autoAlpha', 'x'], ['S1', 'S2']],
    ['desktop-close', 'desktop close button or toggle', 'click', 'desktop-open', 'desktop-closed', 'power2.in', ['gridTemplateColumns', 'columnGap', 'autoAlpha', 'x'], ['S1', 'S2']],
    ['desktop-apply', 'desktop apply button', 'click', 'desktop-open', 'desktop-open', 'none', ['scrollIntoView'], ['S2']],
    ['desktop-reset', 'desktop reset link', 'navigate', 'desktop-open', 'desktop-open', 'none', ['queryNavigation'], ['S2']],
    ['mobile-open', 'mobile filter trigger', 'click', 'mobile-closed', 'mobile-open', 'power2.out', ['autoAlpha', 'y', 'scale'], ['S1', 'S2', 'S3']],
    ['mobile-close-button', 'mobile close button', 'click', 'mobile-open', 'mobile-closed', 'power2.in', ['autoAlpha', 'y', 'scale'], ['S1', 'S3']],
    ['mobile-escape-close', 'Escape key', 'keydown', 'mobile-open', 'mobile-closed', 'power2.in', ['autoAlpha', 'y', 'scale'], ['S1', 'S3']],
    ['mobile-backdrop-close', 'backdrop press', 'mousedown', 'mobile-open', 'mobile-closed', 'power2.in', ['autoAlpha', 'y', 'scale'], ['S1', 'S3']],
    ['mobile-apply-close', 'apply filters button', 'click', 'mobile-open', 'mobile-closed', 'power2.in', ['autoAlpha', 'y', 'scale'], ['S1', 'S3']],
    ['mobile-reset', 'reset filters link', 'navigate', 'mobile-open', 'mobile-open', 'none', ['queryNavigation'], ['S3']],
    ['reduced-motion', 'prefers-reduced-motion media query', 'change', 'any-motion-state', 'final-state', 'none', ['opacity', 'transform', 'gridTemplateColumns'], ['S1']],
  ].map(([id, trigger, event, fromState, toState, ease, properties, sources]) => ({
    id,
    trigger,
    event,
    fromState,
    toState,
    evidenceStatus: properties.includes('queryNavigation') || properties.includes('scrollIntoView') ? 'SOURCE_DEFINED' : (id === 'reduced-motion' ? 'SOURCE_DEFINED' : 'PROPOSED'),
    sourceRefs: sources,
    motion: {
      engine: ease === 'none' && (properties.includes('queryNavigation') || properties.includes('scrollIntoView') || id === 'reduced-motion') ? 'none' : 'GSAP',
      durationMs: ease === 'none' ? 0 : 240,
      ease,
      properties,
      valuesEvidenceStatus: id === 'reduced-motion' ? 'SOURCE_DEFINED' : (ease === 'none' ? 'NOT_SPECIFIED' : 'PROPOSED'),
    },
  }));
  return {
    sceneGraphVersion: '1.0.0',
    componentId: 'catalog-filter-sidebar-gsap',
    coordinateSpace: 'CSS pixels relative to each browser viewport',
    frames: measurements.frames.map(({ id, state, viewport, fonts }) => ({
      id,
      state,
      viewport,
      localFonts: fonts,
      nodeIds: measurements.frames.find((frame) => frame.id === id).nodes.map((node) => node.id),
    })),
    nodes,
    interactions,
  };
}

function validateSceneGraph(sceneGraph, sourceIds) {
  const errors = [];
  const nodeIds = new Set(sceneGraph.nodes.map((node) => node.id));
  const frameIds = new Set(sceneGraph.frames.map((frame) => frame.id));
  if (nodeIds.size !== sceneGraph.nodes.length) errors.push('Scene graph node IDs are not unique.');
  if (frameIds.size !== sceneGraph.frames.length) errors.push('Scene graph frame IDs are not unique.');
  for (const frame of sceneGraph.frames) {
    for (const id of frame.nodeIds) {
      if (!nodeIds.has(id)) errors.push(`Frame ${frame.id} references missing node ${id}.`);
    }
  }
  for (const node of sceneGraph.nodes) {
    if (node.parentId && !nodeIds.has(node.parentId)) errors.push(`Node ${node.id} has missing parent ${node.parentId}.`);
    for (const childId of node.children) {
      const child = sceneGraph.nodes.find((item) => item.id === childId);
      if (!child) errors.push(`Node ${node.id} has missing child ${childId}.`);
      else if (child.parentId !== node.id) errors.push(`Node ${node.id} and child ${childId} have an asymmetric hierarchy.`);
    }
    for (const source of node.sourceRefs) {
      if (!sourceIds.has(source)) errors.push(`Node ${node.id} references missing source ${source}.`);
    }
    const visited = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId) {
      if (visited.has(parentId)) {
        errors.push(`Scene graph hierarchy contains a cycle at ${parentId}.`);
        break;
      }
      visited.add(parentId);
      parentId = sceneGraph.nodes.find((item) => item.id === parentId)?.parentId ?? null;
    }
    for (const frameId of Object.keys(node.frames)) {
      if (!frameIds.has(frameId)) errors.push(`Node ${node.id} references missing frame ${frameId}.`);
    }
  }
  const interactionIds = new Set(sceneGraph.interactions.map((interaction) => interaction.id));
  if (interactionIds.size !== sceneGraph.interactions.length) errors.push('Scene graph interaction IDs are not unique.');
  for (const interaction of sceneGraph.interactions) {
    for (const source of interaction.sourceRefs) {
      if (!sourceIds.has(source)) errors.push(`Interaction ${interaction.id} references missing source ${source}.`);
    }
  }
  for (const node of sceneGraph.nodes) {
    for (const interactionId of node.interactionRefs) {
      if (!interactionIds.has(interactionId)) errors.push(`Node ${node.id} references missing interaction ${interactionId}.`);
    }
  }
  return errors;
}

async function validateSchema(spec, schema) {
  try {
    const Ajv2020Module = require('ajv/dist/2020');
    const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validator = ajv.compile(schema);
    if (!validator(spec)) return { status: 'FAIL_AJV_DRAFT_2020_12', errors: validator.errors ?? [] };
    return { status: 'PASS_AJV_DRAFT_2020_12', errors: [] };
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return { status: 'UNVERIFIED_DRAFT_2020_12_VALIDATOR_MISSING', errors: ['Install Ajv 2020 to validate the full schema.'] };
  }
}

function syncDesignSpec(spec, sourceIndex, conflictRegistry, sceneGraph, qaResult) {
  const nodesById = new Map(sceneGraph.nodes.map((node) => [node.id, node]));
  spec.sourceIndex.sourceIds = sourceIndex.sources.map((source) => source.id);
  spec.authorityDecisions.resolvedConflictIds = conflictRegistry.conflicts.map((conflict) => conflict.id);
  spec.sceneGraph.frameIds = sceneGraph.frames.map((frame) => frame.id);
  spec.sceneGraph.nodeIds = sceneGraph.nodes.map((node) => node.id);
  spec.frames = sceneGraph.frames.map((frame) => ({
    id: frame.id,
    state: frame.state,
    viewport: frame.viewport,
    evidenceStatus: 'MEASURED',
    sourceRefs: [...new Set(frame.nodeIds.flatMap((nodeId) => nodesById.get(nodeId).sourceRefs))],
  }));
  spec.nodes = sceneGraph.nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId,
    role: node.role,
    children: node.children,
    frameIds: Object.keys(node.frames),
    sourceRefs: node.sourceRefs,
    tokenRefs: node.tokenRefs,
    assetRefs: node.assetRefs,
    interactionRefs: node.interactionRefs,
    content: node.content,
  }));
  spec.assets = [];
  spec.interactions = sceneGraph.interactions;
  spec.artifactIndex = [
    { id: 'visual-board', path: '01-Visual-Design-Board.png', kind: 'visual-board', status: 'GENERATED' },
    { id: 'desktop-reference', path: '02-Clean-Reference.png', kind: 'clean-reference', status: 'GENERATED' },
    { id: 'mobile-reference', path: '03-Clean-Reference-Mobile.png', kind: 'clean-mobile-reference', status: 'GENERATED' },
    { id: 'canonical-model', path: 'design-spec.json', kind: 'source-model', status: 'GENERATED' },
    { id: 'model-schema', path: 'design-spec.schema.json', kind: 'schema', status: 'GENERATED' },
    { id: 'quality-report', path: 'qa-report.json', kind: 'qa-report', status: 'GENERATED' },
    { id: 'render-source', path: 'render-source/README.md', kind: 'render-source', status: 'GENERATED' },
    { id: 'runtime-mobile-capture', path: 'runtime-mobile-open.png', kind: 'runtime-capture', status: 'GENERATED' },
  ];
  spec.qaResult = qaResult;
}

async function main() {
  await mkdir(packageDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const frames = [];
  const render = async ({ fileName, frameId, state, viewport, nodeIds, screenshotPath, closedAction }) => {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.goto(toFileUrl(path.join(sourceDir, fileName)), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    if (closedAction) await page.evaluate(closedAction);
    const metrics = await captureFrame(page, frameId, state, nodeIds);
    if (!closedAction && screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' });
    }
    frames.push(metrics);
    await page.close();
    return metrics;
  };

  try {
    const desktopNodes = [
      'desktop-page', 'desktop-header', 'desktop-listing-header', 'desktop-filter-toggle', 'desktop-listing-layout',
      'desktop-filter-rail', 'desktop-close-button', 'desktop-apply-button', 'desktop-reset-link', 'desktop-listing-content', 'desktop-product-grid',
    ];
    const mobileNodes = [
      'mobile-page', 'mobile-header', 'mobile-listing-header', 'mobile-filter-trigger', 'mobile-product-grid',
      'mobile-overlay', 'mobile-filter-sheet', 'mobile-close-button', 'mobile-apply-button', 'mobile-reset-link',
    ];
    await render({
      fileName: 'clean-reference-desktop.html', frameId: 'desktop-open', state: 'open',
      viewport: { width: 1440, height: 900 }, nodeIds: desktopNodes,
      screenshotPath: path.join(packageDir, '02-Clean-Reference.png'),
    });
    await render({
      fileName: 'clean-reference-desktop.html', frameId: 'desktop-closed', state: 'closed',
      viewport: { width: 1440, height: 900 }, nodeIds: desktopNodes,
      closedAction: () => {
        const style = document.createElement('style');
        style.textContent = '.listing-layout--filters-closed{grid-template-columns:minmax(0,1fr)}.listing-layout--filters-closed .filter-rail{display:none}.listing-layout--filters-closed .product-grid{grid-template-columns:repeat(4,minmax(0,1fr))}';
        document.head.append(style);
        document.querySelector('.listing-layout')?.classList.add('listing-layout--filters-closed');
        const rail = document.querySelector('#listing-filter-rail');
        if (rail instanceof HTMLElement) rail.hidden = true;
      },
    });
    await render({
      fileName: 'clean-reference-mobile.html', frameId: 'mobile-open', state: 'open',
      viewport: { width: 390, height: 844 }, nodeIds: mobileNodes,
      screenshotPath: path.join(packageDir, '03-Clean-Reference-Mobile.png'),
    });
    await render({
      fileName: 'clean-reference-mobile.html', frameId: 'mobile-closed', state: 'closed',
      viewport: { width: 390, height: 844 }, nodeIds: mobileNodes,
      closedAction: () => {
        const overlay = document.querySelector('.overlay');
        if (overlay instanceof HTMLElement) overlay.style.display = 'none';
      },
    });
    const board = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
    await board.goto(toFileUrl(path.join(sourceDir, 'board.html')), { waitUntil: 'load' });
    await board.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode()));
    });
    await board.screenshot({ path: path.join(packageDir, '01-Visual-Design-Board.png'), fullPage: false, animations: 'disabled' });
    await board.close();
  } finally {
    await browser.close();
  }

  const specPath = path.join(packageDir, 'design-spec.json');
  const schemaPath = path.join(packageDir, 'design-spec.schema.json');
  const spec = await readJson(specPath);
  const schema = await readJson(schemaPath);
  const sourceIndexPath = path.join(packageDir, 'source-index.json');
  const sourceIndex = await readJson(sourceIndexPath);
  const conflictRegistry = await readJson(path.join(packageDir, 'conflicts.json'));
  for (const source of sourceIndex.sources) {
    if (source.path) source.sha256 = await sha256(path.join(repoRoot, source.path));
  }
  await writeJson(sourceIndexPath, sourceIndex);

  const measurements = {
    renderer: {
      browser: 'Google Chrome via Playwright',
      browserVersion: await (async () => {
        const versionBrowser = await chromium.launch({ headless: true, executablePath: chromePath });
        const version = versionBrowser.version();
        await versionBrowser.close();
        return version;
      })(),
      deviceScaleFactor: 1,
      fontPolicy: 'No remote fonts; local browser/system fonts only.',
      screenshots: {
        board: { widthPx: 1536, heightPx: 1024, file: '01-Visual-Design-Board.png' },
        desktop: { widthPx: 1440, heightPx: 900, file: '02-Clean-Reference.png' },
        mobile: { widthPx: 390, heightPx: 844, file: '03-Clean-Reference-Mobile.png' },
      },
    },
    frames,
  };
  await writeJson(path.join(packageDir, 'render-measurements.json'), measurements);

  const sceneGraph = toSceneGraph(measurements);
  const sourceIds = new Set(sourceIndex.sources.map((source) => source.id));
  const semanticErrors = validateSceneGraph(sceneGraph, sourceIds);
  await writeJson(path.join(packageDir, 'scene-graph.json'), sceneGraph);

  const tokens = await readJson(path.join(packageDir, 'design-tokens.json'));
  const modeledTokenNames = new Set(['page', 'surface', 'surface-soft', 'ink', 'muted', 'rosewood', 'rosewood-dark', 'rosewood-soft', 'line', 'shadow', 'overlay']);
  const tokenValues = Object.fromEntries(tokens.tokens
    .filter((token) => modeledTokenNames.has(token.name))
    .map((token) => [token.name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), token.value]));
  spec.tokens = { ...spec.tokens, ...tokenValues };
  syncDesignSpec(spec, sourceIndex, conflictRegistry, sceneGraph, {
    reportPath: 'qa-report.json',
    status: 'UNVERIFIED',
    designPackageStatus: 'UNVERIFIED',
    implementationStatus: 'UNVERIFIED',
  });
  const schemaResult = await validateSchema(spec, schema);

  const coveragePath = path.join(packageDir, 'coverage-matrix.json');
  const coverage = await readJson(coveragePath);
  for (const criterion of coverage.criteria) {
    if (criterion.status === 'covered') criterion.status = 'reference_rendered';
  }
  await writeJson(coveragePath, coverage);

  const screenshots = [
    ['01-Visual-Design-Board.png', 1536, 1024],
    ['02-Clean-Reference.png', 1440, 900],
    ['03-Clean-Reference-Mobile.png', 390, 844],
  ].map(([file, width, height]) => ({ file, width, height }));
  const dimensionErrors = [];
  for (const screenshot of screenshots) {
    const bytes = await readFile(path.join(packageDir, screenshot.file));
    if (bytes.readUInt32BE(16) !== screenshot.width || bytes.readUInt32BE(20) !== screenshot.height) {
      dimensionErrors.push(`Unexpected dimensions for ${screenshot.file}.`);
    }
  }
  const errors = [...schemaResult.errors.map((error) => JSON.stringify(error)), ...semanticErrors, ...dimensionErrors];
  const qa = {
    qaReportVersion: '1.0.0',
    componentId: 'catalog-filter-sidebar-gsap',
    generatedOn: new Date().toISOString().slice(0, 10),
    designPackage: {
      schemaValidation: schemaResult.status,
      semanticValidation: semanticErrors.length ? 'FAIL' : 'PASS',
      screenshotDimensions: dimensionErrors.length ? 'FAIL' : 'PASS',
      sourceMeasurements: 'PASS_BROWSER_MEASURED',
      visualReview: 'PENDING_MANUAL_INSPECTION',
      errors,
    },
    implementation: {
      typecheck: 'PENDING',
      lint: 'PENDING',
      build: 'PENDING',
      runtimeVisualReview: 'PENDING',
      tests: 'NOT_RUN_BY_REQUEST_SCOPE',
    },
    acceptanceCoverage: coverage.criteria.map(({ id, status }) => ({ id, status })),
  };
  await writeJson(path.join(packageDir, 'qa-report.json'), qa);
  spec.qaResult = {
    reportPath: 'qa-report.json',
    status: schemaResult.status.startsWith('PASS') && errors.length === 0 ? 'UNVERIFIED' : (errors.length ? 'FAIL' : 'UNVERIFIED'),
    designPackageStatus: errors.length ? 'FAIL' : 'UNVERIFIED',
    implementationStatus: 'UNVERIFIED',
  };
  await writeJson(specPath, spec);

  const allFiles = await collectFiles(packageDir);
  const manifestAssets = [];
  for (const filePath of allFiles) {
    if (path.basename(filePath) === 'manifest.json') continue;
    const relativePath = path.relative(packageDir, filePath).replaceAll(path.sep, '/');
    const fileInfo = await stat(filePath);
    manifestAssets.push({ path: relativePath, sizeBytes: fileInfo.size, sha256: await sha256(filePath) });
  }
  manifestAssets.sort((a, b) => a.path.localeCompare(b.path));
  await writeJson(path.join(packageDir, 'manifest.json'), {
    manifestVersion: '1.0.0',
    componentId: 'catalog-filter-sidebar-gsap',
    createdOn: new Date().toISOString().slice(0, 10),
    branch: 'codex/fix-catalog-sidebar-gsap',
    baseCommit: '2d95671f56668f2731dccf2af3a3c6db6fa0e835',
    productionChanges: [
      'apps/web/src/features/catalog/components/listing-discovery.tsx',
      'apps/web/src/styles/storefront-reference.css',
      'apps/web/package.json',
      'bun.lock',
    ],
    files: manifestAssets,
    verification: {
      designSpecSchema: schemaResult.status,
      sceneGraphSemantics: semanticErrors.length ? 'FAIL' : 'PASS',
      referenceDimensions: '1536x1024, 1440x900, 390x844',
      liveRuntimeVisualReview: 'PENDING',
    },
  });

  console.log(JSON.stringify({ schema: schemaResult.status, semanticErrors, dimensionErrors, screenshots }, null, 2));
}

await main();
