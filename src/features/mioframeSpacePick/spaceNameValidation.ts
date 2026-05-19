import { custom } from 'zod/v4-mini';

const CONTROL_CHARACTER_EXPRESSION = /[\u0000-\u001F]/u;
const RESERVED_FOLDER_NAMES = new Set(['.', '..']);
const INVALID_FOLDER_NAME_CHARACTERS = /[\\/:*?"<>|]/u;

const zodNonEmptyMioframeSpaceName = custom<string>(
  (value): value is string => typeof value === 'string' && value.length > 0,
);

const zodValidMioframeSpaceFolderName = custom<string>(
  (value): value is string =>
    typeof value === 'string' &&
    !RESERVED_FOLDER_NAMES.has(value) &&
    !CONTROL_CHARACTER_EXPRESSION.test(value) &&
    !INVALID_FOLDER_NAME_CHARACTERS.test(value),
);

/**
 * Returns a normalized user-provided Mioframe space name.
 * @param name - Raw form value.
 * @returns Trimmed name.
 */
export const normalizeMioframeSpaceName = (name: string | undefined) => name?.trim() ?? '';

/**
 * Returns a field error for an invalid Mioframe space name.
 * @param name - Raw form value.
 * @returns Field-level validation error when the name is invalid.
 */
export const getMioframeSpaceNameError = (name: string | undefined) => {
  const normalizedName = normalizeMioframeSpaceName(name);

  if (!zodNonEmptyMioframeSpaceName.safeParse(normalizedName).success) {
    return 'Enter a space name.';
  }

  if (!zodValidMioframeSpaceFolderName.safeParse(normalizedName).success) {
    return 'Enter a valid folder name.';
  }

  return undefined;
};
