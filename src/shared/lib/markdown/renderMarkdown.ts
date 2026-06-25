import MarkdownIt from 'markdown-it';
import { resolveUniqueHeadingId, slugifyHeadingText } from './headingId';

/**
 * Additional rendering behavior for shared markdown output.
 */
export interface RenderMarkdownOptions {
  /**
   * Adds `target="_blank"` and `rel="noopener noreferrer"` to `http`, `https`,
   * and protocol-relative links.
   */
  readonly openExternalLinksInNewTab?: boolean;
  /**
   * Optional class name applied to a div that wraps rendered tables.
   */
  readonly tableWrapperClassName?: string;
  /**
   * Adds a deterministic, unique `id` attribute to every rendered heading, derived from its
   * text. Used by consumers that need stable in-page anchor targets (e.g. Help article
   * cross-links); generic Markdown rendering otherwise has no anchor/routing concept.
   */
  readonly generateHeadingIds?: boolean;
}

const isExternalLinkHref = (href: string): boolean => /^(?:https?:|\/\/)/iu.test(href);
const allowedAbsoluteLinkProtocolRe = /^(?:https?:|mailto:|tel:)/iu;
const customSchemeRe = /^[a-z][a-z\d+.-]*:/iu;

const isAllowedMarkdownLink = (url: string): boolean => {
  const trimmedUrl = url.trim();

  if (trimmedUrl === '') {
    return false;
  }

  if (allowedAbsoluteLinkProtocolRe.test(trimmedUrl)) {
    return true;
  }

  if (trimmedUrl.startsWith('//')) {
    return true;
  }

  if (
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('#') ||
    trimmedUrl.startsWith('./') ||
    trimmedUrl.startsWith('../')
  ) {
    return true;
  }

  if (customSchemeRe.test(trimmedUrl)) {
    return false;
  }

  return true;
};

const createMarkdownRenderer = (renderOptions: RenderMarkdownOptions = {}) => {
  const markdown = new MarkdownIt({
    html: false,
    linkify: false,
    typographer: false,
    breaks: false,
  });
  const defaultValidateLink = markdown.validateLink.bind(markdown);
  markdown.validateLink = (url) => defaultValidateLink(url) && isAllowedMarkdownLink(url);
  const {
    openExternalLinksInNewTab = false,
    tableWrapperClassName,
    generateHeadingIds = false,
  } = renderOptions;

  const fallbackHeadingOpenRenderer: NonNullable<typeof markdown.renderer.rules.heading_open> = (
    tokens,
    idx,
    rendererOptions,
    _env,
    self,
  ) => self.renderToken(tokens, idx, rendererOptions);
  const fallbackLinkOpenRenderer: NonNullable<typeof markdown.renderer.rules.link_open> = (
    tokens,
    idx,
    rendererOptions,
    _env,
    self,
  ) => self.renderToken(tokens, idx, rendererOptions);
  const fallbackTableOpenRenderer: NonNullable<typeof markdown.renderer.rules.table_open> = (
    tokens,
    idx,
    rendererOptions,
    _env,
    self,
  ) => self.renderToken(tokens, idx, rendererOptions);
  const fallbackTableCloseRenderer: NonNullable<typeof markdown.renderer.rules.table_close> = (
    tokens,
    idx,
    rendererOptions,
    _env,
    self,
  ) => self.renderToken(tokens, idx, rendererOptions);

  const defaultLinkOpenRenderer = markdown.renderer.rules.link_open ?? fallbackLinkOpenRenderer;
  if (tableWrapperClassName !== undefined) {
    const defaultTableOpenRenderer =
      markdown.renderer.rules.table_open ?? fallbackTableOpenRenderer;
    const defaultTableCloseRenderer =
      markdown.renderer.rules.table_close ?? fallbackTableCloseRenderer;
    const escapedTableWrapperClassName = markdown.utils.escapeHtml(tableWrapperClassName);

    markdown.renderer.rules.table_open = (tokens, idx, rendererOptions, env, self) =>
      `<div class="${escapedTableWrapperClassName}">${defaultTableOpenRenderer(
        tokens,
        idx,
        rendererOptions,
        env,
        self,
      )}`;

    markdown.renderer.rules.table_close = (tokens, idx, rendererOptions, env, self) =>
      `${defaultTableCloseRenderer(tokens, idx, rendererOptions, env, self)}</div>`;
  }

  if (generateHeadingIds) {
    const defaultHeadingOpenRenderer =
      markdown.renderer.rules.heading_open ?? fallbackHeadingOpenRenderer;

    markdown.renderer.rules.heading_open = (
      tokens,
      idx,
      rendererOptions,
      env: { usedHeadingIds?: Set<string> },
      self,
    ) => {
      const token = tokens[idx];
      const inlineToken = tokens[idx + 1];

      if (token !== undefined && inlineToken?.type === 'inline') {
        // Plain-text-only children are enough for a stable slug; markup tokens (emphasis,
        // links, etc.) are skipped rather than rendered, since the id only needs to be
        // deterministic and human-readable, not a full text reconstruction.
        const headingText = (inlineToken.children ?? [])
          .filter((child) => child.type === 'text' || child.type === 'code_inline')
          .map((child) => child.content)
          .join('');

        // Heading-id collision tracking lives in the per-render `env`, not in this
        // renderer-rule closure, so concurrent or repeated `render()` calls each start
        // from an empty id set instead of sharing state across renders.
        const usedHeadingIds = env.usedHeadingIds ?? new Set<string>();
        env.usedHeadingIds = usedHeadingIds;

        token.attrSet(
          'id',
          resolveUniqueHeadingId(slugifyHeadingText(headingText), usedHeadingIds),
        );
      }

      return defaultHeadingOpenRenderer(tokens, idx, rendererOptions, env, self);
    };
  }

  if (!openExternalLinksInNewTab) {
    return markdown;
  }

  markdown.renderer.rules.link_open = (tokens, idx, rendererOptions, env, self) => {
    const token = tokens[idx];

    if (token === undefined) {
      return defaultLinkOpenRenderer(tokens, idx, rendererOptions, env, self);
    }

    const href = token.attrGet('href');

    if (href !== null && isExternalLinkHref(href)) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noopener noreferrer');
    }

    return defaultLinkOpenRenderer(tokens, idx, rendererOptions, env, self);
  };

  return markdown;
};

/**
 * Renders a repository-controlled Markdown string to safe HTML.
 * @param source - Markdown source string from a repository-controlled input.
 * @param options - Optional rendering behavior flags.
 * @returns Safe HTML generated by the shared markdown-it renderer.
 */
export const renderMarkdown = (source: string, options: RenderMarkdownOptions = {}): string => {
  const renderer = createMarkdownRenderer(options);

  return renderer.render(source);
};
