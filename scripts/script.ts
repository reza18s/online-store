import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ComponentInfo = {
  names: Set<string>;
  path: string;
  code: string;
  language: string;
};

type ParsedImport = {
  importPart: string;
  source: string;
};

type ImportedBinding = {
  importedName: string;
  localName: string;
};

type ParsedReExport = {
  source: string;
  importedName: string | null;
  exportedName: string | null;
};

type PackageManifest = {
  name?: string;
  main?: string;
  module?: string;
  source?: string;
  types?: string;
  exports?: unknown;
  workspaces?: string[] | { packages?: string[] };
};

type WorkspacePackage = {
  root: string;
  manifest: PackageManifest;
};

type ComponentSource = {
  filePath: string;
  names: string[];
};

const ROOT = process.cwd();
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(SCRIPT_DIR, '..');

const entryArg = process.argv[2];
const outputArg = process.argv[3] ?? 'page-context.md';

if (!entryArg) {
  console.error(`
Usage:
  bun ../../scripts/script.ts <page-path> [output] (from an app directory)

Examples:
  bun ../../scripts/script.ts src/features/catalog/components/home-discovery.tsx
  bun ../../scripts/script.ts src/features/catalog/components/home-discovery.tsx page-context.md
`);

  process.exit(1);
}

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'] as const;

const visited = new Set<string>();

const components = new Map<string, ComponentInfo>();

function readPackageManifest(packageRoot: string): PackageManifest | null {
  const manifestPath = path.join(packageRoot, 'package.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PackageManifest;
  } catch {
    return null;
  }
}

function loadWorkspacePackages(): Map<string, WorkspacePackage> {
  const rootManifest = readPackageManifest(WORKSPACE_ROOT);
  const configuredWorkspaces = rootManifest?.workspaces;
  const patterns = Array.isArray(configuredWorkspaces)
    ? configuredWorkspaces
    : (configuredWorkspaces?.packages ?? []);
  const workspacePackages = new Map<string, WorkspacePackage>();

  for (const pattern of patterns) {
    let packageRoots: string[] = [];

    if (pattern.endsWith('/*')) {
      const parentPath = path.resolve(WORKSPACE_ROOT, pattern.slice(0, -2));

      if (!fs.existsSync(parentPath) || !fs.statSync(parentPath).isDirectory()) {
        continue;
      }

      packageRoots = fs
        .readdirSync(parentPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(parentPath, entry.name));
    } else if (!pattern.includes('*')) {
      packageRoots = [path.resolve(WORKSPACE_ROOT, pattern)];
    }

    for (const packageRoot of packageRoots) {
      const manifest = readPackageManifest(packageRoot);

      if (manifest?.name) {
        workspacePackages.set(manifest.name, { root: packageRoot, manifest });
      }
    }
  }

  return workspacePackages;
}

const workspacePackages = loadWorkspacePackages();

function resolveConditionalExport(target: unknown): string | null {
  if (typeof target === 'string') {
    return target;
  }

  if (!target || typeof target !== 'object') {
    return null;
  }

  const conditions = target as Record<string, unknown>;

  for (const condition of ['source', 'import', 'default', 'require', 'types']) {
    const resolved = resolveConditionalExport(conditions[condition]);

    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function resolvePackageExport(exportsField: unknown, subpath: string): string | null {
  if (typeof exportsField === 'string') {
    return subpath === '.' ? exportsField : null;
  }

  if (!exportsField || typeof exportsField !== 'object') {
    return null;
  }

  const exportsMap = exportsField as Record<string, unknown>;
  const hasSubpathKeys = Object.keys(exportsMap).some((key) => key.startsWith('.'));

  if (hasSubpathKeys) {
    return resolveConditionalExport(exportsMap[subpath]);
  }

  return subpath === '.' ? resolveConditionalExport(exportsField) : null;
}

function normalize(filePath: string): string {
  return path.relative(ROOT, filePath).replaceAll('\\', '/');
}

function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).slice(1);

  switch (ext) {
    case 'tsx':
      return 'tsx';

    case 'ts':
      return 'ts';

    case 'jsx':
      return 'jsx';

    case 'js':
    case 'mjs':
    case 'cjs':
      return 'js';

    default:
      return '';
  }
}

function resolveFile(basePath: string): string | null {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return path.resolve(basePath);
  }

  for (const ext of EXTENSIONS) {
    const target = basePath + ext;

    if (fs.existsSync(target)) {
      return path.resolve(target);
    }
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const target = path.join(basePath, `index${ext}`);

      if (fs.existsSync(target)) {
        return path.resolve(target);
      }
    }
  }

  return null;
}

