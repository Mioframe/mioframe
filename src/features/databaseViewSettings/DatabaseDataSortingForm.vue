<script setup lang="ts">
import {
  SORT_DIRECTION,
  type PropertyId,
  type SortDescription,
} from '@shared/lib/databaseDocument';
import type {
  GeneralProperty,
  PropertiesMap,
} from '@shared/lib/databaseDocument/property';
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';
import type { Option } from '@shared/ui/Select';
import { UISelect } from '@shared/ui/Select';
import { UIMenu } from '@shared/ui/TreeMenu';
import type { Entries } from 'type-fest';
import { computed, ref } from 'vue';
import SortDirectionBtn from './SortDirectionBtn.vue';

const props = defineProps<{
  properties: PropertiesMap;
  sorting?: SortDescription[];
}>();

const emit = defineEmits<{
  toggleDirection: [PropertyId];
  addSorting: [SortDescription];
}>();

const propertySortCollection = computed(
  (): [number, SortDescription & { property: GeneralProperty }][] =>
    props.sorting?.map(({ direction, propertyId, manual }, index) => [
      index,
      {
        direction,
        propertyId,
        property: props.properties[propertyId],
        manual,
      },
    ]) ?? [],
);

const propertyOptions = computed(
  (): (Option<PropertyId, PropertyId> & { property: GeneralProperty })[] =>
    (<Entries<typeof props.properties>>Object.entries(props.properties)).reduce<
      (Option<PropertyId, PropertyId> & {
        property: GeneralProperty;
      })[]
    >((acc, [id, property]) => {
      if (!props.sorting?.some((v) => v.propertyId === id)) {
        acc.push({
          key: id,
          value: id,
          property,
        });
      }
      return acc;
    }, []),
);

const selectedProperty = ref<[PropertyId] | []>([]);

const onAddSortableProperty = () => {
  const [property] = selectedProperty.value;
  if (property) {
    const hasProperty = props.sorting?.some((v) => v.propertyId === property);

    if (!hasProperty) {
      selectedProperty.value = [];
      emit('addSorting', {
        propertyId: property,
        direction: SORT_DIRECTION.ascending,
      });
    }
  }
};

const onClickToggleDirection = (propertyId: PropertyId) => {
  emit('toggleDirection', propertyId);
};
</script>

<template>
  <FormLayout>
    <span class="title is-4">Sorting data</span>

    <UIMenu :collection="propertySortCollection">
      <template
        #item="{
          item: {
            property: { name },
            direction,
            propertyId,
          },
        }"
      >
        <UIButton grow :label="name" />

        <SortDirectionBtn
          :direction
          @click="onClickToggleDirection(propertyId)"
        />
      </template>
    </UIMenu>

    <div v-if="propertyOptions.length" class="field has-addons">
      <div class="control is-expanded">
        <UISelect
          v-model:value="selectedProperty"
          class="is-fullwidth"
          :options="propertyOptions"
        >
          <template #option="{ property: { name } }">
            {{ name }}
          </template>
        </UISelect>
      </div>

      <div class="control">
        <UIButton label="Add" primary @click="onAddSortableProperty" />
      </div>
    </div>
  </FormLayout>
</template>
