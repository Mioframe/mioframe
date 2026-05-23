<script setup lang="ts">
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';

const emit = defineEmits<{
  close: [];
}>();

const onClose = () => {
  emit('close');
};
</script>

<template>
  <MDBottomSheet label="Как хранятся документы" @closed="onClose">
    <MDBottomSheetSection class="mioframe-storage-info-sheet">
      <h2 class="mioframe-storage-info-sheet__title">Как хранятся документы</h2>

      <div class="mioframe-storage-info-sheet__content">
        <p>Mioframe показывает документы отдельно, а служебные файлы скрывает в списке файлов.</p>
        <p>Эти файлы находятся в текущей папке и нужны для сохранения, истории и восстановления.</p>
        <p>Обычно их не нужно открывать или изменять вручную.</p>
        <p>Пространство Mioframe — это папка целиком.</p>
        <p>Документы Mioframe показываются отдельно от обычных файлов.</p>
        <p>
          Служебные файлы скрыты по умолчанию и обычно не требуют ручного открытия или изменения.
        </p>
        <p>Для переноса или бэкапа нужно копировать всю папку пространства.</p>
      </div>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style scoped>
.mioframe-storage-info-sheet {
  padding: 0 16px 24px;
  gap: 16px;
}

.mioframe-storage-info-sheet__title {
  margin: 0;
  font-family: var(--md-sys-typescale-headline-small-font);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
}

.mioframe-storage-info-sheet__content {
  display: grid;
  gap: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.mioframe-storage-info-sheet__content p {
  margin: 0;
}
</style>
