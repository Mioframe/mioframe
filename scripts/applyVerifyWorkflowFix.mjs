import fs from 'node:fs';

const filePath = 'scripts/verify.mjs';
let source = fs.readFileSync(filePath, 'utf8');

function replaceOnce(label, before, after) {
  const firstIndex = source.indexOf(before);

  if (firstIndex === -1) {
    throw new Error(`[verify-workflow-fix] missing expected ${label} source`);
  }

  if (source.indexOf(before, firstIndex + before.length) !== -1) {
    throw new Error(`[verify-workflow-fix] expected exactly one ${label} source`);
  }

  source = source.replace(before, after);
}

replaceOnce(
  'module mode globals',
  `const isFixMode = currentVerifyInvocation?.fixMode === 'fix';
const isFixOnlyMode = currentVerifyInvocation?.fixMode === 'fix-only';
const isVerboseMode = currentVerifyInvocation?.verbose ?? false;
const isFullMode = currentVerifyInvocation?.scope.kind === 'full';
const shouldApplyFixers = isFixMode || isFixOnlyMode;`,
  `const isVerboseMode = currentVerifyInvocation?.verbose ?? false;
const isFullMode = currentVerifyInvocation?.scope.kind === 'full';`,
);

replaceOnce(
  'runCommand signature',
  `async function runCommand(label, command, args, extraEnv = {}) {`,
  `async function runCommand(label, command, args, extraEnv = {}, verboseMode = isVerboseMode) {`,
);
source = source.replaceAll('if (isVerboseMode) {', 'if (verboseMode) {');

replaceOnce(
  'buildCommands signature',
  `export function buildCommands(
  changedFiles,
  { fullMode = isFullMode, packageJsonOldRef = null } = {},
) {`,
  `export function buildCommands(
  changedFiles,
  {
    fullMode = isFullMode,
    packageJsonOldRef = null,
    fixMode = currentVerifyInvocation?.fixMode ?? 'none',
    appE2EPlan: appE2EPlanOverride = null,
    storybookBehaviorPlan: storybookBehaviorPlanOverride = null,
  } = {},
) {
  const applyFixers = fixMode === 'fix' || fixMode === 'fix-only';
  const fixOnlyMode = fixMode === 'fix-only';`,
);

replaceOnce(
  'app plan resolution',
  `  const appE2EPlan = resolveAppE2EPlan(changedFiles, { packageJsonOldRef });
  const storybookBehaviorPlan = resolveStorybookBehaviorPlan(changedFiles, { packageJsonOldRef });`,
  `  const appE2EPlan =
    appE2EPlanOverride ?? resolveAppE2EPlan(changedFiles, { packageJsonOldRef });
  const storybookBehaviorPlan =
    storybookBehaviorPlanOverride ??
    resolveStorybookBehaviorPlan(changedFiles, { packageJsonOldRef });`,
);

source = source.replaceAll('shouldApplyFixers', 'applyFixers');
replaceOnce('fix-only early return', '  if (isFixOnlyMode) {', '  if (fixOnlyMode) {');

replaceOnce(
  'app e2e full invalid ordering',
  `  if (fullMode) {
    addE2ECommands(commands, createE2ECommand([], 'full-project release verification'));
  } else if (appE2EPlan.mode === 'invalid') {
    commands.push(createE2EInstallCommand('app e2e scope is invalid; e2e check fails closed'));
    commands.push({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: \`invalid app e2e scenario registry state: \${appE2EPlan.reasons.join('; ')}\`,
    });
  } else if (appE2EPlan.mode === 'full') {`,
  `  if (appE2EPlan.mode === 'invalid') {
    commands.push(createE2EInstallCommand('app e2e scope is invalid; e2e check fails closed'));
    commands.push({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: \`invalid app e2e scenario registry state: \${appE2EPlan.reasons.join('; ')}\`,
    });
  } else if (fullMode) {
    addE2ECommands(commands, createE2ECommand([], 'full-project release verification'));
  } else if (appE2EPlan.mode === 'full') {`,
);

replaceOnce(
  'storybook full invalid ordering',
  `  if (fullMode) {
    commands.push(createStorybookBehaviorCommand([], 'full-project release verification'));
  } else if (storybookBehaviorPlan.mode === 'invalid') {
    commands.push({
      kind: 'failed',
      label: 'storybook-behavior',
      command: 'pnpm test:storybook-behavior',
      reason: \`invalid Storybook behavior scenario registry state: \${storybookBehaviorPlan.reasons.join('; ')}\`,
    });
  } else if (storybookBehaviorPlan.mode === 'full') {`,
  `  if (storybookBehaviorPlan.mode === 'invalid') {
    commands.push({
      kind: 'failed',
      label: 'storybook-behavior',
      command: 'pnpm test:storybook-behavior',
      reason: \`invalid Storybook behavior scenario registry state: \${storybookBehaviorPlan.reasons.join('; ')}\`,
    });
  } else if (fullMode) {
    commands.push(createStorybookBehaviorCommand([], 'full-project release verification'));
  } else if (storybookBehaviorPlan.mode === 'full') {`,
);

