<script setup lang="ts">
import { BooleanInline, PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty';
import { DateValueInline, PROPERTY_TYPE_DATE } from '@entity/dateProperty';
import { NumberSpan, PROPERTY_TYPE_NUMBER } from '@entity/numberProperty';
import { PROPERTY_TYPE_STRING, StringValueSpan } from '@entity/stringProperty';
import type { GeneralProperty } from '@shared/lib/databaseDocument/property';

const {} = defineProps<{
  property: GeneralProperty;
  value: unknown;
}>();
</script>

<template>
  <BooleanInline v-if="property?.type === PROPERTY_TYPE_BOOLEAN" :value />

  <NumberSpan v-else-if="property?.type === PROPERTY_TYPE_NUMBER" :value />

  <StringValueSpan v-else-if="property?.type === PROPERTY_TYPE_STRING" :value />

  <DateValueInline v-else-if="property?.type === PROPERTY_TYPE_DATE" :value />
</template>
