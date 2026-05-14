import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('markdown-it');
    vi.resetModules();
  });

  it('renders markdown headings as heading tags', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>');
  });

  it('renders h4 through h6 headings', () => {
    const rendered = renderMarkdown(
      ['#### Title 4', '##### Title 5', '###### Title 6'].join('\n\n'),
    );

    expect(rendered).toContain('<h4>Title 4</h4>');
    expect(rendered).toContain('<h5>Title 5</h5>');
    expect(rendered).toContain('<h6>Title 6</h6>');
  });

  it('renders paragraphs and lists', () => {
    const rendered = renderMarkdown(['First paragraph', '', '- one', '- two'].join('\n'));

    expect(rendered).toContain('<p>First paragraph</p>');
    expect(rendered).toContain('<ul>');
    expect(rendered).toContain('<li>one</li>');
    expect(rendered).toContain('<li>two</li>');
  });

  it('wraps tables only when a wrapper class name is provided', () => {
    const rendered = renderMarkdown(
      ['| Name | Value |', '| --- | --- |', '| Alpha | 1 |'].join('\n'),
      { tableWrapperClassName: 'custom-table-wrapper' },
    );

    expect(rendered).toContain('<div class="custom-table-wrapper"><table>');
    expect(rendered).toMatch(/<\/table>\s*<\/div>/u);
  });

  it('escapes a malicious table wrapper class name instead of creating extra html attributes', () => {
    const rendered = renderMarkdown(
      ['| Name | Value |', '| --- | --- |', '| Alpha | 1 |'].join('\n'),
      { tableWrapperClassName: 'x" onclick="alert(1)' },
    );
    const wrapperTagMatch = rendered.match(/<div class="[^"]*"><table>/u);

    expect(rendered).toContain('<div class="x&quot; onclick=&quot;alert(1)"><table>');
    expect(wrapperTagMatch?.[0]).toBe('<div class="x&quot; onclick=&quot;alert(1)"><table>');
    expect(rendered).not.toContain('<div class="x" onclick="alert(1)"><table>');
    expect(rendered).toContain('<td>1</td>');
  });

  it('does not add a table wrapper when no wrapper class name is provided', () => {
    const rendered = renderMarkdown(
      ['| Name | Value |', '| --- | --- |', '| Alpha | 1 |'].join('\n'),
    );

    expect(rendered).toContain('<table>');
    expect(rendered).not.toContain('markdown-content__table-scroll');
    expect(rendered).not.toContain('<div class=');
  });

  it('renders markdown links', () => {
    expect(renderMarkdown('[Docs](https://example.com)')).toContain(
      '<a href="https://example.com">Docs</a>',
    );
  });

  it('renders only the explicitly allowed markdown link shapes as anchors', () => {
    const rendered = renderMarkdown(
      [
        '[Https](https://example.com)',
        '[Http](http://example.com)',
        '[Protocol Relative](//example.com/docs)',
        '[Mail](mailto:test@example.com)',
        '[Phone](tel:+123)',
        '[Root Relative](/docs/page)',
        '[Hash](#section)',
        '[Dot Relative](./page)',
        '[Dot Dot Relative](../page)',
        '[Plain Relative](page.md)',
      ].join('\n\n'),
    );

    expect(rendered).toContain('<a href="https://example.com">Https</a>');
    expect(rendered).toContain('<a href="http://example.com">Http</a>');
    expect(rendered).toContain('<a href="//example.com/docs">Protocol Relative</a>');
    expect(rendered).toContain('<a href="mailto:test@example.com">Mail</a>');
    expect(rendered).toContain('<a href="tel:+123">Phone</a>');
    expect(rendered).toContain('<a href="/docs/page">Root Relative</a>');
    expect(rendered).toContain('<a href="#section">Hash</a>');
    expect(rendered).toContain('<a href="./page">Dot Relative</a>');
    expect(rendered).toContain('<a href="../page">Dot Dot Relative</a>');
    expect(rendered).toContain('<a href="page.md">Plain Relative</a>');
  });

  it('renders strikethrough text with the default markdown-it support', () => {
    expect(renderMarkdown('~~deleted text~~')).toContain('<s>deleted text</s>');
  });

  it('renders angle-bracket autolinks and email autolinks via markdown syntax even when linkify is disabled', () => {
    const rendered = renderMarkdown(['<https://example.com>', '<user@example.com>'].join('\n\n'));

    expect(rendered).toContain('<a href="https://example.com">https://example.com</a>');
    expect(rendered).toContain('<a href="mailto:user@example.com">user@example.com</a>');
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

  it('renders markdown image syntax with the default markdown-it image support', () => {
    const rendered = renderMarkdown('![Alt](./image.png)');

    expect(rendered).toContain('<p><img src="./image.png" alt="Alt"></p>');
  });

  it('does not silently transform punctuation when typographer mode is disabled', () => {
    const rendered = renderMarkdown('"quoted text" -- plain dash');

    expect(rendered).toContain('<p>&quot;quoted text&quot; -- plain dash</p>');
    expect(rendered).not.toContain('“quoted text”');
    expect(rendered).not.toContain('&ldquo;quoted text&rdquo;');
    expect(rendered).not.toContain('–');
  });

  it('preserves aligned tables inside the wrapper markup', () => {
    const rendered = renderMarkdown(
      ['| Left | Center | Right |', '| :--- | :---: | ---: |', '| one | two | three |'].join('\n'),
      { tableWrapperClassName: 'custom-table-wrapper' },
    );

    expect(rendered).toContain('<div class="custom-table-wrapper"><table>');
    expect(rendered).toContain('<th style="text-align:left">Left</th>');
    expect(rendered).toContain('<th style="text-align:center">Center</th>');
    expect(rendered).toContain('<th style="text-align:right">Right</th>');
  });

  it('does not render forbidden or custom-protocol links as clickable anchors', () => {
    const rendered = renderMarkdown(
      [
        '[JavaScript](javascript:alert(1))',
        '[VBScript](vbscript:msgbox(1))',
        '[File](file:///etc/passwd)',
        '[Data](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
        '[Custom](foo:bar)',
      ].join('\n\n'),
    );

    expect(rendered).toContain('<p>[JavaScript](javascript:alert(1))</p>');
    expect(rendered).toContain('<p>[VBScript](vbscript:msgbox(1))</p>');
    expect(rendered).toContain('<p>[File](file:///etc/passwd)</p>');
    expect(rendered).toContain(
      '<p>[Data](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)</p>',
    );
    expect(rendered).toContain('<p>[Custom](foo:bar)</p>');
    expect(rendered).not.toContain('href="javascript:alert(1)"');
    expect(rendered).not.toContain('href="vbscript:msgbox(1)"');
    expect(rendered).not.toContain('href="file:///etc/passwd"');
    expect(rendered).not.toContain(
      'href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="',
    );
    expect(rendered).not.toContain('href="foo:bar"');
    expect(rendered).not.toContain('<a ');
  });

  it('keeps markdown-it default link validation in addition to the project whitelist', () => {
    return (async () => {
      vi.resetModules();

      const actualMarkdownIt = await vi.importActual<typeof import('markdown-it')>('markdown-it');

      vi.doMock('markdown-it', () => ({
        default: function MockMarkdownIt(
          ...args: ConstructorParameters<typeof actualMarkdownIt.default>
        ) {
          const instance = new actualMarkdownIt.default(...args);
          const originalValidateLink = instance.validateLink.bind(instance);

          instance.validateLink = (url) =>
            url === 'https://example.com/blocked-by-default' ? false : originalValidateLink(url);

          return instance;
        },
      }));

      const { renderMarkdown: renderMarkdownWithMockedDefault } = await import('./renderMarkdown');
      const rendered = renderMarkdownWithMockedDefault(
        [
          '[Blocked By Default](https://example.com/blocked-by-default)',
          '[Allowed By Both](https://example.com/allowed-by-both)',
        ].join('\n\n'),
      );

      expect(rendered).toContain(
        '<p>[Blocked By Default](https://example.com/blocked-by-default)</p>',
      );
      expect(rendered).toContain(
        '<a href="https://example.com/allowed-by-both">Allowed By Both</a>',
      );
    })();
  });

  it('adds new-tab attributes only to absolute links when requested', () => {
    const rendered = renderMarkdown(
      [
        '[External](https://example.com)',
        '[Http](http://example.com)',
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
      '<a href="http://example.com" target="_blank" rel="noopener noreferrer">Http</a>',
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
