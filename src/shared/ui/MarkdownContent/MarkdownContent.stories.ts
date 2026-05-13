import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MarkdownContent from './MarkdownContent.vue';

const sampleMarkdown = `# Markdown Content

Paragraph text with a [link](https://example.com), **strong** emphasis, *italic* emphasis, and \`inline code\`.

## Lists

- Bullet one
- Bullet two

1. First item
2. Second item

## Quote

> Markdown content stays inside the parent layout.

## Code Block

\`\`\`ts
export const message = 'hello markdown';
\`\`\`

## Table

| Name | Value |
| --- | --- |
| Alpha | 1 |
| Beta | 2 |
`;

const meta = {
  title: 'shared/ui/MarkdownContent',
  component: MarkdownContent,
  args: {
    source: sampleMarkdown,
    variant: 'body',
    openExternalLinksInNewTab: false,
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['body', 'article', 'compact'],
    },
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MarkdownContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Article: Story = {
  args: {
    variant: 'article',
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
  },
};

export const VariantsOverview: Story = {
  tags: ['visual'],
  render: () => ({
    components: { MarkdownContent },
    setup: () => ({
      sampleMarkdown,
    }),
    template: `
      <div
        data-testid="visual-markdown-content-variants"
        style="display: grid; gap: 24px; max-width: 720px;"
      >
        <MarkdownContent :source="sampleMarkdown" variant="body" />
        <MarkdownContent :source="sampleMarkdown" variant="article" />
        <MarkdownContent :source="sampleMarkdown" variant="compact" />
      </div>
    `,
  }),
};
