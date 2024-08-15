export type * from './types';
export { createDirectoryEntry } from './directoryEntry';
export { createFileEntry } from './fileEntry';

// todo: выделить провайдер хранилища в библиотеку
// todo: добавить обработку поведения (копирование/переименование с перезаписью, перемещение с перезаписью и т.п.)