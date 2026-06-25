<script setup lang="ts">
import { computed } from 'vue';
import MarkdownHelpPane from '@page/MarkdownHelpPane/MarkdownHelpPane.vue';
import { useStackNavigation } from '@page/routes';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { getHelpArticleBySlug, resolveHelpArticleHref } from './helpCatalog';

const props = defineProps<{ slug: string; anchor?: string | undefined }>();

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { open } = useStackNavigation();
const article = computed(() => getHelpArticleBySlug(props.slug));

const onContentClick = async (event: MouseEvent) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const articleRoot = event.currentTarget;
  if (!(articleRoot instanceof HTMLElement)) {
    return;
  }

  const link =
    event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!link || !articleRoot.contains(link)) {
    return;
  }

  const currentArticle = article.value;
  if (!currentArticle) {
    return;
  }

  const resolvedLink = resolveHelpArticleHref(
    currentArticle.sourcePath,
    link.getAttribute('href') ?? '',
  );

  if (!resolvedLink) {
    return;
  }

  event.preventDefault();
  await open(
    'helpArticle',
    { slug: resolvedLink.slug, anchor: resolvedLink.anchor ?? undefined },
    { target: 'helpArticle' },
  );
};
</script>

<template>
  <MarkdownHelpPane
    v-if="article"
    :headline="article.title"
    :markdown="article.markdown"
    :anchor="anchor"
    pane-class="help-article-pane"
    @content-click="onContentClick"
  >
    <template #navigationButton>
      <slot name="navigationButton" />
    </template>

    <template #appBarTrailing>
      <slot name="appBarTrailing" />
    </template>
  </MarkdownHelpPane>

  <MDPane v-else allow-bottom-navigation>
    <MDAppBar headline="Help article not found">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="help-article-pane__not-found">The requested help article could not be found.</div>
  </MDPane>
</template>

<style scoped>
.help-article-pane__not-found {
  padding: 16px;
}
</style>
