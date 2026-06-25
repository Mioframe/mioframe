<script setup lang="ts">
import { useStackNavigation } from '@page/routes';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { helpCatalog } from './helpCatalog';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { open } = useStackNavigation();

const onSelectArticle = async (slug: string) => {
  await open('helpArticle', { slug }, { target: 'helpArticle' });
};
</script>

<template>
  <MDPane allow-bottom-navigation>
    <MDAppBar headline="Help">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="help-index-pane__content">
      <p class="help-index-pane__summary">
        Read data storage, backup, restore, and troubleshooting guides.
      </p>

      <MDList tag="div">
        <MDListItem
          v-for="article in helpCatalog"
          :key="article.slug"
          mode="single-action"
          :label-text="article.title"
          @action="onSelectArticle(article.slug)"
        />
      </MDList>
    </div>
  </MDPane>
</template>

<style scoped>
.help-index-pane__content {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.help-index-pane__summary {
  margin: 0;
}
</style>
