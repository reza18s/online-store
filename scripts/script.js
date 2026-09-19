"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var ROOT = process.cwd();
var entryArg = process.argv[2];
var outputArg = (_a = process.argv[3]) !== null && _a !== void 0 ? _a : 'page-context.md';
if (!entryArg) {
    console.error("\nUsage:\n  bun scripts/page-context.ts <page-path> [output]\n\nExamples:\n  bun scripts/page-context.ts src/app/dashboard/page.tsx\n  bun scripts/page-context.ts src/app/dashboard/page.tsx dashboard-context.md\n");
    process.exit(1);
}
var EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];
var visited = new Set();
var components = new Map();
function normalize(filePath) {
    return node_path_1.default.relative(ROOT, filePath).replaceAll('\\', '/');
}
function getLanguage(filePath) {
    var ext = node_path_1.default.extname(filePath).slice(1);
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
function resolveFile(basePath) {
    if (node_fs_1.default.existsSync(basePath) && node_fs_1.default.statSync(basePath).isFile()) {
        return node_path_1.default.resolve(basePath);
    }
    for (var _i = 0, EXTENSIONS_1 = EXTENSIONS; _i < EXTENSIONS_1.length; _i++) {
        var ext = EXTENSIONS_1[_i];
        var target = basePath + ext;
        if (node_fs_1.default.existsSync(target)) {
            return node_path_1.default.resolve(target);
        }
    }
    if (node_fs_1.default.existsSync(basePath) && node_fs_1.default.statSync(basePath).isDirectory()) {
        for (var _a = 0, EXTENSIONS_2 = EXTENSIONS; _a < EXTENSIONS_2.length; _a++) {
            var ext = EXTENSIONS_2[_a];
            var target = node_path_1.default.join(basePath, "index".concat(ext));
            if (node_fs_1.default.existsSync(target)) {
                return node_path_1.default.resolve(target);
            }
        }
    }
    return null;
}
function resolveImport(importPath, currentFile) {
    // ./Header
    // ../components/Card
    if (importPath.startsWith('.')) {
        return resolveFile(node_path_1.default.resolve(node_path_1.default.dirname(currentFile), importPath));
    }
    // @/components/Button
    // Assumes @/ = src/
    if (importPath.startsWith('@/')) {
        return resolveFile(node_path_1.default.resolve(ROOT, 'src', importPath.slice(2)));
    }
    // ~/components/Button
    // Assumes ~/ = src/
    if (importPath.startsWith('~/')) {
        return resolveFile(node_path_1.default.resolve(ROOT, 'src', importPath.slice(2)));
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
function parseImports(content) {
    var imports = [];
    var regex = /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
    var match;
    while ((match = regex.exec(content))) {
        imports.push({
            importPart: match[1].trim(),
            source: match[2],
        });
    }
    return imports;
}
function extractImportedNames(importPart) {
    var _a, _b, _c;
    var names = [];
    // import Header from "./Header"
    var defaultMatch = importPart.match(/^([A-Za-z_$][\w$]*)/);
    if (defaultMatch && !importPart.startsWith('{') && !importPart.startsWith('*')) {
        names.push(defaultMatch[1]);
    }
    // import {
    //   Header,
    //   Card as ProductCard
    // } from "./components"
    var namedMatch = importPart.match(/\{([\s\S]*?)\}/);
    if (namedMatch) {
        var parts = namedMatch[1].split(',');
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            var cleaned = part.trim();
            if (!cleaned) {
                continue;
            }
            var aliasParts = cleaned.split(/\s+as\s+/);
            var localName = (_b = (_a = aliasParts[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_c = aliasParts[0]) === null || _c === void 0 ? void 0 : _c.trim();
            if (localName) {
                names.push(localName);
            }
        }
    }
    // import * as UI from "./ui"
    var namespaceMatch = importPart.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch) {
        names.push(namespaceMatch[1]);
    }
    return names;
}
function getUsedComponents(content) {
    var used = new Set();
    // Detect:
    // <Header />
    // <Header>
    // <UI.Button />
    var regex = /<([A-Z][A-Za-z0-9_$]*(?:\.[A-Za-z0-9_$]+)*)\b/g;
    var match;
    while ((match = regex.exec(content))) {
        var fullName = match[1];
        var rootName = fullName.split('.')[0];
        used.add(rootName);
    }
    return used;
}
function scan(filePath) {
    var absolute = node_path_1.default.resolve(filePath);
    if (visited.has(absolute)) {
        return;
    }
    visited.add(absolute);
    var content = node_fs_1.default.readFileSync(absolute, 'utf8');
    var imports = parseImports(content);
    var usedComponents = getUsedComponents(content);
    for (var _i = 0, imports_1 = imports; _i < imports_1.length; _i++) {
        var item = imports_1[_i];
        var resolvedFile = resolveImport(item.source, absolute);
        if (!resolvedFile) {
            continue;
        }
        var importedNames = extractImportedNames(item.importPart);
        var usedNames = importedNames.filter(function (name) { return usedComponents.has(name); });
        if (usedNames.length === 0) {
            continue;
        }
        if (!components.has(resolvedFile)) {
            components.set(resolvedFile, {
                names: new Set(),
                path: normalize(resolvedFile),
                code: node_fs_1.default.readFileSync(resolvedFile, 'utf8'),
                language: getLanguage(resolvedFile),
            });
        }
        var component = components.get(resolvedFile);
        if (!component) {
            continue;
        }
        for (var _a = 0, usedNames_1 = usedNames; _a < usedNames_1.length; _a++) {
            var name_1 = usedNames_1[_a];
            component.names.add(name_1);
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
var entryFile = resolveFile(node_path_1.default.resolve(ROOT, entryArg));
if (!entryFile) {
    console.error("\u274C Page not found: ".concat(entryArg));
    process.exit(1);
}
scan(entryFile);
var pagePath = normalize(entryFile);
var pageCode = node_fs_1.default.readFileSync(entryFile, 'utf8');
var pageLanguage = getLanguage(entryFile);
var markdown = "# Page Context\n\n## Page\n\n**Path:** `".concat(pagePath, "`\n\n```").concat(pageLanguage, "\n").concat(pageCode, "\n```\n\n---\n\n## Custom Components\n");
var sortedComponents = __spreadArray([], components.values(), true).sort(function (a, b) { return a.path.localeCompare(b.path); });
if (sortedComponents.length === 0) {
    markdown += "\n\nNo custom components found.\n";
}
else {
    for (var index = 0; index < sortedComponents.length; index++) {
        var component = sortedComponents[index];
        var names = __spreadArray([], component.names, true).join(', ');
        markdown += "\n\n### ".concat(index + 1, ". ").concat(names, "\n\n**Path:** `").concat(component.path, "`\n\n```").concat(component.language, "\n").concat(component.code, "\n```\n\n---\n");
    }
}
markdown += "\n\n## Summary\n\n- Page: `".concat(pagePath, "`\n- Custom component files: ").concat(components.size, "\n- Total files included: ").concat(components.size + 1, "\n");
var outputPath = node_path_1.default.resolve(ROOT, outputArg);
node_fs_1.default.writeFileSync(outputPath, markdown, 'utf8');
console.log("\n\u2705 Page context generated\n\nPage:\n".concat(pagePath, "\n\nCustom components:\n").concat(components.size, "\n\nTotal files:\n").concat(components.size + 1, "\n\nOutput:\n").concat(normalize(outputPath), "\n"));
