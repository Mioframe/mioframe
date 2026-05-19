import { custom } from 'zod/v4-mini';

const RESERVED_FOLDER_NAMES = new Set(['.', '..']);
const INVALID_FOLDER_NAME_CHARACTERS = /[\\/:*?"<>|]/u;
const EMPTY_SPACE_NAME_ERROR = 'Enter a space name.';
const INVALID_FOLDER_NAME_ERROR = 'Enter a valid folder name.';

const hasControlCharacter = (value: string) => {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && codePoint <= 0x1f) {
      return true;
    }
  }

  return false;
};

const zodNonEmptyMioframeSpaceName = custom<string>(
  (value): value is string => typeof value === 'string' && value.length > 0,
);

const zodValidMioframeSpaceFolderName = custom<string>(
  (value): value is string =>
    typeof value === 'string' &&
    !RESERVED_FOLDER_NAMES.has(value) &&
    !hasControlCharacter(value) &&
    !INVALID_FOLDER_NAME_CHARACTERS.test(value),
);

type MioframeSpaceNameParseResult =
  | {
      success: true;
      name: string;
    }
  | {
      success: false;
      error: typeof EMPTY_SPACE_NAME_ERROR | typeof INVALID_FOLDER_NAME_ERROR;
    };

/**
 * Parses and validates a raw Mioframe space name in one step.
 * @param rawName - Raw form value.
 * @returns Success with the trimmed name, or the user-facing validation error.
 */
export const parseMioframeSpaceName = (
  rawName: string | undefined,
): MioframeSpaceNameParseResult => {
  const name = rawName?.trim() ?? '';

  if (!zodNonEmptyMioframeSpaceName.safeParse(name).success) {
    return {
      success: false,
      error: EMPTY_SPACE_NAME_ERROR,
    };
  }

  if (!zodValidMioframeSpaceFolderName.safeParse(name).success) {
    return {
      success: false,
      error: INVALID_FOLDER_NAME_ERROR,
    };
  }

  return {
    success: true,
    name,
  };
};

/**
 * Returns a normalized user-provided Mioframe space name.
 * @param name - Raw form value.
 * @returns Trimmed name.
 */
export const normalizeMioframeSpaceName = (name: string | undefined) => {
  const parsedName = parseMioframeSpaceName(name);
  return parsedName.success ? parsedName.name : (name?.trim() ?? '');
};

/**
 * Returns a field error for an invalid Mioframe space name.
 * @param name - Raw form value.
 * @returns Field-level validation error when the name is invalid.
 */
export const getMioframeSpaceNameError = (name: string | undefined) => {
  const parsedName = parseMioframeSpaceName(name);
  return parsedName.success ? undefined : parsedName.error;
};
