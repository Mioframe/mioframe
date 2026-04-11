import { round } from 'es-toolkit';
import type { Ref } from 'vue';
import { shallowRef } from 'vue';

type UsePaneResizeOptions = {
  panesWidth: Readonly<Ref<number[]>>;
  bodyLeft: Readonly<Ref<number>>;
  bodyWidth: Readonly<Ref<number>>;
};

export const usePaneResize = ({ panesWidth, bodyLeft, bodyWidth }: UsePaneResizeOptions) => {
  const activeResizePaneIndex = shallowRef<number>();
  const activeResizePointerId = shallowRef<number>();
  const activeResizeButtonElement = shallowRef<HTMLElement>();

  const getClampedPaneWidth = (clientX: number) => {
    const maxPaneWidth = Math.max(bodyWidth.value, 0);
    return Math.min(maxPaneWidth, Math.max(0, round(clientX - bodyLeft.value)));
  };

  const stopResize = () => {
    activeResizePaneIndex.value = undefined;
    activeResizePointerId.value = undefined;
    activeResizeButtonElement.value = undefined;
  };

  const releaseResizePointerCapture = () => {
    const buttonElement = activeResizeButtonElement.value;
    const pointerId = activeResizePointerId.value;

    if (pointerId !== undefined && buttonElement?.hasPointerCapture(pointerId)) {
      buttonElement.releasePointerCapture(pointerId);
    }
  };

  const onResizePointerDown = (index: number, event: PointerEvent) => {
    const { currentTarget } = event;

    if (currentTarget instanceof HTMLElement) {
      const { previousElementSibling: paneElement } = currentTarget;
      if (paneElement instanceof HTMLElement) {
        event.preventDefault();
        panesWidth.value[index] = paneElement.offsetWidth;
        activeResizePaneIndex.value = index;
        activeResizePointerId.value = event.pointerId;
        activeResizeButtonElement.value = currentTarget;
        currentTarget.setPointerCapture(event.pointerId);
      }
    }
  };

  const onResizePointerEnd = (event: PointerEvent) => {
    if (event.pointerId !== activeResizePointerId.value) {
      return;
    }

    releaseResizePointerCapture();
    stopResize();
  };

  const onResizeLostPointerCapture = (event: PointerEvent) => {
    if (event.pointerId === activeResizePointerId.value) {
      stopResize();
    }
  };

  const onBodyPointerMove = (event: PointerEvent) => {
    if (
      activeResizePaneIndex.value !== undefined &&
      event.pointerId === activeResizePointerId.value
    ) {
      panesWidth.value[activeResizePaneIndex.value] = getClampedPaneWidth(event.clientX);
    }
  };

  return {
    activeResizePaneIndex,
    onResizePointerDown,
    onResizePointerEnd,
    onResizeLostPointerCapture,
    onBodyPointerMove,
  };
};
