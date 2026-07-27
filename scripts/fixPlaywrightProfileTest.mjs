import fs from 'node:fs';

const filePath = 'scripts/playwrightContainer.test.mjs';
let source = fs.readFileSync(filePath, 'utf8');
const before = `  it('prints a project-level diagnostic for non-zero podman exits', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await withProcessEnv({ GITHUB_ACTIONS: 'false' }, async () => {`;
const after = `  it('prints a project-level diagnostic for non-zero podman exits', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await withProcessEnv(
        { GITHUB_ACTIONS: 'false', [VERIFY_PROFILE_ENV]: 'local' },
        async () => {`;

if (source.includes(before)) {
  source = source.replace(before, after);
  fs.writeFileSync(filePath, source, 'utf8');
  console.log('[playwright-profile-test-fix] isolated the expected local profile');
} else if (source.includes(after)) {
  console.log('[playwright-profile-test-fix] already applied');
} else {
  throw new Error('[playwright-profile-test-fix] unexpected test source');
}
