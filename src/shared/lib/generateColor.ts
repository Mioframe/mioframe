/**
 * Options for generating HSL color.
 * s - Color saturation in percentage (0-100). Default: 70%.
 * l - Color lightness in percentage (0-100). Default: 50%.
 */
export type ColorOptions = { s?: number; l?: number };

/**
 * The golden ratio conjugate (1/φ).
 * Used to distribute hues evenly around the color wheel to prevent clustering.
 */
const GOLDEN_RATIO = 0.618033988749895;

/**
 * Deterministic non-cryptographic string hash with xorshift finalizer.
 *
 * Uses a linear congruential pattern (31 * acc + char) followed by a
 * bit-wise XOR shift to ensure uniform distribution of unsigned 32-bit
 * hash values in the range [0, 2³²).
 * @param s - String to hash.
 * @returns Unsigned 32-bit integer.
 * @example
 * ```ts
 * getHash('hello') // 99163451
 * ```
 */
const getHash = (s: string) => {
  const h = s.split('').reduce((acc, char) => (Math.imul(31, acc) + char.charCodeAt(0)) | 0, 0);
  return (h ^ (h >>> 16)) >>> 0;
};

/**
 * Generates an HSL (Hue, Saturation, Lightness) color based on a deterministic hash.
 *
 * The color is determined by a string identifier, ensuring reproducibility with
 * identical input data. The hash is multiplied by the golden ratio for better
 * distribution of shades around the color wheel.
 * @param str - Unique identifier (e.g., document ID, slug, heading)
 * @param options - Options for adjusting saturation and lightness
 * @returns A CSS HSL color string.
 * @example
 * ```ts
 * // Deterministic generation by ID
 * generateHsl('doc-123') // 'hsl(139, 70%, 50%)'
 *
 * // Different parameters for different purposes
 * generateHsl('header', { l: 95 }) // 'hsl(29, 70%, 95%)' — light header
 * generateHsl('footer', { s: 30 }) // 'hsl(33, 30%, 50%)' — muted footer
 * generateHsl('button', { s: 90, l: 50 }) // 'hsl(97, 90%, 50%)' — bright accent
 * ```
 */
export const generateHsl = (str: string, { s = 70, l = 50 }: ColorOptions = {}) =>
  `hsl(${Math.floor(((getHash(str) * GOLDEN_RATIO) % 1) * 360)}, ${s}%, ${l}%)`;

/**
 * Generates a HEX color code based on a deterministic hash of a string.
 *
 * Converts a 32-bit hash to a 24-bit RGB value using the lower 24 bits
 * of the hash. Guarantees reproducibility with identical input data.
 * @param str - Unique identifier for color generation
 * @returns A CSS HEX color string.
 * @example
 * ```ts
 * // Deterministic generation
 * generateHex('button-primary') // '#fafb9d'
 *
 * // Different identifiers produce different colors
 * generateHex('button-secondary') // '#7543ec'
 * generateHex('button-tertiary') // '#f3dc7e'
 * ```
 */
export const generateHex = (str: string) =>
  `#${(getHash(str) & 0xffffff).toString(16).padStart(6, '0')}`;
