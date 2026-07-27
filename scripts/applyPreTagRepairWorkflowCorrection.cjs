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
  'AGENTS.md',
  '- Ordinary feature, fix, refactor, docs, tooling, and agent PRs into `develop`, plus direct hotfix PRs into `main`, use squash merge.',
  '- Ordinary feature, fix, refactor, docs, tooling, and agent PRs into `develop`, plus direct hotfix and pre-tag repair PRs into `main`, use squash merge.',
);
replaceExact(
  'docs/release.md',
  'hotfix/* -> main -> develop',
  'hotfix/*, release-repair/* -> main -> develop when the change is main-only',
);
replaceExact(
  'docs/release.md',
  `- **Hotfix flow**: for a defect that must be fixed directly on the stable branch,
  branch from \`main\` as \`hotfix/<name>\`, open a PR into \`main\`, and squash merge
  after the release gate. After the hotfix ships, open the documented release
  sync-back PR into \`develop\` and merge it with a merge commit so the branches do
  not diverge.`,
  `- **Direct main repair flow**: for a defect in an already-published stable version,
  branch from \`main\` as \`hotfix/<name>\`. For an unpublished current-main release
  candidate, branch as \`release-repair/<name>\`. Open the PR into \`main\` and squash
  merge after the release gate. When the resulting commit is not already in
  \`develop\`, open the documented release sync-back PR into \`develop\` and merge it
  with a merge commit so the branches do not diverge.`,
);
replaceExact(
  'docs/release.md',
  'including `feature/`, `feat/`, `fix/`, `hotfix/`, `refactor/`, `docs/`, `chore/`, or `agent/`.',
  'including `feature/`, `feat/`, `fix/`, `hotfix/`, `release-repair/`, `refactor/`, `docs/`, `chore/`, or `agent/`.',
);
replaceExact(
  'docs/release.md',
  '- direct hotfix PRs into `main`: **squash merge**;',
  '- direct hotfix and pre-tag repair PRs into `main`: **squash merge**;',
);
replaceExact(
  'docs/release-checklist.md',
  `Use this checklist for every promotion of \`develop\` into \`main\`, and for
 every hotfix directly into \`main\`.`,
  `Use this checklist for every promotion of \`develop\` into \`main\`, direct
 hotfix, and pre-tag release repair into \`main\`.`,
);
replaceExact(
  'docs/release-checklist.md',
  `- [ ] \`package.json\` \`version\` is bumped above the version currently on
      \`main\`, following SemVer (\`docs/release.md#choosing-patch--minor--major\`).`,
  `- [ ] For a promotion or hotfix, \`package.json\` \`version\` is bumped above the
      version currently on \`main\`. A pre-tag repair may keep the current \`main\`
      version only while its matching tag does not exist.`,
);
replaceExact(
  'docs/release-checklist.md',
  '- [ ] Merge method is `merge commit` for `develop` -> `main` promotion PRs and `squash` for direct hotfix PRs.',
  '- [ ] Merge method is `merge commit` for `develop` -> `main` promotion PRs and `squash` for direct hotfix or pre-tag repair PRs.',
);
replaceExact(
  'docs/release-checklist.md',
  `## Hotfix-specific steps

- [ ] Branch from \`main\` as \`hotfix/<name>\`.
- [ ] Bump the version (PATCH unless the fix requires more).
- [ ] Follow the same PR-into-\`main\` and after-merge steps above.
- [ ] After the hotfix ships, open the documented \`main\` -> \`develop\` sync-back
      PR in the same release cycle and merge it with a merge commit.`,
  `## Direct-main repair steps

- [ ] For a published stable defect, branch from \`main\` as \`hotfix/<name>\` and
      bump the version (PATCH unless the fix requires more).
- [ ] For an unpublished current-main release candidate, branch as
      \`release-repair/<name>\`; keep the same version only while its matching tag
      does not exist.
- [ ] Follow the same PR-into-\`main\` and after-merge steps above.
- [ ] When the repair commit is not already in \`develop\`, open the documented
      \`main\` -> \`develop\` sync-back PR in the same release cycle and merge it
      with a merge commit.`,
);

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(__filename, { force: true });
