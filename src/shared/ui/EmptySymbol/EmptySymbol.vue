<script setup lang="ts">
import { sample } from 'remeda';

const symbols = [
  '🕳️',
  '❓',
  '🚫',
  '📭',
  '📄',
  '😶',
  '🌀',
  '🕸️',
  '🧩',
  '🌫️',
  '¯\\(ツ)/¯',
  '(╯°□°）╯︵ ┻━┻',
  '( •_•)',
  '¯\\(°_o)/¯',
  '(￣ー￣)',
  '(✖╭╮✖)',
  '＜(。•́︿•̀。)＞',
  'ヽ(ಠ_ಠ)ノ',
  '(╥﹏╥)',
];

const [randomSymbol] = sample(symbols, 1);
</script>

<template>
  <div class="empty-symbol">
    <span class="empty-symbol__icon md sys typescale display-large">
      {{ randomSymbol }}
    </span>

    <span class="empty-symbol__label md sys typescale label-large">
      It's empty here yet
    </span>
  </div>
</template>

<style lang="css" scoped>
.empty-symbol {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;

  &__icon {
    font-size: large;
  }
}
</style>
