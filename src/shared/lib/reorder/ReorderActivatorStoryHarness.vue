<script setup lang="ts">
import { computed, ref } from 'vue';
import { useReorder, type ReorderDragEndEvent } from '@shared/lib/reorder';

interface HarnessItem {
  id: string;
  label: string;
  /**
   * Full-row activation: `v-reorder-activator` sits on the item root itself (the shape
   * `DatabaseViewListEdit` uses), rather than on a child handle region. Its native trailing
   * control needs an explicit `v-reorder-ignore` to stay independent, since without it the
   * control would sit inside the activator and be eligible to start a drag.
   */
  fullRowActivator: boolean;
}

const items = ref<HarnessItem[]>([
  { id: 'alpha', label: 'Alpha', fullRowActivator: false },
  { id: 'bravo', label: 'Bravo', fullRowActivator: false },
  { id: 'charlie', label: 'Charlie', fullRowActivator: true },
]);
const keys = computed(() => items.value.map((item) => item.id));

const dragStartCount = ref(0);
const reorderCount = ref(0);
const dragEndCount = ref(0);
const primaryClickCount = ref(0);
const trailingClickCount = ref(0);
const activatorIgnoreClickCount = ref(0);
const settingsClickCount = ref(0);
const lastDragEndPayload = ref('');

const { draggingKey, vReorderContainer, vReorderItem, vReorderActivator, vReorderIgnore } =
  useReorder({
    keys,
    onReorder: ({ fromIndex, toIndex }) => {
      reorderCount.value += 1;

      const next = [...items.value];
      const [moved] = next.splice(fromIndex, 1);
      if (moved) next.splice(toIndex, 0, moved);
      items.value = next;
    },
    onDragStart: () => {
      dragStartCount.value += 1;
    },
    onDragEnd: (event: ReorderDragEndEvent<string>) => {
      dragEndCount.value += 1;
      lastDragEndPayload.value = JSON.stringify(event);
    },
  });

const onPrimaryClick = () => {
  primaryClickCount.value += 1;
};

const onTrailingClick = () => {
  trailingClickCount.value += 1;
};

const onActivatorIgnoreClick = () => {
  activatorIgnoreClickCount.value += 1;
};

const onSettingsClick = () => {
  settingsClickCount.value += 1;
};
</script>

