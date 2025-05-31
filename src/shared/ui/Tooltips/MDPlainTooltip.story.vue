<script setup lang="ts">
import { useTemplateRef } from 'vue';
import MDPlainTooltip from './MDPlainTooltip.vue';

const targetEl = useTemplateRef('targetEl');
</script>

<template>
  <Story title="Tooltips/Plain Tooltip">
    <Variant title="easy to using">
      <button type="button">
        button with Plain Tooltip
        <MDPlainTooltip text="tooltip text" />
      </button>
    </Variant>

    <Variant title="use with target">
      <button ref="targetEl" type="button">button with Plain Tooltip</button>

      <MDPlainTooltip :target-element="targetEl" text="tooltip text" />
    </Variant>
  </Story>
</template>

<docs lang="md">
# Plain Tooltip

Подсказка при наведении

Соответствует [Tooltips - Material Design 3](https://m3.material.io/components/tooltips/overview)

## Интеграция

По умолчанию регистрируется на наведение родительского элемента.

В параметрах можно указать ссылку на целевой элемент.

## Поведение

Самостоятельно определяет наведение и выбирает предпочтительную сторону отображения учитывая размер содержимого и расположение в окне браузера.
</docs>