replaceOnce(
  'selectOnlyCommands invocation ownership',
  `function selectOnlyCommands(commands) {
  if (cliOnlyLabel === null) {
    return commands;
  }

  const selectedCommands = commands.filter((entry) => entry.label === cliOnlyLabel);`,
  `function selectOnlyCommands(commands, onlyLabel = cliOnlyLabel) {
  if (onlyLabel === null) {
    return commands;
  }

  const selectedCommands = commands.filter((entry) => entry.label === onlyLabel);`,
);
source = source.replace(
  `  if (cliOnlyLabel === 'e2e-install') {`,
  `  if (onlyLabel === 'e2e-install') {`,
);
source = source.replace(
  '  throw new Error(`Verify command list is missing required label: ${cliOnlyLabel}`);',
  '  throw new Error(`Verify command list is missing required label: ${onlyLabel}`);',
);

replaceOnce(
  'summary invocation ownership',
  `export function printSummary(changedFiles, scope, results, options = {}) {
  const hasFailed = results.some((result) => result.status === 'failed');
  const processEnv = options.processEnv ?? getVerifyProcessEnv(process.env);
  const ciProfileRisk = options.ciProfileRisk ?? getCiProfileRisk(results, processEnv);`,
  `export function printSummary(changedFiles, scope, results, options = {}) {
  const invocation = options.invocation ?? currentVerifyInvocation;
  const hasFailed = results.some((result) => result.status === 'failed');
  const processEnv = options.processEnv ?? getVerifyProcessEnv(process.env, invocation.profile);
  const ciProfileRisk = options.ciProfileRisk ?? getCiProfileRisk(results, processEnv);`,
);
replaceOnce(
  'summary action and mode',
  `  const actionRequired = getActionRequired(results, {
    ciProfileRisk,
    invocation: options.invocation ?? currentVerifyInvocation,
  });
  const mode = isFixOnlyMode ? 'fix-only' : isFixMode ? 'fix' : 'check';`,
  `  const actionRequired = getActionRequired(results, { ciProfileRisk, invocation });
  const fullMode = invocation.scope.kind === 'full';
  const mode = invocation.fixMode === 'none' ? 'check' : invocation.fixMode;`,
);
replaceOnce(
  'summary invocation fields',
  `  console.log(\`release: \${isFullMode ? 'full-project (pnpm verify --full)' : 'off'}\`);
  console.log(\`verbose: \${isVerboseMode ? 'on' : 'off'}\`);
  console.log(\`only: \${cliOnlyLabel ?? 'all'}\`);
  console.log(\`scope: \${isFullMode ? 'full-project (changed-file scope ignored)' : scope}\`);`,
  `  console.log(\`release: \${fullMode ? 'full-project (pnpm verify --full)' : 'off'}\`);
  console.log(\`verbose: \${invocation.verbose ? 'on' : 'off'}\`);
  console.log(\`only: \${invocation.onlyLabel ?? 'all'}\`);
  console.log(\`scope: \${fullMode ? 'full-project (changed-file scope ignored)' : scope}\`);`,
);

replaceOnce(
  'main invocation ownership',
  `async function main(verifyLockEnv = {}, verifyLockController = { updateMetadata: () => {} }) {
  const verifyProcessEnv = getVerifyProcessEnv(process.env);
  const { changedFiles, scope, baseRef, packageJsonOldRef } =
    resolveVerifyChangedPathContext(currentVerifyInvocation);
  const commands = selectOnlyCommands(buildCommands(changedFiles, { packageJsonOldRef }));`,
  `async function main(
  verifyLockEnv = {},
  verifyLockController = { updateMetadata: () => {} },
  invocation = currentVerifyInvocation,
) {
  const onlyLabel = invocation.onlyLabel;
  const verifyProcessEnv = getVerifyProcessEnv(process.env, invocation.profile);
  const { changedFiles, scope, baseRef, packageJsonOldRef } =
    resolveVerifyChangedPathContext(invocation);
  const commands = selectOnlyCommands(
    buildCommands(changedFiles, {
      fullMode: invocation.scope.kind === 'full',
      packageJsonOldRef,
      fixMode: invocation.fixMode,
    }),
    onlyLabel,
  );`,
);
source = source.replace(
  `  ensureLogsDirectory(cliOnlyLabel === null ? null : commands.map((entry) => entry.label));`,
  `  ensureLogsDirectory(onlyLabel === null ? null : commands.map((entry) => entry.label));`,
);
source = source.replace(
  `    if (cliOnlyLabel === null) {`,
  `    if (onlyLabel === null) {`,
);
source = source.replaceAll(
  `            }),
          ),`,
  `            }),
            invocation.verbose,
          ),`,
);
source = source.replace(
  `        buildCommandEnv(entry, results, {
          verifyLockEnv,
          verifyProcessEnv,
        }),
      );`,
  `        buildCommandEnv(entry, results, {
          verifyLockEnv,
          verifyProcessEnv,
        }),
        invocation.verbose,
      );`,
);
source = source.replace(
  `    invocation: currentVerifyInvocation,`,
  `    invocation,`,
);

replaceOnce(
  'runMain invocation forwarding',
  `  await withVerifyLock(getVerifyLockMetadata(invocation), (verifyLockEnv, verifyLockController) =>
    runMain(verifyLockEnv, verifyLockController),
  );`,
  `  await withVerifyLock(getVerifyLockMetadata(invocation), (verifyLockEnv, verifyLockController) =>
    runMain(verifyLockEnv, verifyLockController, invocation),
  );`,
);

fs.writeFileSync(filePath, source, 'utf8');
console.log('[verify-workflow-fix] updated scripts/verify.mjs');
