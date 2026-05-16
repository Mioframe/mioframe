import helpDocs from './helpCatalogModules';

type HelpFileModules = Record<string, string>;

/**
 * Generated help article metadata used by the page-owned help panes.
 */
export interface HelpArticle {
  /** Stable route slug derived from the Markdown path. */
  slug: string;
  /** Display title derived from the first Markdown H1. */
  title: string;
  /** Raw Markdown source loaded at build time. */
  markdown: string;
  /** Markdown path relative to `docs/user`. */
  sourcePath: string;
  /** Parent directory relative to `docs/user`. */
  sourceDir: string;
}

const USER_DOCS_PREFIX = '../../../docs/user/';
const ORDERING_PREFIX_PATTERN = /^\d+-/;
const H1_PATTERN = /^#\s+(.+?)\s*$/m;
const MARKDOWN_EXTENSION_PATTERN = /\.md$/i;

const toTitleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');

const normalizePathSegment = (segment: string) =>
  segment.replace(ORDERING_PREFIX_PATTERN, '').replace(MARKDOWN_EXTENSION_PATTERN, '');

const getFallbackTitle = (sourcePath: string) => {
  const fileName = sourcePath.split('/').at(-1) ?? sourcePath;
  return toTitleCase(normalizePathSegment(fileName));
};

/**
 * Extracts the help article title from the first H1 or falls back to the filename.
 * @param markdown - Raw Markdown source for the help article.
 * @param sourcePath - Markdown path relative to `docs/user`.
 * @returns The display title for the help article.
 */
export const getHelpArticleTitle = (markdown: string, sourcePath: string) =>
  H1_PATTERN.exec(markdown)?.[1]?.trim() || getFallbackTitle(sourcePath);

const getSlug = (sourcePath: string) =>
  sourcePath.replace(MARKDOWN_EXTENSION_PATTERN, '').split('/').map(normalizePathSegment).join('/');

const isArticlePath = (sourcePath: string) =>
  sourcePath !== 'README.md' && sourcePath !== 'data-storage-and-recovery.md';

/**
 * Builds a deterministic help catalog from raw Markdown modules.
 * @param modules - Build-time loaded Markdown sources keyed by module path.
 * @returns Ordered help article metadata for in-app navigation.
 */
export const createHelpCatalog = (modules: HelpFileModules): HelpArticle[] =>
  Object.entries(modules)
    .map(([modulePath, markdown]) => {
      const sourcePath = modulePath.replace(USER_DOCS_PREFIX, '');
      return { sourcePath, markdown };
    })
    .filter(({ sourcePath }) => isArticlePath(sourcePath))
    .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))
    .map(({ sourcePath, markdown }) => ({
      slug: getSlug(sourcePath),
      title: getHelpArticleTitle(markdown, sourcePath),
      markdown,
      sourcePath,
      sourceDir: sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '',
    }));

/**
 * Build-time generated catalog for all in-app help articles.
 */
export const helpCatalog = createHelpCatalog(helpDocs);

/**
 * Finds one help article by its route slug.
 * @param slug - Stable slug derived from the Markdown path.
 * @returns The matching help article, if one exists.
 */
export const getHelpArticleBySlug = (slug: string) =>
  helpCatalog.find((article) => article.slug === slug);

/**
 * Resolves a relative Markdown href to another in-app help article slug when possible.
 * @param currentSourcePath - Current article path relative to `docs/user`.
 * @param href - Raw link href from rendered Markdown.
 * @param catalog - Candidate help articles that may match the resolved path.
 * @returns The target help article slug when the href resolves to another help doc.
 */
export const resolveHelpArticleHref = (
  currentSourcePath: string,
  href: string,
  catalog: readonly HelpArticle[] = helpCatalog,
) => {
  const normalizedHref = href.split(/[?#]/u, 1)[0] ?? '';

  if (
    href.length === 0 ||
    href.startsWith('#') ||
    /^(?:https?:|mailto:|tel:)/i.test(href) ||
    !MARKDOWN_EXTENSION_PATTERN.test(normalizedHref)
  ) {
    return null;
  }

  const baseUrl = new URL(currentSourcePath, 'https://help.local/docs/user/');
  const resolvedUrl = new URL(href, baseUrl);

  if (resolvedUrl.origin !== 'https://help.local') {
    return null;
  }

  const resolvedPath = resolvedUrl.pathname.replace(/^\/docs\/user\//, '');
  const target = catalog.find((article) => article.sourcePath === resolvedPath);
  return target?.slug ?? null;
};
