import fs from 'node:fs';
import path from 'node:path';

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

const ROOT = process.cwd();

const entryArg = process.argv[2];
const outputArg = process.argv[3] ?? 'page-context.md';

if (!entryArg) {
  console.error(`
Usage:
  bun scripts/page-context.ts <page-path> [output]

Examples:
  bun scripts/page-context.ts src/app/dashboard/page.tsx
  bun scripts/page-context.ts src/app/dashboard/page.tsx dashboard-context.md
`);

  process.exit(1);
}

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'] as const;

const visited = new Set<string>();

const components = new Map<string, ComponentInfo>();

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

  // Ignore external packages:
  // react
  // next
  // lucide-react
  // framer-motion
  // zustand
  // etc.
  return null;
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

function extractImportedNames(importPart: string): string[] {
  const names: string[] = [];

  // import Header from "./Header"
  const defaultMatch = importPart.match(/^([A-Za-z_$][\w$]*)/);

  if (defaultMatch && !importPart.startsWith('{') && !importPart.startsWith('*')) {
    names.push(defaultMatch[1]);
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

      if (!cleaned) {
        continue;
      }

      const aliasParts = cleaned.split(/\s+as\s+/);

      const localName = aliasParts[1]?.trim() ?? aliasParts[0]?.trim();

      if (localName) {
        names.push(localName);
      }
    }
  }

  // import * as UI from "./ui"
  const namespaceMatch = importPart.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);

  if (namespaceMatch) {
    names.push(namespaceMatch[1]);
  }

  return names;
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

    const importedNames = extractImportedNames(item.importPart);

    const usedNames = importedNames.filter((name) => usedComponents.has(name));

    if (usedNames.length === 0) {
      continue;
    }

    if (!components.has(resolvedFile)) {
      components.set(resolvedFile, {
        names: new Set<string>(),
        path: normalize(resolvedFile),
        code: fs.readFileSync(resolvedFile, 'utf8'),
        language: getLanguage(resolvedFile),
      });
    }

    const component = components.get(resolvedFile);

    if (!component) {
      continue;
    }

    for (const name of usedNames) {
      component.names.add(name);
    }

    // Recursive:
    //
    // Page
    // └── Component
    //     └── Child
    //         └── Child
    scan(resolvedFile);
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
