/**
 * Removes the first leading markdown H1 from a help article body after trimming leading
 * whitespace so the app bar headline is not duplicated in rendered content.
 * @param markdown - Raw article markdown that may begin with a top-level title.
 * @returns Markdown content with only the first leading H1 removed.
 */
export const stripMarkdownTitle = (markdown: string): string =>
  markdown.trimStart().replace(/^#\s+.*(?:\r?\n+|$)/, '');
