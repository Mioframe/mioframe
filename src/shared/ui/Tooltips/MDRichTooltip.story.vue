<script setup lang="ts">
import { MDButton } from '../Button';
import MDRichTooltip from './MDRichTooltip.vue';

const onClickLearnMore = () => {
  window.open(
    'https://m3.material.io/components/tooltips/guidelines',
    '_blank',
  );
};

const loremIpsum =
  'By default, rich tooltips are positioned to the bottom right of the parent element. They adjust position to avoid going off screen.';
</script>

<template>
  <Story title="Tooltips/Rich Tooltip">
    <Variant title="target top left">
      <div class="flex">
        <button type="button">
          target element
          <MDRichTooltip use-hover subhead="Subhead text">
            <template #text>
              {{ loremIpsum }}
            </template>
          </MDRichTooltip>
        </button>
      </div>
    </Variant>

    <Variant title="target top right">
      <div class="flex">
        <button type="button" class="ml">
          target element
          <MDRichTooltip use-hover subhead="Subhead text">
            <template #text>
              {{ loremIpsum }}
            </template>
          </MDRichTooltip>
        </button>
      </div>
    </Variant>

    <Variant title="target bottom right">
      <div class="flex">
        <button type="button" class="ml mt">
          target element
          <MDRichTooltip use-hover subhead="Subhead text">
            <template #text>
              {{ loremIpsum }}
            </template>
          </MDRichTooltip>
        </button>
      </div>
    </Variant>

    <Variant title="target bottom left">
      <div class="flex">
        <button type="button" class="mt">
          target element
          <MDRichTooltip use-hover subhead="Subhead text">
            <template #text>
              {{ loremIpsum }}
            </template>
          </MDRichTooltip>
        </button>
      </div>
    </Variant>

    <Variant title="display on click">
      <button type="button">
        target element

        <MDRichTooltip use-click subhead="Subhead text">
          <template #text>
            {{ loremIpsum }}
          </template>

          <template #actions>
            <MDButton
              label="Learn more"
              color="text"
              @click="onClickLearnMore"
            />
          </template>
        </MDRichTooltip>
      </button>
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

  .ml {
    margin-left: auto;
  }

  .mt {
    margin-top: auto;
  }
}
</style>

<docs lang="md">
# Rich Tooltip

Rich tooltips provide additional context about a UI element. They can optionally contain a subhead, buttons, and hyperlinks.

[Tooltips - Material Design 3](https://m3.material.io/components/tooltips/overview)
</docs>
