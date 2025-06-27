<script setup lang="ts">
import { BooleanInline, PROPERTY_TYPE_BOOLEAN } from '@entity/databaseBoolean';
import { DateValueInline, PROPERTY_TYPE_DATE } from '@entity/databaseDate';
import { NumberValueInline, PROPERTY_TYPE_NUMBER } from '@entity/databaseNumber';
import { PROPERTY_TYPE_STRING, StringValueInline } from '@entity/databaseString';
import type { GeneralProperty } from '@shared/lib/databaseDocument/state/v1/property';

const {} = defineProps<{
  property: GeneralProperty;
  value: unknown;
}>();
</script>

<template>
  <BooleanInline v-if="property?.type === PROPERTY_TYPE_BOOLEAN" :value />

  <NumberValueInline v-else-if="property?.type === PROPERTY_TYPE_NUMBER" :value />

  <StringValueInline v-else-if="property?.type === PROPERTY_TYPE_STRING" :value />

  <DateValueInline v-else-if="property?.type === PROPERTY_TYPE_DATE" :value />
</template>