function resolveWorkspaceImport(importPath: string): string | null {
  const packageName = [...workspacePackages.keys()]
    .sort((left, right) => right.length - left.length)
    .find((name) => importPath === name || importPath.startsWith(`${name}/`));

  if (!packageName) {
    return null;
  }

  const workspacePackage = workspacePackages.get(packageName);

  if (!workspacePackage) {
    return null;
  }

  const suffix = importPath.slice(packageName.length);
  const subpath = suffix ? `.${suffix}` : '.';
  const { manifest, root } = workspacePackage;
  let packageEntry: string | null = null;

  if (manifest.exports !== undefined) {
    packageEntry = resolvePackageExport(manifest.exports, subpath);
  } else if (subpath === '.') {
    packageEntry = manifest.source ?? manifest.module ?? manifest.main ?? manifest.types ?? 'src/index.ts';
  } else {
    packageEntry = suffix.slice(1);
  }

  return packageEntry ? resolveFile(path.resolve(root, packageEntry)) : null;
}

function resolveImport(importPath: string, currentFile: string): string | null {
  // ./Header
  // ../components/Card
  if (importPath.startsWith('.')) {
    return resolveFile(path.resolve(path.dirname(currentFile), importPath));
  }

  // @/components/Button
  // Assumes @/ = src/
  if (importPath.startsWith('@/')) {
    return resolveFile(path.resolve(ROOT, 'src', importPath.slice(2)));
  }

  // ~/components/Button
  // Assumes ~/ = src/
  if (importPath.startsWith('~/')) {
    return resolveFile(path.resolve(ROOT, 'src', importPath.slice(2)));
  }

  // Resolve local monorepo packages, while leaving third-party packages out.
  return resolveWorkspaceImport(importPath);
}

function parseImports(content: string): ParsedImport[] {
  const imports: ParsedImport[] = [];

  const regex = /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(content))) {
    imports.push({
      importPart: match[1].trim(),
      source: match[2],
    });
  }

  return imports;
}

function extractImportedBindings(importPart: string): ImportedBinding[] {
  if (importPart.startsWith('type ')) {
    return [];
  }

  const bindings: ImportedBinding[] = [];

  // import Header from "./Header"
  const defaultMatch = importPart.match(/^([A-Za-z_$][\w$]*)/);

  if (defaultMatch && defaultMatch[1] !== 'type') {
    bindings.push({ importedName: 'default', localName: defaultMatch[1] });
  }

  // import {
  //   Header,
  //   Card as ProductCard
  // } from "./components"
  const namedMatch = importPart.match(/\{([\s\S]*?)\}/);

  if (namedMatch) {
    const parts = namedMatch[1].split(',');

    for (const part of parts) {
      const cleaned = part.trim();

      if (!cleaned || cleaned.startsWith('type ')) {
        continue;
      }

      const aliasParts = cleaned.split(/\s+as\s+/);

      const importedName = aliasParts[0].trim();
      const localName = aliasParts[1]?.trim() ?? importedName;

      if (importedName && localName) {
        bindings.push({ importedName, localName });
      }
    }
  }

  // import * as UI from "./ui"
  const namespaceMatch = importPart.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);

  if (namespaceMatch) {
    bindings.push({ importedName: '*', localName: namespaceMatch[1] });
  }

  return bindings;
}

function parseReExports(content: string): ParsedReExport[] {
  const exports: ParsedReExport[] = [];
  const namedRegex = /export\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["']([^"']+)["']/g;
  const starRegex = /export\s+\*\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;

  while ((match = namedRegex.exec(content))) {
    for (const part of match[1].split(',')) {
      const cleaned = part.trim();

      if (!cleaned || cleaned.startsWith('type ')) {
        continue;
      }

      const [importedName, exportedName] = cleaned.split(/\s+as\s+/).map((name) => name.trim());

      if (importedName && exportedName !== undefined) {
        exports.push({ source: match[2], importedName, exportedName });
      } else if (importedName) {
        exports.push({ source: match[2], importedName, exportedName: importedName });
      }
    }
  }

  while ((match = starRegex.exec(content))) {
    exports.push({ source: match[1], importedName: null, exportedName: null });
  }

  return exports;
}

