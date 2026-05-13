import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MarkdownContent from './MarkdownContent.vue';

describe('MarkdownContent', () => {
  it('renders markdown content into html output', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: '# Title\n\nParagraph\n\n- one\n- two',
      },
    });

    expect(wrapper.find('h1').text()).toBe('Title');
    expect(wrapper.find('p').text()).toBe('Paragraph');
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual(['one', 'two']);
  });

  it('updates rendered content when source changes', async () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: 'Plain text',
      },
    });

    await wrapper.setProps({
      source: '## Updated',
    });

    expect(wrapper.find('h2').text()).toBe('Updated');
    expect(wrapper.text()).not.toContain('Plain text');
  });

  it('renders h4 through h6 headings in the dom', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: ['#### Title 4', '##### Title 5', '###### Title 6'].join('\n\n'),
      },
    });

    expect(wrapper.find('h4').text()).toBe('Title 4');
    expect(wrapper.find('h5').text()).toBe('Title 5');
    expect(wrapper.find('h6').text()).toBe('Title 6');
  });

  it('adds the variant modifier class', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: 'Paragraph',
        variant: 'compact',
      },
    });

    const content = wrapper.get('.markdown-content');

    expect(content.classes()).toContain('markdown-content');
    expect(content.classes()).toContain('markdown-content--compact');
  });

  it('passes the table wrapper class and renders tables inside the scroll container', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: ['| Left | Center | Right |', '| :--- | :---: | ---: |', '| Alpha | 1 | 2 |'].join(
          '\n',
        ),
      },
    });

    const tableWrapper = wrapper.get('.markdown-content__table-scroll');
    const headings = tableWrapper.findAll('th');

    expect(tableWrapper.find('table').exists()).toBe(true);
    expect(headings.map((heading) => heading.attributes('style'))).toEqual([
      'text-align:left',
      'text-align:center',
      'text-align:right',
    ]);
  });

  it('escapes raw html so script tags do not become executable dom nodes', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: '<script>alert(1)</script>',
      },
    });

    expect(wrapper.find('script').exists()).toBe(false);
    expect(wrapper.text()).toContain('<script>alert(1)</script>');
  });

  it('keeps the default markdown image rendering without any extra image-specific wrapper logic', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: '![Alt](./image.png)',
      },
    });

    expect(wrapper.find('img').attributes()).toMatchObject({
      src: './image.png',
      alt: 'Alt',
    });
  });

  it('adds new-tab attributes only to external links when requested', () => {
    const wrapper = mount(MarkdownContent, {
      props: {
        source: ['[External](https://example.com)', '[Internal](/docs/getting-started)'].join(
          '\n\n',
        ),
        openExternalLinksInNewTab: true,
      },
    });

    const links = wrapper.findAll('a');

    expect(links[0]?.attributes()).toMatchObject({
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(links[1]?.attributes()).toMatchObject({
      href: '/docs/getting-started',
    });
    expect(links[1]?.attributes('target')).toBeUndefined();
    expect(links[1]?.attributes('rel')).toBeUndefined();
  });
});
