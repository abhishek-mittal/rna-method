#!/usr/bin/env node

/**
 * RNA Method — Version Bump
 *
 * Bumps the RNA Method version in schema/rna-schema.json and prepends a new
 * section to CHANGELOG.md.
 *
 * Usage:
 *   node tools/version-bump.js patch            — 1.0.0 → 1.0.1
 *   node tools/version-bump.js minor            — 1.0.0 → 1.1.0
 *   node tools/version-bump.js major            — 1.0.0 → 2.0.0
 *   node tools/version-bump.js --dry-run patch  — show what would change, write nothing
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Colors (same pattern as init.js) ────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  red:    '\x1b[31m',
};

const c = (k, t) => `${C[k]}${t}${C.reset}`;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOT           = process.cwd();
const SCHEMA_PATH    = path.join(ROOT, 'schema', 'rna-schema.json');
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md');

const argv    = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const BUMP    = argv.filter(a => !a.startsWith('--'))[0] ?? '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bumpVersion(current, type) {
  const parts = current.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: "${current}". Expected x.y.z format.`);
  }
  switch (type) {
    case 'patch': parts[2]++;                            break;
    case 'minor': parts[1]++; parts[2] = 0;             break;
    case 'major': parts[0]++; parts[1] = 0; parts[2] = 0; break;
    default: throw new Error(`Unknown bump type: "${type}". Use patch, minor, or major.`);
  }
  return parts.join('.');
}

function buildChangelogEntry(version) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    `## [${version}] — ${date}`,
    '',
    '### Added',
    '- ',
    '',
    '### Changed',
    '- ',
    '',
    '### Fixed',
    '- ',
    '',
    '',
  ].join('\n');
}

function insertChangelogEntry(existing, entry) {
  // Insert after the preamble separator (---) that appears before the first ## entry
  const SEP = '\n---\n\n';
  const idx = existing.indexOf(SEP);
  if (idx !== -1) {
    const after = idx + SEP.length;
    return existing.slice(0, after) + entry + existing.slice(after);
  }
  // Fallback: insert after the first blank line following the title line
  const blankLine = existing.indexOf('\n\n');
  if (blankLine !== -1) {
    const after = blankLine + 2;
    return existing.slice(0, after) + entry + existing.slice(after);
  }
  return existing + '\n' + entry;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!['patch', 'minor', 'major'].includes(BUMP)) {
    console.log(c('yellow', '\n  Usage: node tools/version-bump.js [--dry-run] <patch|minor|major>\n'));
    console.log(`  Examples:`);
    console.log(`    ${c('cyan', 'node tools/version-bump.js patch')}`);
    console.log(`    ${c('cyan', 'node tools/version-bump.js --dry-run minor')}\n`);
    process.exit(1);
  }

  // ── Read schema ─────────────────────────────────────────────────────────────

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  } catch (e) {
    console.error(c('red', `\n  Cannot read schema/rna-schema.json: ${e.message}\n`));
    process.exit(1);
  }

  const currentVersion = schema.rnaVersion ?? schema.version;
  if (!currentVersion) {
    console.error(c('red', '\n  No version field found in schema/rna-schema.json.\n'));
    console.error('  Expected field: "rnaVersion" or "version".\n');
    process.exit(1);
  }

  const nextVersion = bumpVersion(currentVersion, BUMP);

  // ── Read changelog ───────────────────────────────────────────────────────────

  let changelogContent = '';
  try {
    changelogContent = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  } catch {
    changelogContent = '# Changelog\n\n---\n\n';
  }

  const newEntry    = buildChangelogEntry(nextVersion);
  const newChangelog = insertChangelogEntry(changelogContent, newEntry);

  // ── Print summary ────────────────────────────────────────────────────────────

  console.log('');
  console.log(`  ${c('bold', 'Version bump')}: ${c('yellow', currentVersion)} → ${c('green', nextVersion)}`);
  console.log(`  ${c('bold', 'Type')}:         ${BUMP}`);
  console.log(`  ${c('bold', 'Files')}:`);
  console.log(`    schema/rna-schema.json  — rnaVersion / version field`);
  console.log(`    CHANGELOG.md            — prepend ## [${nextVersion}] section`);

  if (DRY_RUN) {
    console.log(c('yellow', '\n  [dry-run] No files written.\n'));
    return;
  }

  // ── Write schema ─────────────────────────────────────────────────────────────

  if ('rnaVersion' in schema) {
    schema.rnaVersion = nextVersion;
  } else {
    schema.version = nextVersion;
  }
  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(schema, null, 2) + '\n', 'utf8');

  // ── Write changelog ──────────────────────────────────────────────────────────

  fs.writeFileSync(CHANGELOG_PATH, newChangelog, 'utf8');

  console.log(c('green', '\n  ✓ Version bumped successfully.\n'));
}

try {
  main();
} catch (err) {
  console.error(c('red', `\n  Error: ${err.message}\n`));
  process.exit(1);
}
