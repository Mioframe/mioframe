<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '@shared/lib/markdown/renderMarkdown';

type MarkdownContentVariant = 'body' | 'article' | 'compact';

const props = withDefaults(
  defineProps<{
    source: string;
    variant?: MarkdownContentVariant;
    openExternalLinksInNewTab?: boolean;
  }>(),
  {
    variant: 'body',
    openExternalLinksInNewTab: false,
  },
);

const contentClassName = computed(() => ['markdown-content', `markdown-content--${props.variant}`]);

const renderedMarkdown = computed(() =>
  renderMarkdown(props.source, {
    openExternalLinksInNewTab: props.openExternalLinksInNewTab,
  }),
);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div :class="contentClassName" v-html="renderedMarkdown" />
</template>

<style scoped>
.markdown-content {
  --markdown-block-gap: 16px;
  --markdown-heading-gap: 24px;
  --markdown-inline-code-background: var(--md-sys-color-surface-container-low);
  --markdown-surface-background: var(--md-sys-color-surface-container-low);
  --markdown-border-color: var(--md-sys-color-outline-variant);
  --markdown-accent-color: var(--md-sys-color-primary);

  min-width: 0;
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.markdown-content--article {
  --markdown-block-gap: 20px;
  --markdown-heading-gap: 32px;

  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
}

.markdown-content--compact {
  --markdown-block-gap: 12px;
  --markdown-heading-gap: 18px;

  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.markdown-content :deep(*) {
  box-sizing: border-box;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin: 0 0 var(--markdown-block-gap);
  color: var(--md-sys-color-on-surface);
  font-weight: var(--md-ref-typeface-weight-bold);
  overflow-wrap: anywhere;
}

.markdown-content :deep(h1:not(:first-child)),
.markdown-content :deep(h2:not(:first-child)),
.markdown-content :deep(h3:not(:first-child)) {
  margin-top: var(--markdown-heading-gap);
}

.markdown-content :deep(h1) {
  font-size: var(--md-sys-typescale-headline-large-size);
  line-height: var(--md-sys-typescale-headline-large-line-height);
  letter-spacing: var(--md-sys-typescale-headline-large-tracking);
}

.markdown-content :deep(h2) {
  font-size: var(--md-sys-typescale-headline-medium-size);
  line-height: var(--md-sys-typescale-headline-medium-line-height);
  letter-spacing: var(--md-sys-typescale-headline-medium-tracking);
}

.markdown-content :deep(h3) {
  font-size: var(--md-sys-typescale-title-large-size, var(--md-sys-typescale-body-large-size));
  line-height: var(
    --md-sys-typescale-title-large-line-height,
    var(--md-sys-typescale-body-large-line-height)
  );
  letter-spacing: var(--md-sys-typescale-title-large-tracking, 0);
}

.markdown-content :deep(p),
.markdown-content :deep(ul),
.markdown-content :deep(ol),
.markdown-content :deep(blockquote),
.markdown-content :deep(pre),
.markdown-content :deep(table),
.markdown-content :deep(hr) {
  margin: 0 0 var(--markdown-block-gap);
}

.markdown-content :deep(p),
.markdown-content :deep(li),
.markdown-content :deep(blockquote),
.markdown-content :deep(td),
.markdown-content :deep(th) {
  overflow-wrap: anywhere;
}

.markdown-content :deep(a) {
  color: var(--markdown-accent-color);
  text-decoration-thickness: max(1px, 0.08em);
  text-underline-offset: 0.18em;
}

.markdown-content :deep(strong) {
  font-weight: var(--md-ref-typeface-weight-bold);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-inline-start: 1.5em;
}

.markdown-content :deep(li + li) {
  margin-top: calc(var(--markdown-block-gap) * 0.35);
}

.markdown-content :deep(blockquote) {
  padding: 12px 16px;
  border-inline-start: 4px solid var(--markdown-border-color);
  background-color: var(--markdown-surface-background);
  border-radius: var(--md-sys-shape-corner-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.markdown-content :deep(code) {
  padding: 0.12em 0.32em;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--markdown-inline-code-background);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92em;
}

.markdown-content :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
  padding: 16px;
  border-radius: var(--md-sys-shape-corner-large);
  background-color: var(--md-sys-color-surface-container);
}

.markdown-content :deep(pre code) {
  display: block;
  padding: 0;
  background-color: transparent;
  white-space: pre;
}

.markdown-content :deep(table) {
  display: block;
  overflow-x: auto;
  width: max-content;
  max-width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.markdown-content :deep(thead) {
  background-color: var(--md-sys-color-surface-container-low);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 10px 12px;
  border: 1px solid var(--markdown-border-color);
  text-align: left;
  vertical-align: top;
}

.markdown-content :deep(hr) {
  border: 0;
  border-top: 1px solid var(--markdown-border-color);
}

.markdown-content :deep(:last-child) {
  margin-bottom: 0;
}
</style>
