<script setup lang="ts">
import type {
  GeneralProperty,
  PropertiesMap,
} from '@shared/lib/databaseDocument/state/v1/property';
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';
import type { Option } from '@shared/ui/Select';
import { UISelect } from '@shared/ui/Select';
import { UIMenu } from '@shared/ui/TreeMenu';
import type { Entries } from 'type-fest';
import { computed, ref } from 'vue';
import SortDirectionBtn from './SortDirectionBtn.vue';
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseSortDescription,
} from '@shared/lib/databaseDocument/state';

const props = defineProps<{
  properties: PropertiesMap;
  sorting?: DatabaseSortDescription[];
}>();

const emit = defineEmits<{
  toggleDirection: [DatabasePropertyId];
  addSorting: [DatabaseSortDescription];
}>();

const propertySortCollection = computed(
  (): [number, DatabaseSortDescription & { property: GeneralProperty }][] =>
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
  (): (Option<DatabasePropertyId, DatabasePropertyId> & {
    property: GeneralProperty;
  })[] =>
    (<Entries<typeof props.properties>>Object.entries(props.properties)).reduce<
      (Option<DatabasePropertyId, DatabasePropertyId> & {
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

const selectedProperty = ref<[DatabasePropertyId] | []>([]);

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

const onClickToggleDirection = (propertyId: DatabasePropertyId) => {
  emit('toggleDirection', propertyId);
};

// TODO: переделать в MD
</script>

<template>
  <FormLayout>
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
