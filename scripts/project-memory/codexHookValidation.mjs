const supportedHookEvents = new Set([
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Stop',
]);

const requiredRepoHookEvents = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'Stop'];

const parseCodexHooksEnabled = (configContent) => {
  const hasFeaturesTable = /^\s*\[features\]\s*$/mu.test(configContent);
  const hasHooksTrue = /^\s*codex_hooks\s*=\s*true\s*$/mu.test(configContent);
  const hasHooksFalse = /^\s*codex_hooks\s*=\s*false\s*$/mu.test(configContent);

  return {
    hasFeaturesTable,
    codexHooksEnabled: hasHooksTrue ? true : hasHooksFalse ? false : undefined,
  };
};

const validateEnabledHooksJson = (rawHooksConfig, { errors, warnings }) => {
  const hooks = rawHooksConfig?.hooks;

  if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
    errors.push('.codex/hooks.json: top-level hooks object is required');
    return;
  }

  Object.entries(hooks).forEach(([eventName, matcherGroups]) => {
    if (!supportedHookEvents.has(eventName)) {
      errors.push(
        `.codex/hooks.json: unsupported hook event "${eventName}" (supported: ${[
          ...supportedHookEvents,
        ].join(', ')})`,
      );
      return;
    }

    if (!Array.isArray(matcherGroups) || matcherGroups.length === 0) {
      errors.push(`.codex/hooks.json: ${eventName} must be a non-empty array of matcher groups`);
      return;
    }

    matcherGroups.forEach((matcherGroup, matcherGroupIndex) => {
      if (!matcherGroup || typeof matcherGroup !== 'object' || Array.isArray(matcherGroup)) {
        errors.push(
          `.codex/hooks.json: ${eventName}[${matcherGroupIndex}] must be an object with hooks[]`,
        );
        return;
      }

      if (!Array.isArray(matcherGroup.hooks) || matcherGroup.hooks.length === 0) {
        errors.push(
          `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks must be a non-empty array`,
        );
        return;
      }

      if (['UserPromptSubmit', 'Stop'].includes(eventName) && matcherGroup.matcher !== undefined) {
        warnings.push(
          `.codex/hooks.json: ${eventName}[${matcherGroupIndex}] declares matcher even though current Codex ignores matcher for that event`,
        );
      }

      matcherGroup.hooks.forEach((hook, hookIndex) => {
        if (!hook || typeof hook !== 'object' || Array.isArray(hook)) {
          errors.push(
            `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}] must be an object`,
          );
          return;
        }

        if (hook.type !== 'command') {
          errors.push(
            `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}] must use type="command"`,
          );
        }

        if (typeof hook.command !== 'string' || hook.command.trim() === '') {
          errors.push(
            `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}].command must be a non-empty string`,
          );
        } else if (!hook.command.includes('scripts/project-memory/codexHooks.mjs')) {
          warnings.push(
            `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}] does not point at scripts/project-memory/codexHooks.mjs`,
          );
        }

        if (
          hook.statusMessage !== undefined &&
          (typeof hook.statusMessage !== 'string' || hook.statusMessage.trim() === '')
        ) {
          errors.push(
            `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}].statusMessage must be a non-empty string when present`,
          );
        }

        if (
          hook.timeout !== undefined &&
          (typeof hook.timeout !== 'number' || !Number.isFinite(hook.timeout) || hook.timeout <= 0)
        ) {
          errors.push(
            `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}].timeout must be a positive number when present`,
          );
        }
      });
    });
  });

  requiredRepoHookEvents.forEach((eventName) => {
    if (!Array.isArray(hooks[eventName]) || hooks[eventName].length === 0) {
      errors.push(`.codex/hooks.json: ${eventName} hook wiring is required in this repo`);
    }
  });
};

export const validateProjectMemoryCodexHooks = ({
  codexDirectoryExists,
  codexDirectoryIsDirectory,
  configExists,
  configContent,
  hooksExists,
  hooksContent,
}) => {
  const errors = [];
  const warnings = [];

  if (codexDirectoryExists && !codexDirectoryIsDirectory) {
    errors.push('.codex/: expected a directory so project-scoped Codex config can load');
    return { errors, warnings, hooksEnabled: false };
  }

  if (!codexDirectoryExists) {
    warnings.push(
      '.codex/: missing repo-local Codex configuration directory; project-memory hooks are treated as suspended',
    );
    return { errors, warnings, hooksEnabled: false };
  }

  if (!configExists || configContent === undefined) {
    warnings.push(
      '.codex/config.toml: missing project-scoped Codex config; project-memory hooks are treated as suspended',
    );
    return { errors, warnings, hooksEnabled: false };
  }

  const parsedConfig = parseCodexHooksEnabled(configContent);

  if (parsedConfig.codexHooksEnabled !== true) {
    if (!parsedConfig.hasFeaturesTable) {
      warnings.push(
        '.codex/config.toml: missing [features] table; project-memory hook validation is skipped while hooks are suspended',
      );
    }

    if (parsedConfig.codexHooksEnabled === false) {
      warnings.push(
        '.codex/config.toml: codex_hooks=false; project-memory hook validation is intentionally suspended',
      );
    } else {
      warnings.push(
        '.codex/config.toml: codex_hooks is not enabled; project-memory hook validation is skipped',
      );
    }

    return { errors, warnings, hooksEnabled: false };
  }

  if (!parsedConfig.hasFeaturesTable) {
    errors.push('.codex/config.toml: missing [features] table required for codex_hooks');
  }

  if (!hooksExists || hooksContent === undefined) {
    errors.push('.codex/hooks.json: missing repo-local Codex hook config');
    return { errors, warnings, hooksEnabled: true };
  }

  try {
    const rawHooksConfig = JSON.parse(hooksContent);
    validateEnabledHooksJson(rawHooksConfig, { errors, warnings });
  } catch (error) {
    errors.push(
      `.codex/hooks.json: failed to parse JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }

  return { errors, warnings, hooksEnabled: true };
};
