<script setup lang="ts">
import { MDSymbol } from '../Icon';
import MDTextField from './MDTextField.vue';
</script>

<template>
  <div class="grid">
    <MDTextField
      label-text="Label text"
      supporting-text="Supporting text"
      :max-characters="20"
    />

    <MDTextField label-text="Label text" supporting-text="Supporting text">
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>
    </MDTextField>

    <MDTextField label-text="Label text" supporting-text="Supporting text">
      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>

    <MDTextField label-text="Label text" supporting-text="Supporting text">
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>

      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>
  </div>

  <div class="grid">
    <MDTextField
      disabled
      label-text="Label text"
      supporting-text="Supporting text"
    />

    <MDTextField
      disabled
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>
    </MDTextField>

    <MDTextField
      disabled
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>

    <MDTextField
      disabled
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>

      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>
  </div>

  <div class="grid">
    <MDTextField
      error
      label-text="Label text"
      supporting-text="Supporting text"
    />

    <MDTextField
      error
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>
    </MDTextField>

    <MDTextField
      error
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>

    <MDTextField
      error
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>

      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>
  </div>

  <div class="grid">
    <MDTextField
      label-text="Label text"
      supporting-text="Supporting text"
      input-type="multiline"
    />

    <MDTextField
      input-type="multiline"
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>
    </MDTextField>

    <MDTextField
      input-type="multiline"
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>

    <MDTextField
      input-type="multiline"
      label-text="Label text"
      supporting-text="Supporting text"
    >
      <template #leadingIcon>
        <MDSymbol name="search" />
      </template>

      <template #trailingIcon>
        <MDSymbol name="cancel" />
      </template>
    </MDTextField>
  </div>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px;
  justify-content: center;
  align-items: center;
  background-color: var(--md-sys-color-surface);
  --md-container-color: var(--md-sys-color-surface);
}
</style>
