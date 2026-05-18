#!/usr/bin/env node
import { createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { cp, mkdtemp, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { pipeline } from 'node:stream/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const [, , archivePathArg, outputPathArg = 'src/shared/ui/material3'] = process.argv;

if (!archivePathArg) {
  console.error('Usage: node scripts/import-material3-docs.mjs <material3-markdown-docs.zip> [output-dir]');
  process.exit(1);
}

const extractRoot = await mkdtemp(join(tmpdir(), 'material3-docs-'));
const outputRoot = outputPathArg;
const sourceRoot = join(outputRoot, 'source');

const unzipper = require('unzipper');

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

await pipeline(
  await import('node:fs').then(({ createReadStream }) => createReadStream(archivePathArg)),
  unzipper.Extract({ path: extractRoot }),
);

const listFiles = async (root) => {
  const result = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir)) {
      const path = join(dir, entry);
      const info = await stat(path);
      if (info.isDirectory()) {
        await walk(path);
      } else {
        result.push(path);
      }
    }
  };
  await walk(root);
  return result.sort();
};

const files = await listFiles(extractRoot);
const markdownOrManifestFiles = files.filter((file) => /\.(md|json|csv)$/u.test(file));

for (const file of markdownOrManifestFiles) {
  const rel = relative(extractRoot, file);
  const target = join(sourceRoot, rel);
  mkdirSync(dirname(target), { recursive: true });
  await cp(file, target);
}

const componentFiles = markdownOrManifestFiles
  .map((file) => relative(extractRoot, file))
  .filter((rel) => rel.startsWith('components/') && rel.endsWith('.md'));

const componentSlugs = [...new Set(componentFiles.map((rel) => rel.split('/')[1]).filter(Boolean))].sort();
const componentRows = [];

const titleFromSlug = (slug) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

for (const slug of componentSlugs) {
  const componentDir = join(outputRoot, 'components', slug);
  mkdirSync(componentDir, { recursive: true });

  const copied = [];
  const landing = `components/${slug}.md`;
  if (componentFiles.includes(landing)) {
    await cp(join(extractRoot, landing), join(componentDir, 'index.md'));
    copied.push('index.md');
  }

  for (const rel of componentFiles.filter((file) => file.startsWith(`components/${slug}/`)).sort()) {
    const targetRel = rel.split('/').slice(2).join('/');
    const target = join(componentDir, targetRel);
    mkdirSync(dirname(target), { recursive: true });
    await cp(join(extractRoot, rel), target);
    copied.push(targetRel);
  }

  const title = titleFromSlug(slug);
  componentRows.push([slug, title, copied.length]);

  const readme = [
    `# ${title}`,
    '',
    `Canonical Material 3 documentation copied from \`source/components/${slug}\`.`,
    '',
    '## Pages',
    '',
    ...copied.map((page) => `- [${page}](./${page})`),
    '',
    '## Implementation status',
    '',
    '- Status: intentionally not inferred by this generated documentation bundle.',
    '- When implementing or refactoring the component, compare the project primitive with every page in this folder: overview, specs, guidelines, accessibility, and any extra pages present for this component.',
    '',
  ].join('\n');
  await writeFile(join(componentDir, 'README.md'), readme);
}

for (const top of ['foundations', 'styles', 'develop', 'libraries', 'google-material-3', 'm3']) {
  for (const file of markdownOrManifestFiles) {
    const rel = relative(extractRoot, file);
    if (!rel.startsWith(`${top}/`) || !rel.endsWith('.md')) continue;
    const target = join(outputRoot, rel);
    mkdirSync(dirname(target), { recursive: true });
    await cp(file, target);
  }
}

await writeFile(
  join(outputRoot, 'README.md'),
  `# Material 3 documentation\n\nThis directory is the project-local source of truth for Material Design 3 UI work.\n\nThe files are generated from the provided \`material3-markdown-docs.zip\` archive and preserve the original markdown content. Do not replace these rules with summaries when reviewing or implementing components.\n\n## How to use\n\n- Use \`components/<component>/\` when implementing or reviewing a specific Material component.\n- Use \`styles/\` for color, typography, elevation, icons, motion, and shape rules.\n- Use \`foundations/\` for accessibility, adaptive design, layout, content design, tokens, interaction states, and usability.\n- Use \`source/\` when an exact original path from the imported archive is needed.\n\n## Component implementation rule\n\nEvery shared Material-style primitive should have a direct documentation reference to the matching folder in \`components/\`. If a Material component is not implemented yet, its folder still stays here so future work has a canonical target.\n\n## Update rule\n\nWhen the upstream Material 3 markdown export is refreshed, regenerate this directory from the new archive and review diffs instead of manually editing copied source pages.\n`,
);

await writeFile(
  join(outputRoot, 'COMPONENTS.md'),
  ['# Material 3 component index', '', '| Component | Documentation | Pages |', '| --- | --- | --- |', ...componentRows.map(([slug, title, count]) => `| ${title} | [components/${slug}/](./components/${slug}/README.md) | ${count} |`), ''].join('\n'),
);

await writeFile(
  join(outputRoot, 'AGENTS.md'),
  `# src/shared/ui/material3\n\nInherits the rules from \`src/shared/ui/AGENTS.md\`. Applies to the local Material 3 documentation source of truth.\n\n## Contains\n\n- Exact markdown documentation imported from the provided Material 3 documentation archive.\n- Component documentation folders for all Material 3 components present in the archive, including components not yet implemented in the project UI library.\n- Foundation and style documentation used to verify tokens, typography, layout, accessibility, adaptive behavior, motion, shape, elevation, and interaction states.\n\n## Patterns\n\n- Treat these files as reference documentation, not as app content.\n- When implementing or refactoring a shared \`MD*\` primitive, read the matching \`components/<component>/\` folder before changing API, DOM, tokens, states, accessibility, or layout.\n- Prefer links from implementation docs or PR notes to these local files instead of relying on memory or approximate Material rules.\n- Preserve original imported markdown content unless regenerating from a newer Material 3 export.\n\n## Anti-patterns\n\n- Do not summarize over these files and delete the original rules.\n- Do not use these docs as runtime user-facing help content.\n- Do not manually patch copied Material source pages for project preferences; document project-specific divergence outside copied source pages.\n\n## Constraints\n\n- If a copied source page appears wrong because of import/conversion quality, fix the importer or regenerate from a better source rather than silently editing one page.\n`,
);

console.log(`Imported ${markdownOrManifestFiles.length} source files and ${componentSlugs.length} component folders into ${outputRoot}`);
