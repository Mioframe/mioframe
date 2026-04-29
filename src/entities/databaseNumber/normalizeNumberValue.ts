/**
 * Normalizes text-field number input into a persisted numeric value.
 */
export const normalizeNumberValue = (value: string | undefined): number | undefined => {
  if (value == null || value === '') {
    return undefined;
  }

  return Number(value);
};
