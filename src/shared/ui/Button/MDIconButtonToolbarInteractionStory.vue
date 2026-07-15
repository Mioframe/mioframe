<script setup lang="ts">
import { reactive, ref } from 'vue';
import MDIconButton from './MDIconButton.vue';

type ToolbarButtonId = 'add' | 'filter' | 'sort' | 'search';

const buttonOrder: ToolbarButtonId[] = ['add', 'filter', 'sort', 'search'];

const clickCounts = reactive<Record<ToolbarButtonId, number>>({
  add: 0,
  filter: 0,
  sort: 0,
  search: 0,
});

const hoveredButton = ref<ToolbarButtonId | 'none'>('none');

const onClick = (buttonId: ToolbarButtonId) => {
  clickCounts[buttonId] += 1;
};

const onPointerEnter = (buttonId: ToolbarButtonId) => {
  hoveredButton.value = buttonId;
};

const onPointerLeave = (buttonId: ToolbarButtonId) => {
  if (hoveredButton.value === buttonId) {
    hoveredButton.value = 'none';
  }
};
</script>

<template>
  <div
    id="visual-md-icon-button-toolbar-interaction"
    class="visual-checker-backdrop md-icon-button-toolbar-interaction"
  >
    <div class="md-icon-button-toolbar-interaction__row" role="toolbar" aria-label="Dense toolbar">
      <span
        v-for="buttonId in buttonOrder"
        :key="buttonId"
        class="md-icon-button-toolbar-interaction__button"
        @pointerenter="onPointerEnter(buttonId)"
        @pointerleave="onPointerLeave(buttonId)"
      >
        <MDIconButton
          :tooltip="buttonId"
          :md-symbol-name="
            buttonId === 'add'
              ? 'add'
              : buttonId === 'filter'
                ? 'filter_list'
                : buttonId === 'sort'
                  ? 'sort'
                  : 'search'
          "
          color="standard"
          @click="onClick(buttonId)"
        />
      </span>
    </div>
    <div class="md-icon-button-toolbar-interaction__status">
      <p>
        Hovered:
        <output id="toolbar-hovered-button">{{ hoveredButton }}</output>
      </p>
      <p v-for="buttonId in buttonOrder" :key="`${buttonId}-count`">
        {{ buttonId }}:
        <output :id="`toolbar-count-${buttonId}`">{{ clickCounts[buttonId] }}</output>
      </p>
    </div>
  </div>
</template>

<style scoped>
.md-icon-button-toolbar-interaction {
  display: grid;
  gap: 12dp;
  justify-items: start;
  padding: 12dp;

  &__row {
    display: inline-flex;
    align-items: center;
    gap: 4dp;
    padding: 4dp;
    border-radius: 12dp;
    background: var(--md-sys-color-surface-container-low);
  }

  &__button {
    display: inline-flex;
  }

  &__status {
    display: grid;
    gap: 4dp;

    p {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
    }
  }
}
</style>
