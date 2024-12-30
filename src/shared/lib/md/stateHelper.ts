import './_container-with-states.scss';
import type { Directive } from 'vue';

const STATE = {
  press: 'md-state_press',
  pressed: 'md-state_pressed',
  unPressed: 'md-state_unpressed',
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
  clientX,
  clientY,
}: {
  currentTarget: EventTarget | null;
  clientX?: number;
  clientY?: number;
}) => {
  if (currentTarget instanceof HTMLElement) {
    const rect = currentTarget.getBoundingClientRect();

    if (clientX && clientY) {
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

      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      currentTarget.style.setProperty('--md-ripple-y', `${offsetY}px`);
      currentTarget.style.setProperty('--md-ripple-x', `${offsetX}px`);
    } else {
      currentTarget.style.setProperty(
        '--md-ripple-size',
        `${Math.max(rect.width, rect.height)}px`,
      );
      currentTarget.style.setProperty('--md-ripple-y', null);
      currentTarget.style.setProperty('--md-ripple-x', null);
    }

    currentTarget.classList.add(STATE.press);

    if (!currentTarget.classList.contains(STATE.pressed)) {
      startAnimationPressed(currentTarget);
    }
  }
};

const onUnpressed = ({
  currentTarget,
}: {
  currentTarget: EventTarget | null;
}) => {
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

const actionKeys = [' ', 'Enter'];

const onKeydown = ({ key, currentTarget }: KeyboardEvent) => {
  if (actionKeys.includes(key)) {
    onPress({ currentTarget });
  }
};

const onKeyup = ({ key, currentTarget }: KeyboardEvent) => {
  if (actionKeys.includes(key)) {
    onUnpressed({ currentTarget });
  }
};

export const vPressedState: Directive = {
  mounted: (el) => {
    if (el instanceof HTMLElement) {
      el.addEventListener('mousedown', onPress);
      el.addEventListener('keydown', onKeydown);
      el.addEventListener('mouseleave', onUnpressed);
      el.addEventListener('mouseup', onUnpressed);
      el.addEventListener('keyup', onKeyup);
      el.addEventListener('animationend', onAnimationEnd);
    }
  },
  beforeUnmount: (el) => {
    if (el instanceof HTMLElement) {
      el.removeEventListener('mousedown', onPress);
      el.removeEventListener('keydown', onKeydown);
      el.removeEventListener('mouseleave', onUnpressed);
      el.removeEventListener('mouseup', onUnpressed);
      el.removeEventListener('keyup', onKeyup);
      el.removeEventListener('animationend', onAnimationEnd);
    }
  },
};
