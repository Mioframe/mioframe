<script setup lang="ts">
import { useTemplateRef } from 'vue';
import MDPlainTooltip from './MDPlainTooltip.vue';

const targetEl = useTemplateRef('targetEl');
</script>

<template>
  <Story title="Tooltips/Plain Tooltip">
    <Variant title="easy to using">
      <div class="flex">
        <button type="button">
          button with Plain Tooltip
          <MDPlainTooltip text="tooltip text" />
        </button>
      </div>
    </Variant>

    <Variant title="use with target">
      <div class="flex">
        <button ref="targetEl" type="button">button with Plain Tooltip</button>

        <MDPlainTooltip :target-element="targetEl" text="tooltip text" />
      </div>
    </Variant>

    <Variant title="target top right">
      <div class="flex">
        <button type="button" class="ml">
          button with Plain Tooltip
          <MDPlainTooltip text="tooltip text" />
        </button>
      </div>
    </Variant>

    <Variant title="target bottom right">
      <div class="flex">
        <button type="button" class="ml mt">
          button with Plain Tooltip
          <MDPlainTooltip text="tooltip text" />
        </button>
      </div>
    </Variant>

    <Variant title="target bottom left">
      <div class="flex">
        <button type="button" class="mt">
          button with Plain Tooltip
          <MDPlainTooltip text="tooltip text" />
        </button>
      </div>
    </Variant>
  </Story>
</template>

<style lang="css" scoped>
.flex {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  position: fixed;
  border: 1px solid red;
  padding: 10px;

  .ml {
    margin-left: auto;
  }

  .mt {
    margin-top: auto;
  }

  button {
    line-height: 2lh;
  }
}
</style>

<docs lang="md">
# Plain Tooltip

Подсказка при наведении

[Tooltips - Material Design 3](https://m3.material.io/components/tooltips/overview)

## Интеграция

По умолчанию регистрируется на наведение родительского элемента.

В параметрах можно указать ссылку на целевой элемент.

## Поведение

Самостоятельно определяет наведение и выбирает предпочтительную сторону отображения учитывая размер содержимого и расположение в окне браузера.
</docs>
