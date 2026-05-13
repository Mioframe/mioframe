import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('renders markdown headings as heading tags', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>');
  });

  it('renders paragraphs and lists', () => {
    const rendered = renderMarkdown(['First paragraph', '', '- one', '- two'].join('\n'));

    expect(rendered).toContain('<p>First paragraph</p>');
    expect(rendered).toContain('<ul>');
    expect(rendered).toContain('<li>one</li>');
    expect(rendered).toContain('<li>two</li>');
  });

  it('wraps tables in a dedicated scroll container while keeping the table element intact', () => {
    const rendered = renderMarkdown(
      ['| Name | Value |', '| --- | --- |', '| Alpha | 1 |'].join('\n'),
    );

    expect(rendered).toContain('<div class="markdown-content__table-scroll"><table>');
    expect(rendered).toMatch(/<\/table>\s*<\/div>/u);
  });

  it('renders markdown links', () => {
    expect(renderMarkdown('[Docs](https://example.com)')).toContain(
      '<a href="https://example.com">Docs</a>',
    );
  });

  it('keeps default link rendering unchanged when the option is disabled', () => {
    const rendered = renderMarkdown('[Docs](https://example.com)');

    expect(rendered).not.toContain('target="_blank"');
    expect(rendered).not.toContain('rel="noopener noreferrer"');
  });

  it('escapes raw html instead of rendering executable elements', () => {
    const rendered = renderMarkdown('<script>alert(1)</script>');

    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('does not render javascript protocol links as clickable anchors', () => {
    const rendered = renderMarkdown('[x](javascript:alert(1))');

    expect(rendered).toContain('<p>[x](javascript:alert(1))</p>');
    expect(rendered).not.toContain('href="javascript:alert(1)"');
    expect(rendered).not.toContain('<a ');
  });

  it('adds new-tab attributes only to absolute links when requested', () => {
    const rendered = renderMarkdown(
      [
        '[External](https://example.com)',
        '[Protocol Relative](//example.com/docs)',
        '[Mail](mailto:test@example.com)',
        '[Phone](tel:+123)',
        '[Internal](/docs/getting-started)',
        '[Anchor](#section)',
      ].join('\n\n'),
      { openExternalLinksInNewTab: true },
    );

    expect(rendered).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>',
    );
    expect(rendered).toContain(
      '<a href="//example.com/docs" target="_blank" rel="noopener noreferrer">Protocol Relative</a>',
    );
    expect(rendered).toContain('<a href="mailto:test@example.com">Mail</a>');
    expect(rendered).not.toContain(
      '<a href="mailto:test@example.com" target="_blank" rel="noopener noreferrer">Mail</a>',
    );
    expect(rendered).toContain('<a href="tel:+123">Phone</a>');
    expect(rendered).not.toContain(
      '<a href="tel:+123" target="_blank" rel="noopener noreferrer">Phone</a>',
    );
    expect(rendered).toContain('<a href="/docs/getting-started">Internal</a>');
    expect(rendered).toContain('<a href="#section">Anchor</a>');
  });
});
