import { VALID_COMMAND_LABELS } from './config.mjs';

export function getCliValue(args, name, errorMessage) {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === name) {
      const value = args[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(errorMessage);
      }

      return value;
    }

    if (argument.startsWith(`${name}=`)) {
      const value = argument.slice(name.length + 1);

      if (value.length === 0) {
        throw new Error(errorMessage);
      }

      return value;
    }
  }

  return null;
}

export function getCliOnlyLabels(args) {
  const labels = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--only') {
      const value = args[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --only. Example: pnpm verify --only type-check');
      }

      labels.push(...value.split(','));
      index += 1;
      continue;
    }

    if (argument.startsWith('--only=')) {
      const value = argument.slice('--only='.length);

      if (value.length === 0) {
        throw new Error('Missing value for --only. Example: pnpm verify --only type-check');
      }

      labels.push(...value.split(','));
    }
  }

  const normalizedLabels = labels.map((label) => label.trim()).filter((label) => label.length > 0);

  for (const label of normalizedLabels) {
    if (!VALID_COMMAND_LABELS.includes(label)) {
      throw new Error(
        `Unknown --only check: ${label}. Expected one of: ${VALID_COMMAND_LABELS.join(', ')}`,
      );
    }
  }

  return VALID_COMMAND_LABELS.filter((label) => normalizedLabels.includes(label));
}
