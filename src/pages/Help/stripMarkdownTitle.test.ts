import { describe, expect, it } from 'vitest';
import { stripMarkdownTitle } from './stripMarkdownTitle';

describe('stripMarkdownTitle', () => {
  it('strips a normal leading h1 and keeps the body content', () => {
    expect(stripMarkdownTitle('# Title\n\nBody')).toBe('Body');
  });

  it('strips a leading h1 after whitespace at the start of the document', () => {
    expect(stripMarkdownTitle('\uFEFF  \n\t# Title\nBody')).toBe('Body');
  });

  it('strips a document that contains only a title', () => {
    expect(stripMarkdownTitle('# Title')).toBe('');
  });

  it('does not strip a leading non-h1 heading', () => {
    expect(stripMarkdownTitle('## Subtitle\n\nBody')).toBe('## Subtitle\n\nBody');
  });

  it('keeps body content when the title is followed by a single newline', () => {
    expect(stripMarkdownTitle('# Title\nBody')).toBe('Body');
  });
});
