import { warn } from 'vue';

/**
 * Tags allowed inside a `mode="button"` MDCard: phrasing/inline content and
 * common inline icon markup (including inline SVG parts). Native `<button>`
 * only accepts phrasing content, so block-level and interactive tags are
 * excluded on purpose.
 */
const ALLOWED_BUTTON_CONTENT_TAGS = new Set([
  'SPAN',
  'B',
  'I',
  'EM',
  'STRONG',
  'SMALL',
  'MARK',
  'ABBR',
  'CITE',
  'CODE',
  'KBD',
  'SAMP',
  'VAR',
  'Q',
  'TIME',
  'BR',
  'WBR',
  'SUB',
  'SUP',
  'BDI',
  'BDO',
  'SVG',
  'PATH',
  'G',
  'USE',
  'DEFS',
  'CIRCLE',
  'RECT',
  'LINE',
  'POLYLINE',
  'POLYGON',
  'ELLIPSE',
]);

const findDisallowedButtonContent = (element: Element): Element | undefined => {
  for (const child of Array.from(element.children)) {
    if (!ALLOWED_BUTTON_CONTENT_TAGS.has(child.tagName)) {
      return child;
    }

    const nested = findDisallowedButtonContent(child);

    if (nested) {
      return nested;
    }
  }

  return undefined;
};

/**
 * Emits a development warning when a `mode="button"` MDCard's rendered
 * content includes a tag outside the phrasing-content allow list. Native
 * `<button>` only accepts phrasing content, so block-level markup (headings,
 * paragraphs, divs) or nested interactive controls are invalid there.
 * @param root - The mounted MDCard root button element.
 */
export const warnButtonModeRichContent = (root: Element) => {
  const disallowed = findDisallowedButtonContent(root);

  if (disallowed) {
    warn(
      `MDCard: mode="button" only supports simple/phrasing slot content (text, inline elements, icons). Found <${disallowed.tagName.toLowerCase()}>, which is not valid inside a native <button>. Use mode="static" for rich block content or cards with internal buttons/links.`,
    );
  }
};
