const fs = require('node:fs');

function replaceExact(path, oldText, newText) {
  const source = fs.readFileSync(path, 'utf8');
  const first = source.indexOf(oldText);
  const last = source.lastIndexOf(oldText);

  if (first === -1 || first !== last) {
    throw new Error(`Expected exactly one match in ${path}: ${JSON.stringify(oldText)}`);
  }

  fs.writeFileSync(
    path,
    source.slice(0, first) + newText + source.slice(first + oldText.length),
    'utf8',
  );
}

replaceExact(
  'docs/release.md',
  `feature/* -> develop -> main
fix/*, hotfix/* -> main -> develop`,
  `feature/*, feat/*, fix/*, refactor/*, docs/*, chore/*, agent/* -> develop -> main
hotfix/* -> main -> develop`,
);
replaceExact(
  'docs/release.md',
  `- **Feature flow**: branch from \`develop\` as \`feature/<name>\`, open a PR into
  \`develop\`. When \`develop\` is ready to ship, open a promotion PR from
  \`develop\` into \`main\`.
- **Hotfix flow**: for a defect that must be fixed directly on the stable
  branch, branch from \`main\` as \`fix/<name>\` or \`hotfix/<name>\`, open a PR
  into \`main\`. After the hotfix ships, merge the same change back into
  \`develop\` (a release sync-back PR, see below) so the two branches do not
  diverge.`,
  `- **Development flow**: branch from \`develop\` with a descriptive prefix, open a PR
  into \`develop\`, and squash merge after current-head review and verification. When
  \`develop\` is ready to ship, open a promotion PR from \`develop\` into \`main\`.
- **Hotfix flow**: for a defect that must be fixed directly on the stable branch,
  branch from \`main\` as \`hotfix/<name>\`, open a PR into \`main\`, and squash merge
  after the release gate. After the hotfix ships, open the documented release
  sync-back PR into \`develop\` and merge it with a merge commit so the branches do
  not diverge.`,
);
replaceExact(
  'docs/release.md',
  '`Merge strategy for develop <-> main synchronization` above',
  '`Merge strategy` above',
);
replaceExact(
  'docs/release-checklist.md',
  '- [ ] Branch from `main` as `fix/<name>` or `hotfix/<name>`.',
  '- [ ] Branch from `main` as `hotfix/<name>`.',
);
replaceExact(
  'docs/release-checklist.md',
  `- [ ] After the hotfix ships, merge it back into \`develop\` in the same PR
      cycle so \`develop\` does not silently regress.`,
  `- [ ] After the hotfix ships, open the documented \`main\` -> \`develop\` sync-back
      PR in the same release cycle and merge it with a merge commit.`,
);

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(__filename, { force: true });
