import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/abhishekmittal/Documents/Work/github/shuhari/open-source/rna-method';
const DOCS_SRC = join(ROOT, 'docs');
const DOCS_DEST = join(ROOT, 'docs-site/src/content/docs');

const migrations = [
  {
    src: 'getting-started.md',
    dest: 'getting-started.md',
    title: 'Getting Started',
    description: 'Set up your first RNA Method collective in approximately 30 minutes.',
  },
  {
    src: 'cross-platform-guide.md',
    dest: 'guides/cross-platform.md',
    title: 'Cross-Platform Guide',
    description: 'Implement the RNA + Pluribus pattern across different AI editors and operating systems.',
  },
  {
    src: 'failure-modes.md',
    dest: 'guides/failure-modes.md',
    title: 'Failure Modes',
    description: 'Documented failure patterns in RNA Method installations, with diagnosis and fixes.',
  },
  {
    src: 'base-agent-signal-hub.md',
    dest: 'concepts/base-agent-signal-hub.md',
    title: 'Base Agent Signal Hub',
    description: 'The _base-agent architecture — the hidden signal router every RNA collective shares.',
  },
  {
    src: 'context-compaction.md',
    dest: 'concepts/context-compaction.md',
    title: 'Context Compaction',
    description: 'Protocol for compressing long agent sessions into structured memory before closing.',
  },
  {
    src: 'schema-reference.md',
    dest: 'reference/schema-reference.md',
    title: 'Schema Reference',
    description: 'Complete annotated reference for rna-schema.json, the canonical source for all RNA Method configurations.',
  },
  {
    src: 'rna-commands.md',
    dest: 'reference/rna-commands.md',
    title: 'RNA Commands',
    description: 'In-session /rna.* directives for the RNA Method agent collective.',
  },
  {
    src: 'rna-folder-architecture.md',
    dest: 'reference/folder-architecture.md',
    title: 'Folder Architecture',
    description: 'Complete reference for the .rna/ folder structure and all canonical files.',
  },
  {
    src: 'research-paper.md',
    dest: 'research/research-paper.md',
    title: 'Research Paper',
    description: 'Reusable Neural Activators (RNA) and the Pluribus Agent Collective — the foundational research paper.',
  },
  {
    src: 'competitive-landscape.md',
    dest: 'research/competitive-landscape.md',
    title: 'Competitive Landscape',
    description: 'AI agent orchestration and spec-driven development frameworks — market analysis.',
  },
];

for (const { src, dest, title, description } of migrations) {
  const srcPath = join(DOCS_SRC, src);
  const destPath = join(DOCS_DEST, dest);

  // Ensure directory exists
  mkdirSync(destPath.replace(/\/[^/]+$/, ''), { recursive: true });

  // Read source, strip first H1 line
  const content = readFileSync(srcPath, 'utf8');
  const lines = content.split('\n');
  const firstH1Index = lines.findIndex(l => l.startsWith('# '));
  const bodyLines = firstH1Index >= 0 ? lines.slice(firstH1Index + 1) : lines;
  // Trim leading blank lines after the H1
  while (bodyLines.length > 0 && bodyLines[0].trim() === '') bodyLines.shift();

  const frontmatter = `---\ntitle: "${title}"\ndescription: "${description}"\n---\n\n`;
  writeFileSync(destPath, frontmatter + bodyLines.join('\n'));
  console.log(`✓ ${dest}`);
}

console.log('\nMigration complete!');
