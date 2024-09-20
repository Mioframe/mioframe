import { shallowRef, readonly } from 'vue';

export const usePickDirectory = () => {
  const pickedDirectoryHandler = shallowRef<FileSystemDirectoryHandle>();

  const showPicker = async () => {
    pickedDirectoryHandler.value = await showDirectoryPicker({
      mode: 'readwrite', // todo: добавить опцию открыть в режиме чтения
    });
  };

  return {
    showPicker,
    pickedDirectoryHandler: readonly(pickedDirectoryHandler),
  };
};
