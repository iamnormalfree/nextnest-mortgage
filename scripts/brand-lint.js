#!/usr/bin/env node
/*
  NextNest Brand Lint
  - Fails if legacy hex colors or disallowed Tailwind gray/green utilities are used.
  - Ignores tailwind.config.ts and node_modules/.next directories.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INCLUDE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.mdx']);
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', '.vercel']);
const IGNORE_FILES = new Set([
  path.join('tailwind.config.ts'),
  path.join('scripts', 'brand-lint.js'),
]);

const bannedPatterns = [
  { name: 'legacy-hex-0D1B2A', regex: /#0D1B2A\b/i },
  { name: 'legacy-hex-4A90E2', regex: /#4A90E2\b/i },
  { name: 'legacy-hex-3A80D2', regex: /#3A80D2\b/i },
  { name: 'legacy-hex-F5F7FA', regex: /#F5F7FA\b/i },
  { name: 'legacy-hex-FAF9F8', regex: /#FAF9F8\b/i },
  // Tailwind gray utilities
  { name: 'tailwind-text-gray', regex: /\btext-gray-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-bg-gray', regex: /\bbg-gray-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-border-gray', regex: /\bborder-gray-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  // Non-brand greens used previously
  { name: 'tailwind-text-green', regex: /\btext-green-(?:500|600|700)\b/ },
  { name: 'tailwind-bg-green', regex: /\bbg-green-(?:50|100|200)\b/ },
  { name: 'hover-bg-gray-50', regex: /\bhover:bg-gray-50\b/ },
  // Legacy custom palette utilities (from old Tailwind config): primary/dark/light
  { name: 'tailwind-text-primary', regex: /\btext-primary-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-bg-primary', regex: /\bbg-primary-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-border-primary', regex: /\bborder-primary-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-text-dark', regex: /\btext-dark-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-bg-dark', regex: /\bbg-dark-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-border-dark', regex: /\bborder-dark-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-text-light', regex: /\btext-light-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-bg-light', regex: /\bbg-light-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  { name: 'tailwind-border-light', regex: /\bborder-light-(?:50|100|200|300|400|500|600|700|800|900)\b/ },
  // Inline rgba in JSX styles (encourage CSS vars or Tailwind opacity utilities)
  { name: 'inline-rgba-style', regex: /style={{[^}]*rgba\(/ },
];

const findings = [];

function scanFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  // Check multiple path formats for Windows compatibility
  if (IGNORE_FILES.has(rel) || IGNORE_FILES.has(path.normalize(rel)) || rel.endsWith('brand-lint.js')) return;
  const ext = path.extname(filePath);
  if (!INCLUDE_EXTS.has(ext)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    bannedPatterns.forEach(({ name, regex }) => {
      if (regex.test(line)) {
        findings.push({ file: rel, line: idx + 1, rule: name, snippet: line.trim().slice(0, 200) });
      }
    });
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) scanFile(full);
  }
}

walk(ROOT);

if (findings.length) {
  console.error('\nBrand Lint: Found disallowed color usage:');
  for (const f of findings) {
    console.error(`- [${f.rule}] ${f.file}:${f.line} -> ${f.snippet}`);
  }
  console.error(`\nTotal issues: ${findings.length}`);
  process.exit(1);
} else {
  console.log('Brand Lint: No disallowed colors found.');
}