function resolveComponentSources(
  filePath: string,
  requestedNames: string[],
  visitedExports = new Set<string>(),
): ComponentSource[] {
  const absolute = path.resolve(filePath);
  const visitKey = `${absolute}:${[...requestedNames].sort().join(',')}`;

  if (visitedExports.has(visitKey)) {
    return [];
  }

  visitedExports.add(visitKey);

  const content = fs.readFileSync(absolute, 'utf8');
  const reExports = parseReExports(content);

  if (reExports.length === 0) {
    return [{ filePath: absolute, names: requestedNames }];
  }

  const sources = new Map<string, Set<string>>();
  const resolvedNames = new Set<string>();

  const addSources = (items: ComponentSource[]) => {
    for (const item of items) {
      const existing = sources.get(item.filePath) ?? new Set<string>();

      for (const name of item.names) {
        existing.add(name);
      }

      sources.set(item.filePath, existing);
    }
  };

  for (const reExport of reExports) {
    const namesToResolve = reExport.exportedName === null
      ? requestedNames
      : requestedNames.filter((name) => name === reExport.exportedName);

    if (namesToResolve.length === 0) {
      continue;
    }

    const targetPath = resolveImport(reExport.source, absolute);

    if (!targetPath) {
      continue;
    }

    const targetNames = reExport.importedName === null
      ? namesToResolve
      : [reExport.importedName];

    addSources(resolveComponentSources(targetPath, targetNames, visitedExports));

    for (const name of namesToResolve) {
      resolvedNames.add(name);
    }
  }

  const unresolvedNames = requestedNames.filter((name) => !resolvedNames.has(name));

  if (unresolvedNames.length > 0 || sources.size === 0) {
    const names = unresolvedNames.length > 0 ? unresolvedNames : requestedNames;
    const existing = sources.get(absolute) ?? new Set<string>();

    for (const name of names) {
      existing.add(name);
    }

    sources.set(absolute, existing);
  }

  return [...sources.entries()].map(([sourcePath, names]) => ({
    filePath: sourcePath,
    names: [...names],
  }));
}

function getUsedComponents(content: string): Set<string> {
  const used = new Set<string>();

  // Detect:
  // <Header />
  // <Header>
  // <UI.Button />
  const regex = /<([A-Z][A-Za-z0-9_$]*(?:\.[A-Za-z0-9_$]+)*)\b/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(content))) {
    const fullName = match[1];

    const rootName = fullName.split('.')[0];

    used.add(rootName);
  }

  return used;
}

function scan(filePath: string): void {
  const absolute = path.resolve(filePath);

  if (visited.has(absolute)) {
    return;
  }

  visited.add(absolute);

  const content = fs.readFileSync(absolute, 'utf8');

  const imports = parseImports(content);

  const usedComponents = getUsedComponents(content);

  for (const item of imports) {
    const resolvedFile = resolveImport(item.source, absolute);

    if (!resolvedFile) {
      continue;
    }

    const usedBindings = extractImportedBindings(item.importPart).filter((binding) =>
      usedComponents.has(binding.localName),
    );

    if (usedBindings.length === 0) {
      continue;
    }

    const componentSources = resolveComponentSources(
      resolvedFile,
      usedBindings.map((binding) => binding.importedName),
    );

    for (const source of componentSources) {
      if (!components.has(source.filePath)) {
        components.set(source.filePath, {
          names: new Set<string>(),
          path: normalize(source.filePath),
          code: fs.readFileSync(source.filePath, 'utf8'),
          language: getLanguage(source.filePath),
        });
      }

      const component = components.get(source.filePath);

      if (!component) {
        continue;
      }

      for (const name of source.names) {
        component.names.add(name);
      }

      // Follow component dependencies through their own imports.
      scan(source.filePath);
    }
  }
}

const entryFile = resolveFile(path.resolve(ROOT, entryArg));

if (!entryFile) {
  console.error(`❌ Page not found: ${entryArg}`);

  process.exit(1);
}

scan(entryFile);

const pagePath = normalize(entryFile);

const pageCode = fs.readFileSync(entryFile, 'utf8');

const pageLanguage = getLanguage(entryFile);

let markdown = `# Page Context

## Page

**Path:** \`${pagePath}\`

\`\`\`${pageLanguage}
${pageCode}
\`\`\`

---

## Custom Components
`;

const sortedComponents = [...components.values()].sort((a, b) => a.path.localeCompare(b.path));

if (sortedComponents.length === 0) {
  markdown += `

No custom components found.
`;
} else {
  for (let index = 0; index < sortedComponents.length; index++) {
    const component = sortedComponents[index];

    const names = [...component.names].join(', ');

    markdown += `

### ${index + 1}. ${names}

**Path:** \`${component.path}\`

\`\`\`${component.language}
${component.code}
\`\`\`

---
`;
  }
}

markdown += `

## Summary

- Page: \`${pagePath}\`
- Custom component files: ${components.size}
- Total files included: ${components.size + 1}
`;

const outputPath = path.resolve(ROOT, outputArg);

fs.writeFileSync(outputPath, markdown, 'utf8');

console.log(`
✅ Page context generated

Page:
${pagePath}

Custom components:
${components.size}

Total files:
${components.size + 1}

Output:
${normalize(outputPath)}
`);
