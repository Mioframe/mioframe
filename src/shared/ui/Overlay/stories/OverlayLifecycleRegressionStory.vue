<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import type { MaybeElement } from '@vueuse/core';
import { MDMenuBase } from '../../Menu';
import { MDOverlayTooltip, MDRichTooltip } from '../../Tooltips';
import { MDButton } from '@shared/ui/material';

const menuTargetEl = useTemplateRef<MaybeElement>('menuTargetEl');
const nestedMenuTargetEl = useTemplateRef<MaybeElement>('nestedMenuTargetEl');

const showMenu = ref(false);
const showNestedMenu = ref(false);

const menuSelectCount = ref(0);
const nestedMenuPickCount = ref(0);
const menuOutsideActionCount = ref(0);
const menuInteractionOutsideCount = ref(0);
const nestedMenuInteractionOutsideCount = ref(0);

const onOpenMenu = () => {
  showMenu.value = true;
};

const onOpenNestedMenu = () => {
  showNestedMenu.value = true;
};

const onSelectMenuItem = () => {
  menuSelectCount.value += 1;
  showMenu.value = false;
};

// Reset nested menu state whenever the parent closes, through any path
// (item selection or outside interaction), so a later reopen always starts
// from a valid closed-child state.
watch(showMenu, (open) => {
  if (!open) {
    showNestedMenu.value = false;
  }
});

const onPickNestedMenuItem = () => {
  nestedMenuPickCount.value += 1;
};

const onClickMenuOutsideButton = () => {
  menuOutsideActionCount.value += 1;
};

const onMenuInteractionOutside = () => {
  menuInteractionOutsideCount.value += 1;
};

const onNestedMenuInteractionOutside = () => {
  nestedMenuInteractionOutsideCount.value += 1;
};

const overlayTooltipTargetEl = useTemplateRef<MaybeElement>('overlayTooltipTargetEl');

const showOverlayTooltip = ref(false);

const overlayTooltipActionCount = ref(0);
const overlayTooltipOutsideActionCount = ref(0);
const overlayTooltipInteractionOutsideCount = ref(0);

const onOpenOverlayTooltip = () => {
  showOverlayTooltip.value = true;
};

const onOverlayTooltipAction = () => {
  overlayTooltipActionCount.value += 1;
};

const onClickOverlayTooltipOutsideButton = () => {
  overlayTooltipOutsideActionCount.value += 1;
};

const onOverlayTooltipInteractionOutside = () => {
  overlayTooltipInteractionOutsideCount.value += 1;
  showOverlayTooltip.value = false;
};

const richTooltipTargetEl = useTemplateRef<MaybeElement>('richTooltipTargetEl');

const richTooltipActionCount = ref(0);
const richTooltipOutsideActionCount = ref(0);
const richTooltipInteractionOutsideCount = ref(0);

const onRichTooltipAction = () => {
  richTooltipActionCount.value += 1;
};

const onClickRichTooltipOutsideButton = () => {
  richTooltipOutsideActionCount.value += 1;
};

const onRichTooltipInteractionOutside = () => {
  richTooltipInteractionOutsideCount.value += 1;
};
</script>

<template>
  <div class="overlay-lifecycle-regression-story">
    <section class="overlay-lifecycle-regression-story__menu-section">
      <MDButton ref="menuTargetEl" label="Open menu" @click="onOpenMenu" />
      <MDButton label="Menu outside action" @click="onClickMenuOutsideButton" />

      <MDMenuBase
        v-model:show="showMenu"
        :target="menuTargetEl"
        role="group"
        aria-label="Lifecycle regression menu"
        @interaction-outside="onMenuInteractionOutside"
      >
        <button type="button" @click="onSelectMenuItem">Select A</button>
        <button ref="nestedMenuTargetEl" type="button" @click="onOpenNestedMenu">
          Open nested menu
        </button>

        <MDMenuBase
          v-model:show="showNestedMenu"
          :target="nestedMenuTargetEl"
          role="group"
          aria-label="Nested lifecycle menu"
          @interaction-outside="onNestedMenuInteractionOutside"
        >
          <button type="button" @click="onPickNestedMenuItem">Pick nested action</button>
        </MDMenuBase>
      </MDMenuBase>

      <p>Select A activated {{ menuSelectCount }} time(s)</p>
      <p>Nested pick activated {{ nestedMenuPickCount }} time(s)</p>
      <p>Menu outside action activated {{ menuOutsideActionCount }} time(s)</p>
      <p>Menu closed by outside interaction {{ menuInteractionOutsideCount }} time(s)</p>
      <p>
        Nested menu closed by outside interaction {{ nestedMenuInteractionOutsideCount }} time(s)
      </p>
    </section>

    <section class="overlay-lifecycle-regression-story__overlay-tooltip-section">
      <MDButton
        ref="overlayTooltipTargetEl"
        label="Open overlay tooltip"
        @click="onOpenOverlayTooltip"
      />
      <MDButton
        label="Overlay tooltip outside action"
        @click="onClickOverlayTooltipOutsideButton"
      />

      <MDOverlayTooltip
        v-model:show="showOverlayTooltip"
        :target-element="overlayTooltipTargetEl"
        @interaction-outside="onOverlayTooltipInteractionOutside"
      >
        <button type="button" @click="onOverlayTooltipAction">Overlay tooltip action</button>
      </MDOverlayTooltip>

      <p>Overlay tooltip action activated {{ overlayTooltipActionCount }} time(s)</p>
      <p>Overlay tooltip outside action activated {{ overlayTooltipOutsideActionCount }} time(s)</p>
      <p>
        Overlay tooltip closed by outside interaction
        {{ overlayTooltipInteractionOutsideCount }} time(s)
      </p>
    </section>

    <section class="overlay-lifecycle-regression-story__rich-tooltip-section">
      <MDButton ref="richTooltipTargetEl" label="Open rich tooltip" />
      <MDButton label="Rich tooltip outside action" @click="onClickRichTooltipOutsideButton" />

      <MDRichTooltip
        :target-element="richTooltipTargetEl"
        use-click
        subhead="Lifecycle regression"
        @interaction-outside="onRichTooltipInteractionOutside"
      >
        <template #text>
          <button type="button" @click="onRichTooltipAction">Rich tooltip action</button>
        </template>
      </MDRichTooltip>

      <p>Rich tooltip action activated {{ richTooltipActionCount }} time(s)</p>
      <p>Rich tooltip outside action activated {{ richTooltipOutsideActionCount }} time(s)</p>
      <p>
        Rich tooltip closed by outside interaction {{ richTooltipInteractionOutsideCount }} time(s)
      </p>
    </section>
  </div>
</template>
