/* Stryker disable all */

const helpDocs: Record<string, string> = import.meta.glob('../../../docs/user/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export default helpDocs;
