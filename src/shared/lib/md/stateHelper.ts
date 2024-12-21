import './_paint-for-canvas.scss';
import type { Directive } from 'vue';

const STATE = {
  press: 'md-container_press',
  pressed: 'md-container_pressed',
  unPressed: 'md-container_unpressed',
} as const;

const startAnimationPressed = (el: HTMLElement) => {
  el.classList.add(STATE.pressed);
};

const onAnimationEnd = ({ animationName, currentTarget }: AnimationEvent) => {
  if (currentTarget instanceof HTMLElement) {
    if (animationName.includes('md-state-pressed')) {
      currentTarget.classList.remove(STATE.pressed);
      if (!currentTarget.classList.contains(STATE.press)) {
        startAnimationUnpressed(currentTarget);
      }
    }

    if (animationName.includes('md-state-unpressed')) {
      currentTarget.classList.remove(STATE.unPressed);
    }
  }
};

const startAnimationUnpressed = (el: HTMLElement) => {
  el.classList.add(STATE.unPressed);
};

const onPress = ({
  currentTarget,
  offsetX,
  offsetY,
  clientX,
  clientY,
}: MouseEvent) => {
  if (currentTarget instanceof HTMLElement) {
    const rect = currentTarget.getBoundingClientRect();

    currentTarget.style.setProperty(
      '--md-ripple-size',
      `${
        Math.max(
          Math.hypot(rect.left - clientX, rect.top - clientY),
          Math.hypot(rect.right - clientX, rect.top - clientY),
          Math.hypot(rect.left - clientX, rect.bottom - clientY),
          Math.hypot(rect.right - clientX, rect.bottom - clientY),
        ) * 2
      }px`,
    );

    currentTarget.style.setProperty('--md-ripple-y', `${offsetY}px`);
    currentTarget.style.setProperty('--md-ripple-x', `${offsetX}px`);

    currentTarget.classList.add(STATE.press);

    if (!currentTarget.classList.contains(STATE.pressed)) {
      startAnimationPressed(currentTarget);
    }
  }
};

const onUnpressed = ({ currentTarget }: MouseEvent) => {
  if (
    currentTarget instanceof HTMLElement &&
    currentTarget.classList.contains(STATE.press)
  ) {
    currentTarget.classList.remove(STATE.press);
    if (!currentTarget.classList.contains(STATE.pressed)) {
      startAnimationUnpressed(currentTarget);
    }
  }
};

export const vPressedState: Directive = {
  mounted: (el) => {
    if (el instanceof HTMLElement) {
      el.addEventListener('mousedown', onPress);
      el.addEventListener('mouseleave', onUnpressed);
      el.addEventListener('mouseup', onUnpressed);
      el.addEventListener('animationend', onAnimationEnd);
    }
  },
  beforeUnmount: (el) => {
    if (el instanceof HTMLElement) {
      el.removeEventListener('mousedown', onPress);
      el.removeEventListener('mouseleave', onUnpressed);
      el.removeEventListener('mouseup', onUnpressed);
      el.removeEventListener('animationend', onAnimationEnd);
    }
  },
};