<template>
  <div class="reorder-activator-story-harness">
    <dl class="reorder-activator-story-harness__meta">
      <div>
        <dt>Current order</dt>
        <dd>
          <output aria-label="Current order">{{ keys.join(',') }}</output>
        </dd>
      </div>

      <div>
        <dt>Dragging key</dt>
        <dd>
          <output aria-label="Dragging key">{{ draggingKey ?? '' }}</output>
        </dd>
      </div>

      <div>
        <dt>Drag start count</dt>
        <dd>
          <output aria-label="Drag start count">{{ dragStartCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Reorder count</dt>
        <dd>
          <output aria-label="Reorder count">{{ reorderCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Drag end count</dt>
        <dd>
          <output aria-label="Drag end count">{{ dragEndCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Last drag end</dt>
        <dd>
          <output aria-label="Last drag end">{{ lastDragEndPayload }}</output>
        </dd>
      </div>

      <div>
        <dt>Primary click count</dt>
        <dd>
          <output aria-label="Primary click count">{{ primaryClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Trailing click count</dt>
        <dd>
          <output aria-label="Trailing click count">{{ trailingClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Activator ignore click count</dt>
        <dd>
          <output aria-label="Activator ignore click count">{{ activatorIgnoreClickCount }}</output>
        </dd>
      </div>

      <div>
        <dt>Settings click count</dt>
        <dd>
          <output aria-label="Settings click count">{{ settingsClickCount }}</output>
        </dd>
      </div>
    </dl>

    <div
      v-reorder-container
      role="list"
      aria-label="Reorder activator items"
      class="reorder-activator-story-harness__container"
    >
      <template v-for="item in items" :key="item.id">
        <!--
          A compound row deliberately shaped like a real multi-action list item: the item has an
          explicit activator, so strict handle-only semantics apply. The activator wraps a native
          primary button (drag or click both start from there) and a nested vReorderIgnore veto; a
          separate non-activator content area and a separate trailing native button sit outside
          the activator and must never start a drag.
        -->
        <div
          v-if="!item.fullRowActivator"
          v-reorder-item="item.id"
          role="listitem"
          :aria-label="item.label"
          class="reorder-activator-story-harness__row"
        >
          <div v-reorder-activator class="reorder-activator-story-harness__activator">
            <span
              v-reorder-ignore
              role="button"
              tabindex="0"
              :aria-label="`${item.label} activator ignore zone`"
              class="reorder-activator-story-harness__activator-ignore"
              @click="onActivatorIgnoreClick"
              @keydown.enter.prevent="onActivatorIgnoreClick"
              @keydown.space.prevent
              @keyup.space.prevent="onActivatorIgnoreClick"
            >
              pin
            </span>

            <button
              type="button"
              :aria-label="`${item.label} primary action`"
              class="reorder-activator-story-harness__primary"
              @click="onPrimaryClick"
            >
              {{ item.label }}
            </button>
          </div>

          <span class="reorder-activator-story-harness__content">non-activator content</span>

          <button
            type="button"
            :aria-label="`${item.label} trailing action`"
            class="reorder-activator-story-harness__trailing"
            @click="onTrailingClick"
          >
            trailing
          </button>
        </div>

        <!--
          Full-row activation, matching DatabaseViewListEdit's real usage: v-reorder-activator
          sits on the item root itself, so the whole row (including the native primary button)
          is draggable. The trailing native settings control must carry its own v-reorder-ignore
          to stay independent — without it, it would sit inside the row-level activator and be
          eligible to start a drag.
        -->
        <div
          v-else
          v-reorder-item="item.id"
          v-reorder-activator
          role="listitem"
          :aria-label="item.label"
          class="reorder-activator-story-harness__row reorder-activator-story-harness__row_full-activator"
        >
          <button
            type="button"
            :aria-label="`${item.label} primary action`"
            class="reorder-activator-story-harness__primary"
            @click="onPrimaryClick"
          >
            {{ item.label }}
          </button>

          <span v-reorder-ignore class="reorder-activator-story-harness__settings-wrap">
            <button
              type="button"
              :aria-label="`${item.label} settings`"
              class="reorder-activator-story-harness__trailing"
              @click="onSettingsClick"
            >
              settings
            </button>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/*
 * Story-local presentation only: this harness demonstrates the reorder library's public
 * vReorderActivator contract and owns no part of the library's (nonexistent) production visual
 * treatment.
 */
.reorder-activator-story-harness {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: sans-serif;
  font-size: 13px;
}

.reorder-activator-story-harness__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px 16px;
  margin: 0;
}

.reorder-activator-story-harness__meta > div {
  min-width: 0;
}

.reorder-activator-story-harness__meta dt {
  font-weight: 600;
}

.reorder-activator-story-harness__meta dd {
  margin: 2px 0 0;
  font-family: monospace;
  word-break: break-all;
}

.reorder-activator-story-harness__container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 320px;
  padding: 8px;
  border: 1px dashed #999;
}

.reorder-activator-story-harness__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: #eef2ff;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
}

.reorder-activator-story-harness__activator {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  cursor: grab;
}

.reorder-activator-story-harness__activator-ignore {
  padding: 2px 6px;
  background: #fef3c7;
  border: 1px dashed #d97706;
  cursor: default;
}

.reorder-activator-story-harness__row_full-activator {
  cursor: grab;
}

.reorder-activator-story-harness__settings-wrap {
  display: inline-flex;
  padding: 2px 6px;
  background: #fef3c7;
  border: 1px dashed #d97706;
  cursor: default;
}

.reorder-activator-story-harness__primary {
  flex: 1;
  padding: 6px 8px;
  font: inherit;
  text-align: start;
  background: #fff;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  cursor: pointer;
}

.reorder-activator-story-harness__content {
  color: #6b7280;
  cursor: default;
}

.reorder-activator-story-harness__trailing {
  cursor: pointer;
}
</style>
