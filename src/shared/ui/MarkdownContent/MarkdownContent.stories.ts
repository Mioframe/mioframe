import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MDCard } from '@shared/ui/Card';
import MarkdownContent from './MarkdownContent.vue';

const kitchenSinkMarkdown = `# Markdown Content

Paragraph text with **strong** emphasis, *italic* emphasis, \`inline code\`, and a regular [link](/docs/getting-started).

Second paragraph with an external [OpenAI link](https://openai.com) that can opt into \`target="_blank"\`.

Third paragraph ends with a hard line break.  
This line should stay in the same paragraph after the explicit break.
This next line uses a soft
line break so the current wrapping behavior stays visible.

## Lists

- Bullet one
- Bullet two
- Nested items
  - Nested bullet
  - Another nested bullet with \`code\`

1. First item
2. Second item
3. Third item
   1. Nested ordered item
   2. Nested ordered item two

### Quotes

> Markdown content stays inside the parent layout.
>
> Second quoted paragraph keeps the block styling and spacing visible.
>
> - Nested bullet one
> - Nested bullet two with \`nested code\`

#### Heading Level 4

Compact heading level with ~~deleted text~~ and escaped markdown characters: \\*not italic\\*.

##### Heading Level 5

Angle-bracket autolinks still render through markdown syntax: <https://example.com> and <user@example.com>.

###### Heading Level 6

Inline code with special characters: \`const pattern = /<tag>\\s+\\*value\\*/u;\`

## Code Block

\`\`\`ts
export const message = 'hello markdown';
console.log(message);
\`\`\`

Indented code block:

    const indented = '<section data-kind="sample">';
    console.log(indented);

## Table

| Name | Value | Notes |
| --- | --- | --- |
| Alpha | 1 | Regular table content |
| Beta | 2 | Header background should clip cleanly |

## Aligned Table

| Left | Center | Right |
| :--- | :---: | ---: |
| left | centered | right |
| filled |  | trailing |
|  | empty left | 123 |

## Wide Table

| Column A | Column B | Column C | Column D | Column E | Column F |
| --- | --- | --- | --- | --- | --- |
| Very long project value that should stay inside the scroller | Another long value for overflow testing | Material-style wrapper | Rounded outline | Inner horizontal scroll | Layout stays stable |
| Short | Medium value | More content | More content | More content | More content |

## Images

![Markdown example image](https://placehold.co/960x540/png)

Long unbroken content for overflow-wrap checks:
https://example.com/some/really/really/really/really/really/really/long/path/without/breaks
supercalifragilisticexpialidociousMarkdownOverflowProbeWithoutNaturalBreakpoints

---

Raw HTML stays escaped: <div class="unsafe-html">not rendered as DOM</div>`;

const wideTableMarkdown = `## Wide Table

| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
| --- | --- | --- | --- | --- | --- | --- |
| Very long value that should require horizontal scrolling inside the table wrapper | Another long value | More content | More content | More content | More content | More content |
| Second row with long content to prove the card width stays constrained | Another long value | More content | More content | More content | More content | More content |`;

const meta = {
  title: 'shared/ui/MarkdownContent',
  component: MarkdownContent,
  args: {
    source: kitchenSinkMarkdown,
    variant: 'body',
    openExternalLinksInNewTab: true,
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

const renderInSurface =
  (defaultVariant: 'body' | 'article' | 'compact', cardVariant: 'outlined' | 'filled') =>
  (args: { variant?: 'body' | 'article' | 'compact'; openExternalLinksInNewTab?: boolean }) => ({
    components: { MarkdownContent, MDCard },
    setup: () => ({
      args,
      kitchenSinkMarkdown,
      defaultVariant,
    }),
    template: `
    <div style="max-width: 840px; width: 100%;">
      <MDCard variant="${cardVariant}" style="max-width: 720px; padding: 24px; gap: 0;">
        <MarkdownContent
          :source="kitchenSinkMarkdown"
          :variant="args.variant ?? defaultVariant"
          :open-external-links-in-new-tab="args.openExternalLinksInNewTab ?? true"
        />
      </MDCard>
    </div>
  `,
  });

export const Default: Story = {
  render: renderInSurface('body', 'outlined'),
};

export const Article: Story = {
  args: {
    variant: 'article',
  },
  render: renderInSurface('article', 'filled'),
};

export const Compact: Story = {
  args: {
    variant: 'compact',
  },
  render: renderInSurface('compact', 'outlined'),
};

export const WideTable: Story = {
  tags: ['visual'],
  render: (args) => ({
    components: { MarkdownContent, MDCard },
    setup: () => ({
      args,
      wideTableMarkdown,
    }),
    template: `
      <div style="max-width: 420px; width: 100%;">
        <MDCard
          data-testid="visual-markdown-content-wide-table"
          variant="outlined"
          style="max-width: 320px; padding: 20px; gap: 0;"
        >
          <MarkdownContent
            :source="wideTableMarkdown"
            variant="body"
            :open-external-links-in-new-tab="args.openExternalLinksInNewTab ?? true"
          />
        </MDCard>
      </div>
    `,
  }),
};

export const VariantsOverview: Story = {
  tags: ['visual'],
  render: (args) => ({
    components: { MarkdownContent, MDCard },
    setup: () => ({
      args,
      kitchenSinkMarkdown,
    }),
    template: `
      <div
        data-testid="visual-markdown-content-variants"
        style="display: grid; gap: 24px; max-width: 840px; width: 100%;"
      >
        <MDCard variant="outlined" style="max-width: 720px; padding: 24px; gap: 0;">
          <MarkdownContent
            :source="kitchenSinkMarkdown"
            variant="body"
            :open-external-links-in-new-tab="args.openExternalLinksInNewTab ?? true"
          />
        </MDCard>
        <MDCard variant="filled" style="max-width: 720px; padding: 28px; gap: 0;">
          <MarkdownContent
            :source="kitchenSinkMarkdown"
            variant="article"
            :open-external-links-in-new-tab="args.openExternalLinksInNewTab ?? true"
          />
        </MDCard>
        <MDCard variant="outlined" style="max-width: 640px; padding: 20px; gap: 0;">
          <MarkdownContent
            :source="kitchenSinkMarkdown"
            variant="compact"
            :open-external-links-in-new-tab="args.openExternalLinksInNewTab ?? true"
          />
        </MDCard>
      </div>
    `,
  }),
};
