#!/usr/bin/env node

/**
 * ABOUTME: Compares upstream response-awareness framework with local customized versions
 * Usage: node scripts/compare-upstream.js v2.1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const UPSTREAM_BASE = '.claude/upstream-reference';
const LOCAL_SKILLS = '.claude/skills';
const LOCAL_COMMANDS = '.claude/commands';
const LOCAL_AGENTS = '.claude/agents';
const REPORTS_DIR = 'docs/reports';

// Parse command line arguments
const args = process.argv.slice(2);
const version = args[0];

if (!version) {
  console.error('Usage: node scripts/compare-upstream.js <version>');
  console.error('Example: node scripts/compare-upstream.js v2.1.0');
  process.exit(1);
}

const upstreamDir = path.join(UPSTREAM_BASE, `response-awareness-${version}`);

// Check if upstream directory exists
if (!fs.existsSync(upstreamDir)) {
  console.error(`\nError: Upstream directory not found: ${upstreamDir}`);
  console.error('\nDid you:');
  console.error(`1. Download response-awareness-${version}.zip from GitHub?`);
  console.error(`2. Unzip it to ${UPSTREAM_BASE}/response-awareness-${version}/`);
  console.error('\nSee UPDATE_GUIDE.md for instructions.');
  process.exit(1);
}

console.log('=== Response-Awareness Upstream Comparison ===\n');
console.log(`Comparing:`);
console.log(`  Upstream: ${upstreamDir}/`);
console.log(`  Local:    ${LOCAL_SKILLS}/, ${LOCAL_COMMANDS}/, ${LOCAL_AGENTS}/\n`);

// Results containers
const results = {
  modified: [],
  newInUpstream: [],
  deletedInUpstream: [],
  localOnly: [],
  identical: []
};

// Helper: Get all markdown files in a directory
function getMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      const subFiles = getMdFiles(path.join(dir, item.name));
      files.push(...subFiles.map(f => path.join(item.name, f)));
    } else if (item.name.endsWith('.md')) {
      files.push(item.name);
    }
  }

  return files;
}

// Helper: Compare two files
function compareFiles(upstreamPath, localPath) {
  if (!fs.existsSync(upstreamPath) || !fs.existsSync(localPath)) {
    return { identical: false, customizations: [] };
  }

  const upstreamContent = fs.readFileSync(upstreamPath, 'utf8');
  const localContent = fs.readFileSync(localPath, 'utf8');

  if (upstreamContent === localContent) {
    return { identical: true, customizations: [] };
  }

  // Identify customizations (lines in local not in upstream)
  const upstreamLines = upstreamContent.split('\n');
  const localLines = localContent.split('\n');

  const customizations = [];
  const lineNumbers = [];

  // Simple diff: find lines that differ
  const maxLines = Math.max(upstreamLines.length, localLines.length);
  let customizationBlock = null;

  for (let i = 0; i < maxLines; i++) {
    const upLine = upstreamLines[i] || '';
    const localLine = localLines[i] || '';

    if (upLine !== localLine) {
      if (!customizationBlock) {
        customizationBlock = { start: i + 1, lines: [] };
      }
      customizationBlock.lines.push(localLine);
      lineNumbers.push(i + 1);
    } else if (customizationBlock) {
      // End of customization block
      customizations.push({
        ...customizationBlock,
        end: i
      });
      customizationBlock = null;
    }
  }

  // Close final block
  if (customizationBlock) {
    customizations.push({
      ...customizationBlock,
      end: maxLines
    });
  }

  return { identical: false, customizations, lineNumbers };
}

// Compare skills/
console.log('Comparing skills/...\n');
const upstreamSkills = getMdFiles(path.join(upstreamDir, 'skills'));
const localSkills = getMdFiles(LOCAL_SKILLS);

const allSkills = new Set([...upstreamSkills, ...localSkills]);

for (const skillFile of allSkills) {
  const upstreamPath = path.join(upstreamDir, 'skills', skillFile);
  const localPath = path.join(LOCAL_SKILLS, skillFile);

  const upstreamExists = fs.existsSync(upstreamPath);
  const localExists = fs.existsSync(localPath);

  if (!upstreamExists && localExists) {
    // Local only (custom skill)
    results.localOnly.push({
      type: 'skill',
      file: skillFile,
      path: localPath
    });
  } else if (upstreamExists && !localExists) {
    // New in upstream
    results.newInUpstream.push({
      type: 'skill',
      file: skillFile,
      path: upstreamPath
    });
  } else {
    // Exists in both - compare
    const comparison = compareFiles(upstreamPath, localPath);

    if (comparison.identical) {
      results.identical.push({
        type: 'skill',
        file: skillFile
      });
    } else {
      results.modified.push({
        type: 'skill',
        file: skillFile,
        upstreamPath,
        localPath,
        customizations: comparison.customizations,
        lineNumbers: comparison.lineNumbers
      });
    }
  }
}

// Compare commands/
console.log('Comparing commands/...\n');
const upstreamCommands = getMdFiles(path.join(upstreamDir, 'commands'));
const localCommands = getMdFiles(LOCAL_COMMANDS);

const allCommands = new Set([...upstreamCommands, ...localCommands]);

for (const commandFile of allCommands) {
  const upstreamPath = path.join(upstreamDir, 'commands', commandFile);
  const localPath = path.join(LOCAL_COMMANDS, commandFile);

  const upstreamExists = fs.existsSync(upstreamPath);
  const localExists = fs.existsSync(localPath);

  if (!upstreamExists && localExists) {
    results.localOnly.push({
      type: 'command',
      file: commandFile,
      path: localPath
    });
  } else if (upstreamExists && !localExists) {
    results.newInUpstream.push({
      type: 'command',
      file: commandFile,
      path: upstreamPath
    });
  } else {
    const comparison = compareFiles(upstreamPath, localPath);

    if (comparison.identical) {
      results.identical.push({
        type: 'command',
        file: commandFile
      });
    } else {
      results.modified.push({
        type: 'command',
        file: commandFile,
        upstreamPath,
        localPath,
        customizations: comparison.customizations,
        lineNumbers: comparison.lineNumbers
      });
    }
  }
}

// Compare agents/
console.log('Comparing agents/...\n');
const upstreamAgents = fs.existsSync(path.join(upstreamDir, 'agents'))
  ? getMdFiles(path.join(upstreamDir, 'agents'))
  : [];
const localAgents = getMdFiles(LOCAL_AGENTS);

const allAgents = new Set([...upstreamAgents, ...localAgents]);

for (const agentFile of allAgents) {
  const upstreamPath = path.join(upstreamDir, 'agents', agentFile);
  const localPath = path.join(LOCAL_AGENTS, agentFile);

  const upstreamExists = fs.existsSync(upstreamPath);
  const localExists = fs.existsSync(localPath);

  if (!upstreamExists && localExists) {
    results.localOnly.push({
      type: 'agent',
      file: agentFile,
      path: localPath
    });
  } else if (upstreamExists && !localExists) {
    results.newInUpstream.push({
      type: 'agent',
      file: agentFile,
      path: upstreamPath
    });
  } else {
    const comparison = compareFiles(upstreamPath, localPath);

    if (comparison.identical) {
      results.identical.push({
        type: 'agent',
        file: agentFile
      });
    } else {
      results.modified.push({
        type: 'agent',
        file: agentFile,
        upstreamPath,
        localPath,
        customizations: comparison.customizations,
        lineNumbers: comparison.lineNumbers
      });
    }
  }
}

// Generate report
console.log('Generating report...\n');

let report = `# Upstream Comparison Report: ${version}\n\n`;
report += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
report += `**Upstream Version:** ${version}\n`;
report += `**Local Version:** (see .claude/config/response-awareness-config.json)\n\n`;

report += `---\n\n`;

// Modified files
if (results.modified.length > 0) {
  report += `## Modified Files (${results.modified.length})\n\n`;
  report += `These files exist in both upstream and local but have differences:\n\n`;

  for (const item of results.modified) {
    report += `### ${item.type}/${item.file}\n\n`;
    report += `**Upstream:** \`${item.upstreamPath}\`\n`;
    report += `**Local:** \`${item.localPath}\`\n\n`;

    if (item.lineNumbers.length > 0) {
      report += `**Differences detected at lines:** ${item.lineNumbers.slice(0, 10).join(', ')}`;
      if (item.lineNumbers.length > 10) {
        report += ` ... (${item.lineNumbers.length - 10} more)`;
      }
      report += `\n\n`;
    }

    report += `**Action Required:**\n`;
    report += `1. Review with: \`code --diff "${item.upstreamPath}" "${item.localPath}"\`\n`;
    report += `2. Identify upstream improvements vs local customizations\n`;
    report += `3. Manually merge improvements while preserving NextNest customizations\n\n`;
    report += `---\n\n`;
  }
}

// New in upstream
if (results.newInUpstream.length > 0) {
  report += `## New Files in Upstream (${results.newInUpstream.length})\n\n`;
  report += `These files exist in upstream but not in your local setup:\n\n`;

  for (const item of results.newInUpstream) {
    report += `- **${item.type}/${item.file}**\n`;
    report += `  - Path: \`${item.path}\`\n`;
    report += `  - Action: Review and consider adopting for NextNest\n\n`;
  }

  report += `---\n\n`;
}

// Deleted in upstream
if (results.deletedInUpstream.length > 0) {
  report += `## Deleted in Upstream (${results.deletedInUpstream.length})\n\n`;
  report += `These files exist locally but were removed from upstream:\n\n`;

  for (const item of results.deletedInUpstream) {
    report += `- **${item.type}/${item.file}**\n`;
    report += `  - Action: Decide if you still need this locally\n\n`;
  }

  report += `---\n\n`;
}

// Local only
if (results.localOnly.length > 0) {
  report += `## Local-Only Files (${results.localOnly.length})\n\n`;
  report += `These are your custom files not in upstream (this is expected):\n\n`;

  for (const item of results.localOnly) {
    report += `- **${item.type}/${item.file}**\n`;
    report += `  - Path: \`${item.path}\`\n`;
    report += `  - Note: Keep these - they're NextNest customizations\n\n`;
  }

  report += `---\n\n`;
}

// Identical
if (results.identical.length > 0) {
  report += `## Identical Files (${results.identical.length})\n\n`;
  report += `These files are identical to upstream (no changes needed):\n\n`;

  for (const item of results.identical) {
    report += `- ${item.type}/${item.file}\n`;
  }

  report += `\n---\n\n`;
}

// Summary
report += `## Summary\n\n`;
report += `| Category | Count |\n`;
report += `|----------|-------|\n`;
report += `| Modified (review needed) | ${results.modified.length} |\n`;
report += `| New in upstream (consider adopting) | ${results.newInUpstream.length} |\n`;
report += `| Deleted in upstream | ${results.deletedInUpstream.length} |\n`;
report += `| Local-only (keep) | ${results.localOnly.length} |\n`;
report += `| Identical (no action) | ${results.identical.length} |\n\n`;

// Recommendations
report += `## Recommendations\n\n`;

if (results.modified.length > 0) {
  report += `1. **Review ${results.modified.length} modified files** for upstream improvements\n`;
  report += `   - Use diff tool to compare side-by-side\n`;
  report += `   - Adopt bug fixes and improvements\n`;
  report += `   - Preserve NextNest customizations (config loading, worktrees, etc.)\n\n`;
}

if (results.newInUpstream.length > 0) {
  report += `2. **Evaluate ${results.newInUpstream.length} new upstream files**\n`;
  report += `   - Review each for usefulness to NextNest\n`;
  report += `   - Adopt if beneficial, ignore if not applicable\n\n`;
}

report += `3. **Preserve ${results.localOnly.length} local-only files** (these are your customizations)\n\n`;

report += `4. **After merging:**\n`;
report += `   - Update \`.claude/config/response-awareness-config.json\` upstream_version to "${version}"\n`;
report += `   - Test: \`/response-awareness "test task"\`\n`;
report += `   - Document changes in \`docs/work-log.md\`\n\n`;

// Write report
const reportPath = path.join(REPORTS_DIR, `upstream-comparison-${version}.md`);

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

fs.writeFileSync(reportPath, report, 'utf8');

console.log(`✅ Report generated: ${reportPath}\n`);

// Print summary to console
console.log('=== Summary ===\n');
console.log(`Modified files (review needed): ${results.modified.length}`);
console.log(`New in upstream (consider): ${results.newInUpstream.length}`);
console.log(`Local-only (keep): ${results.localOnly.length}`);
console.log(`Identical (no action): ${results.identical.length}\n`);

if (results.modified.length > 0) {
  console.log('⚠️  ACTION REQUIRED: Review modified files');
  console.log(`See detailed report: ${reportPath}\n`);
} else {
  console.log('✅ No modified files - your local version is up to date!\n');
}

console.log(`Next steps:`);
console.log(`1. Read the report: cat "${reportPath}"`);
console.log(`2. Review each modified file using diff tool`);
console.log(`3. Manually merge improvements`);
console.log(`4. Update config/response-awareness-config.json upstream_version`);
console.log(`5. Test: /response-awareness "test task"\n`);
