<script setup lang="ts">
import MDIconButton from '../Button/MDIconButton.vue';
import MDSymbol from '../Icon/MDSymbol.vue';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

const rootAttrs = {
  'data-testid': 'visual-md-list-configurations',
};
const onAction = () => {};
</script>

<template>
  <div v-bind="rootAttrs" class="visual-surface md-list-item-configurations-story">
    <section class="md-list-item-configurations-story__section">
      <h3 class="md-list-item-configurations-story__title">Standard</h3>
      <MDList class="md-list-item-configurations-story__list">
        <MDListItem label-text="One-line item" />
        <MDListItem
          label-text="Two-line item"
          supporting-text="Supporting text is clamped to one line in the two-line layout."
        />
        <MDListItem
          label-text="Three-line item"
          overline="Category"
          supporting-text="Supporting text can expand to two supporting lines in the three-line configuration."
        />
      </MDList>
    </section>

    <section class="md-list-item-configurations-story__section">
      <h3 class="md-list-item-configurations-story__title">Segmented</h3>
      <MDList list-style="segmented" class="md-list-item-configurations-story__list">
        <MDListItem mode="single-action" label-text="One-line item" @action="onAction">
          <template #leading>
            <MDSymbol name="draft" />
          </template>
          <template #trailing>
            <span class="md-list-item-configurations-story__trailing-text">12 min</span>
          </template>
        </MDListItem>

        <MDListItem
          mode="single-action"
          leading-type="avatar"
          label-text="Two-line avatar item"
          supporting-text="Avatar rows use the expressive leading slot geometry."
          @action="onAction"
        >
          <template #leading>
            <span class="md-list-item-configurations-story__avatar">AB</span>
          </template>
          <template #trailing>
            <MDSymbol name="chevron_right" />
          </template>
        </MDListItem>

        <MDListItem
          mode="multi-action"
          leading-type="media"
          label-text="Three-line media item"
          overline="Playlist"
          supporting-text="Media rows keep the content slot widest while the trailing action stays independent."
          :line-count="3"
          @action="onAction"
        >
          <template #leading>
            <span class="md-list-item-configurations-story__media" />
          </template>
          <template #trailingAction>
            <MDIconButton tooltip="Open menu" md-symbol-name="more_vert" />
          </template>
        </MDListItem>
      </MDList>
    </section>
  </div>
</template>

<style scoped>
.md-list-item-configurations-story {
  display: grid;
  gap: 24dp;
  width: min(360dp, calc(100vw - 32dp));
}

.md-list-item-configurations-story__section {
  display: grid;
  gap: 8dp;
}

.md-list-item-configurations-story__title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}

.md-list-item-configurations-story__list {
  width: 100%;
}

.md-list-item-configurations-story__avatar {
  display: grid;
  place-items: center;
  width: 40dp;
  height: 40dp;
  border-radius: 20dp;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  font-family: var(--md-sys-typescale-label-medium-font);
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  line-height: var(--md-sys-typescale-label-medium-line-height);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
}

.md-list-item-configurations-story__media {
  display: block;
  width: 56dp;
  height: 56dp;
  border-radius: 12dp;
  background:
    linear-gradient(135deg, rgb(from var(--md-sys-color-tertiary) r g b / 0.35), transparent),
    var(--md-sys-color-tertiary-container);
}

.md-list-item-configurations-story__trailing-text {
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
}
</style>
