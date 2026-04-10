<script setup lang="ts">
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDSymbol } from '@shared/ui/Icon';
import { isNil, uniq } from 'es-toolkit';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import type { ParentRelation, RelationValue } from './model';
import { zodRelationValue } from './model';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseViewId } from '@shared/lib/databaseDocument';
import { useRelationProperty } from './useRelationProperty';
import { hasOwnKey } from '@shared/lib/typeGuards/hasOwnKey';
import { get } from 'es-toolkit/compat';
import { MDButton } from '@shared/ui/Button';
import { unrefElement, type MaybeElement } from '@vueuse/core';
import { MDRichTooltip } from '@shared/ui/Tooltips';

const props = defineProps<{
  value: unknown;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
  directoryPath: string;
  parentRelation?: ParentRelation | undefined;
}>();

const { directoryPath, value, documentId, propertyId, parentRelation } = toRefs(props);

defineSlots<{
  default: (p: {
    value: RelationValue;
    relationDocumentId: AMDocumentId;
    relationDirectoryPath: string;
    viewId?: DatabaseViewId | undefined;
    parentRelation: ParentRelation;
  }) => unknown;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { property } = useRelationProperty(directoryPath, documentId, propertyId);

const verifiedValue = computed(() =>
  zodIs(value.value, zodRelationValue) && value.value.length > 0 ? value.value : undefined,
);

const relationDocumentId = computed(() => property.value?.relation.documentId);

const relationViewId = computed(() => property.value?.relation.viewId);

const hasRenderRecursion = computed(() => {
  if (
    parentRelation.value &&
    hasOwnKey(parentRelation.value, propertyId.value) &&
    verifiedValue.value
  ) {
    return verifiedValue.value.some((itemId) =>
      get(parentRelation.value, propertyId.value)?.includes(itemId),
    );
  }
  return false;
});

const mergedParentRelation = computed((): ParentRelation => {
  return {
    ...parentRelation.value,
    [propertyId.value]: uniq([
      ...(parentRelation.value?.[propertyId.value] ?? []),
      ...(verifiedValue.value ?? []),
    ]),
  };
});

const showValue = ref<boolean | undefined>(false);

const showSubRelationButton = useTemplateRef<MaybeElement>('showSubRelationButton');

const interactionOutside = (e: Event) => {
  if (
    e.type !== 'click' ||
    !(e.target instanceof Node) ||
    !unrefElement(showSubRelationButton)?.contains(e.target)
  ) {
    showValue.value = false;
  }
};
</script>

<template>
  <div class="relation-value" @click="emit('click')">
    <MDSymbol
      v-if="isNil(verifiedValue) || !relationDocumentId"
      name="unknown_med"
      class="relation-value__empty"
    />

    <div v-else-if="hasRenderRecursion">
      <MDButton
        ref="showSubRelationButton"
        :label="`${showValue ? 'hide' : 'show'} value`"
        color="text"
        size="small"
        @click="showValue = !showValue"
      >
        <template #icon>
          <MDSymbol v-if="!showValue" name="visibility" />

          <MDSymbol v-else name="visibility_off" />
        </template>
      </MDButton>

      <MDRichTooltip
        v-if="property"
        v-model:show="showValue"
        :subhead="property?.name"
        :target-element="showSubRelationButton"
        @interaction-outside="interactionOutside"
      >
        <template v-if="showValue" #text>
          <slot
            :value="verifiedValue"
            :relation-document-id="relationDocumentId"
            :relation-directory-path="directoryPath"
            :view-id="relationViewId"
            :parent-relation="mergedParentRelation"
          >
            {{ verifiedValue }}
          </slot>
        </template>
      </MDRichTooltip>
    </div>

    <template v-else>
      <slot
        :value="verifiedValue"
        :relation-document-id="relationDocumentId"
        :relation-directory-path="directoryPath"
        :view-id="relationViewId"
        :parent-relation="mergedParentRelation"
      >
        {{ verifiedValue }}
      </slot>
    </template>
  </div>
</template>

<style lang="css" scoped>
.relation-value {
  display: inline-block;

  &__empty {
    opacity: 0.5;
  }
}
</style>
