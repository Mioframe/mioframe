<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { uniqueId } from '@shared/lib/uniqueId';
import type { EmptyObject } from 'type-fest';
import { useFirstFocus } from '@shared/lib/useFirstFocus';

const { type = 'outlined', numberCharacters = 0 } = defineProps<{
  labelText: string;
  supportingText?: string;
  type?: 'filled' | 'outlined';
  disabled?: boolean;
  error?: boolean;
  maxCharacters?: number;
  filled?: boolean;
  numberCharacters?: number;
}>();

defineSlots<{
  default(p: { id: string }): unknown;
  leadingIcon(p: EmptyObject): unknown;
  trailingIcon(p: EmptyObject): unknown;
}>();

const id = uniqueId('MDFieldContainer');

const containerRef = useTemplateRef<HTMLElement>('containerRef');

const { focused } = useFirstFocus(containerRef, {
  initialValue: false,
});

const onClickField = () => {
  focused.value = true;
};
</script>

<template>
  <section
    class="md-field-container"
    :class="[
      {
        'md-field-container_empty': !filled,
        'md-field-container_filled': filled,
        'md-field-container_disabled': disabled,
        'md-field-container_error': error,
      },
      `md-field-container_${type}-type`,
    ]"
  >
    <div class="md md-field-container__container" @click="onClickField">
      <span
        v-if="!!$slots.leadingIcon"
        class="md-field-container__leading-icon"
      >
        <slot name="leadingIcon" />
      </span>

      <div class="md-field-container__body">
        <label class="md-field-container__label-text" :for="id">
          {{ labelText }}
        </label>

        <div ref="containerRef" class="md-field-container__input-container">
          <slot :id />
        </div>
      </div>

      <span
        v-if="!!$slots.trailingIcon"
        class="md-field-container__trailing-icon"
      >
        <slot name="trailingIcon" />
      </span>
    </div>

    <div
      v-if="!!supportingText || !!maxCharacters"
      class="md-field-container__supporting-text"
    >
      <span>
        {{ supportingText }}
      </span>

      <span v-if="maxCharacters">
        {{ numberCharacters }}/{{ maxCharacters }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.md-field-container {
  position: relative;
  flex-grow: 1;
  --md-field-container-background: var(--md-container-color);
  background-color: var(--md-field-container-background);

  &.md-field-container_disabled {
    pointer-events: none;
  }

  &__container {
    --md-container-color: var(--md-sys-color-surface-container-highest);
    --md-content-color: var(--md-sys-color-on-surface);

    border-radius: var(--md-sys-shape-corner-extra-small-top);
    border-bottom: 1px solid var(--md-sys-color-on-surface-variant);

    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-height: 56px;
    padding: 8px 16px 7px;
    box-sizing: border-box;

    .md-field-container_outlined-type & {
      --md-container-color: inherit;

      border-radius: var(--md-sys-shape-corner-extra-small);
      border: 1px solid var(--md-sys-color-outline);
      padding: 7px 15px 7px;
    }

    .md-field-container_disabled & {
      background-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.04);
      border-bottom-color: rgb(
        from var(--md-sys-color-on-surface) r g b / 0.38
      );
      pointer-events: none;
    }

    .md-field-container_outlined-type.md-field-container_disabled & {
      border-color: rgb(from var(--md-sys-color-on-surface) r g b / 0.12);
      background-color: inherit;
    }

    .md-field-container:hover & {
      border-bottom: 1px solid var(--md-sys-color-on-surface);
      padding-bottom: 7px;
    }

    .md-field-container_outlined-type:hover & {
      border-color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within & {
      border-bottom: 2px solid var(--md-sys-color-primary);
      padding-bottom: 6px;
    }

    .md-field-container_outlined-type:focus-within & {
      border: 2px solid var(--md-sys-color-primary);
      padding: 6px 14px;
    }

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within & {
      border-color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      border-color: var(--md-sys-color-on-error-container);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    cursor: text;

    .md-field-container__leading-icon ~ & {
      margin-left: 16px;

      .md-field-container__label-text {
        left: 51px;
      }
    }
  }

  &__label-text {
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-large-font);
    line-height: var(--md-sys-typescale-body-large-line-height);
    height: 1lh;
    font-size: var(--md-sys-typescale-body-large-size);
    font-weight: var(--md-sys-typescale-body-large-weight);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    grid-area: label-text;
    transition-property: height, line-height, font-size, top, left;
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-timing-function: var(--md-sys-motion-easing-standard-index);
    cursor: text;

    .md-field-container_outlined-type & {
      display: inline-block;
      padding: 0 4px;

      position: absolute;
      top: 15px;
      left: 15px;
    }

    .md-field-container__leading-icon ~ & {
      margin-left: 16px;
    }

    .md-field-container:focus-within &,
    .md-field-container_filled & {
      line-height: var(--md-sys-typescale-body-small-line-height);
      font-size: var(--md-sys-typescale-body-small-size);
    }
    .md-field-container_outlined-type:focus-within &,
    .md-field-container_outlined-type.md-field-container_filled & {
      position: absolute;
      top: -8px;
      padding: 0 4px;
      left: 8px;
      background-color: var(--md-field-container-background);
    }

    .md-field-container_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_outlined-type:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within & {
      color: var(--md-sys-color-primary);
    }

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within & {
      color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-error-container);
    }
  }

  &__trailing-icon,
  &__leading-icon {
    color: var(--md-sys-color-on-surface-variant);

    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;

    .md-field-container_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_outlined-type:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within & {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__leading-icon {
    margin-left: -4px;
    grid-area: leading-icon;

    .md-field-container_error & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }
  }

  &__trailing-icon {
    margin-left: 16px;
    margin-right: -4px;
    grid-area: trailing-icon;

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within & {
      color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-error-container);
    }
  }

  &__input-container {
    all: initial;
    color: var(--md-sys-color-on-surface);
    font-family: var(--md-sys-typescale-body-large-font);
    line-height: var(--md-sys-typescale-body-large-line-height);
    min-height: 1lh;
    font-size: var(--md-sys-typescale-body-large-size);
    font-weight: var(--md-sys-typescale-body-large-weight);
    letter-spacing: var(--md-sys-typescale-body-large-tracking);
    caret-color: var(--md-sys-color-primary);
    transition-property: height, min-height;
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-timing-function: var(--md-sys-motion-easing-standard-index);
    scrollbar-width: none;

    .md-field-container_empty:not(:focus-within) & {
      opacity: 0;
      height: 0 !important;
      min-height: 0 !important;
    }

    .md-field-container_disabled & {
      pointer-events: none;
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container:focus-within & {
      color: var(--md-sys-color-on-surface);
    }

    .md-field-container_error & {
      color: var(--md-sys-color-on-surface);
      caret-color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-on-surface);
    }
  }

  &__supporting-text {
    font-family: var(--md-sys-typescale-body-small-font);
    font-weight: var(--md-sys-typescale-body-small-weight);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
    color: var(--md-sys-color-on-surface-variant);

    display: flex;
    column-gap: 16px;
    justify-content: space-between;
    margin-top: 4px;
    padding: 0 16px;

    .md-field-container_disabled & {
      color: rgb(from var(--md-sys-color-on-surface) r g b / 0.38);
    }

    .md-field-container:hover & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container:focus-within & {
      color: var(--md-sys-color-on-surface-variant);
    }

    .md-field-container_error &,
    .md-field-container_error.md-field-container:focus-within & {
      color: var(--md-sys-color-error);
    }

    .md-field-container_error:hover & {
      color: var(--md-sys-color-error);
    }
  }
}
</style>
