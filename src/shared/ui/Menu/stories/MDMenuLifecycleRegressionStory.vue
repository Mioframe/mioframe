<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import type { MaybeElement } from '@vueuse/core';
import MDMenuBase from '../MDMenuBase.vue';
import { MDButton } from '../../Button';

const targetEl = useTemplateRef<MaybeElement>('targetEl');
const nestedTargetEl = useTemplateRef<MaybeElement>('nestedTargetEl');

const showMenu = ref(false);
const showNestedMenu = ref(false);

const selectCount = ref(0);
const nestedPickCount = ref(0);
const outsideActionCount = ref(0);
const menuInteractionOutsideCount = ref(0);
const nestedInteractionOutsideCount = ref(0);

const onOpenMenu = () => {
  showMenu.value = true;
};

const onOpenNestedMenu = () => {
  showNestedMenu.value = true;
};

const onSelect = () => {
  selectCount.value += 1;
  showMenu.value = false;
};

const onPickNested = () => {
  nestedPickCount.value += 1;
};

const onClickOutsideButton = () => {
  outsideActionCount.value += 1;
};

const onMenuInteractionOutside = () => {
  menuInteractionOutsideCount.value += 1;
};

const onNestedInteractionOutside = () => {
  nestedInteractionOutsideCount.value += 1;
};
</script>

<template>
  <div>
    <MDButton ref="targetEl" label="Open menu" @click="onOpenMenu" />
    <MDButton label="Outside action" @click="onClickOutsideButton" />

    <MDMenuBase
      v-model:show="showMenu"
      :target="targetEl"
      role="group"
      aria-label="Lifecycle regression menu"
      @interaction-outside="onMenuInteractionOutside"
    >
      <button type="button" @click="onSelect">Select A</button>
      <button ref="nestedTargetEl" type="button" @click="onOpenNestedMenu">Open nested menu</button>

      <MDMenuBase
        v-model:show="showNestedMenu"
        :target="nestedTargetEl"
        role="group"
        aria-label="Nested lifecycle menu"
        @interaction-outside="onNestedInteractionOutside"
      >
        <button type="button" @click="onPickNested">Pick nested action</button>
      </MDMenuBase>
    </MDMenuBase>

    <p>Select A activated {{ selectCount }} time(s)</p>
    <p>Nested pick activated {{ nestedPickCount }} time(s)</p>
    <p>Outside action activated {{ outsideActionCount }} time(s)</p>
    <p>Menu closed by outside interaction {{ menuInteractionOutsideCount }} time(s)</p>
    <p>Nested menu closed by outside interaction {{ nestedInteractionOutsideCount }} time(s)</p>
  </div>
</template>
