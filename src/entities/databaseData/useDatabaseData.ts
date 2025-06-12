// import type { DocHandle } from '@automerge/automerge-repo';
// import { useDatabaseDocument } from '@shared/lib/databaseDocument';
// import type { DatabaseViewId } from '@shared/lib/databaseDocument';
// import type { UnknownRecord } from 'type-fest';
// import { computed, toValue, type MaybeRefOrGetter } from 'vue';

// export const useDatabaseData = (
//   docHandle: MaybeRefOrGetter<DocHandle<UnknownRecord> | undefined>,
//   view: MaybeRefOrGetter<DatabaseViewId | undefined>,
// ) => {
//   const docHandleRef = computed(() => toValue(docHandle));

//   const { content } = useDatabaseDocument(docHandleRef);

//   const databaseView = computed(() => {
//     const viewId = toValue(view);

//     if (viewId) {
//       return content.value?.body?.views?.[viewId];
//     }

//     return undefined;
//   });

//   const dataList = computed(() => {});

//   // TODO: попробовать https://tanstack.com/table/ для преобразования данных
// };
