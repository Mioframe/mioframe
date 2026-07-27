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
  'docs/release-checklist.md',
  `Use this checklist for every promotion of \`develop\` into \`main\`, and for
every hotfix directly into \`main\`. See \`docs/release.md\` for the full policy
this checklist enforces.`,
  `Use this checklist for every promotion of \`develop\` into \`main\`, direct
hotfix, and pre-tag release repair into \`main\`. See \`docs/release.md\` for the
full policy this checklist enforces.`,
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
