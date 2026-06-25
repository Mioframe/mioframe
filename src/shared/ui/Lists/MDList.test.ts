import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { MDList, MDListItem, MDListSelectionItem } from '.';

describe('MDList', () => {
  it('renders the list root with the md-list block class', () => {
    const wrapper = mount(MDList, {
      slots: {
        default: '<div>Row</div>',
      },
    });

    expect(wrapper.get('.md-list').classes()).toContain('md-list');
    expect(wrapper.get('.md-list').classes()).toContain('md-list_style_standard');
  });

  it('supports mixing static, single-action, and multi-action MDListItem rows in one list as a Mioframe extension over per-list Material action categories', () => {
    const onAction = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="Static row" mode="static" />
            <MDListItem label-text="Single-action row" mode="single-action" @action="onAction" />
            <MDListItem label-text="Multi-action row" mode="multi-action" @action="onAction">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
          </MDList>
        `,
        setup: () => ({ onAction }),
      },
      { attachTo: document.body },
    );

    const rows = wrapper.findAll('[role="listitem"]');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.find('button').exists()).toBe(false);
    expect(rows[1]?.find('button').exists()).toBe(true);
    expect(rows[2]?.findAll('button')).toHaveLength(2);
  });

  it('exposes listbox semantics and controlled selection updates for selection lists', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList
            selection-mode="single"
            :model-value="selected"
            @update:model-value="onUpdateModelValue"
          >
            <MDListSelectionItem label-text="One" value="one" />
            <MDListSelectionItem label-text="Two" value="two" />
          </MDList>
        `,
        setup: () => ({
          onUpdateModelValue,
          selected: 'two',
        }),
      },
      { attachTo: document.body },
    );

    const list = wrapper.get('.md-list');
    const options = wrapper.findAll('[role="option"]');

    expect(list.attributes('role')).toBe('listbox');
    expect(options).toHaveLength(2);
    expect(options[1]?.attributes('aria-selected')).toBe('true');

    expect(options[0]).toBeDefined();
    await options[0]?.trigger('click');

    expect(onUpdateModelValue).toHaveBeenCalledWith('one');
  });

  it('keeps selection-list DOM safe when an item is missing a value', () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single">
            <MDListSelectionItem label-text="Has value" value="two" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const options = wrapper.findAll('[role="option"]');

    expect(options).toHaveLength(1);
    expect(options[0]?.attributes('aria-disabled')).toBeUndefined();
    expect(options[0]?.attributes('aria-selected')).toBe('false');
  });

  it('skips disabled options when assigning tab stops and moving focus', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="two">
            <MDListSelectionItem label-text="Disabled selected" value="two" disabled />
            <MDListSelectionItem label-text="Enabled one" value="one" />
            <MDListSelectionItem label-text="Disabled two" value="three" disabled />
            <MDListSelectionItem label-text="Enabled four" value="four" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await wrapper.vm.$nextTick();

    const options = wrapper.findAll<HTMLElement>('[role="option"]');

    expect(options[0]?.element.tabIndex).toBe(-1);
    expect(options[1]?.element.tabIndex).toBe(0);
    expect(options[2]?.element.tabIndex).toBe(-1);
    expect(options[3]?.element.tabIndex).toBe(-1);

    options[1]?.element.focus();
    await options[1]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[3]?.element);

    await options[3]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]?.element);

    await options[1]?.trigger('keydown', { key: 'End' });
    expect(document.activeElement).toBe(options[3]?.element);

    await options[3]?.trigger('keydown', { key: 'Home' });
    expect(document.activeElement).toBe(options[1]?.element);
  });

  it('does not treat ArrowLeft or ArrowRight as vertical listbox navigation keys', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="two">
            <MDListSelectionItem label-text="One" value="one" />
            <MDListSelectionItem label-text="Two" value="two" />
            <MDListSelectionItem label-text="Three" value="three" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await wrapper.vm.$nextTick();

    const options = wrapper.findAll<HTMLElement>('[role="option"]');
    options[1]?.element.focus();

    await options[1]?.trigger('keydown', { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(options[1]?.element);
    expect(options[0]?.element.tabIndex).toBe(-1);
    expect(options[1]?.element.tabIndex).toBe(0);
    expect(options[2]?.element.tabIndex).toBe(-1);

    await options[1]?.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(options[1]?.element);
    expect(options[0]?.element.tabIndex).toBe(-1);
    expect(options[1]?.element.tabIndex).toBe(0);
    expect(options[2]?.element.tabIndex).toBe(-1);
  });

  it('resynchronizes tab stops when option state changes after render', async () => {
    const options = ref([
      { label: 'One', value: 'one', disabled: false },
      { label: 'Two', value: 'two', disabled: false },
      { label: 'Three', value: 'three', disabled: true },
    ]);
    const selected = ref('one');

    const wrapper = mount(
      defineComponent({
        components: { MDList, MDListSelectionItem },
        setup() {
          return { options, selected };
        },
        template: `
          <MDList selection-mode="single" :model-value="selected">
            <MDListSelectionItem
              v-for="option in options"
              :key="option.value"
              :label-text="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </MDList>
        `,
      }),
      { attachTo: document.body },
    );

    await nextTick();

    let renderedOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    expect(renderedOptions[0]?.element.tabIndex).toBe(0);
    expect(renderedOptions[1]?.element.tabIndex).toBe(-1);
    expect(renderedOptions[2]?.element.tabIndex).toBe(-1);

    options.value = [
      { label: 'One', value: 'one', disabled: true },
      { label: 'Two', value: 'two', disabled: false },
      { label: 'Three', value: 'three', disabled: true },
    ];
    await nextTick();
    await nextTick();

    renderedOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    expect(renderedOptions[0]?.attributes('aria-disabled')).toBe('true');
    expect(renderedOptions[0]?.element.tabIndex).toBe(-1);
    expect(renderedOptions[1]?.element.tabIndex).toBe(0);
    expect(renderedOptions[2]?.element.tabIndex).toBe(-1);

    options.value = [
      { label: 'One', value: 'one', disabled: false },
      { label: 'Two', value: 'two', disabled: false },
      { label: 'Three', value: 'three', disabled: true },
    ];
    selected.value = 'two';
    await nextTick();
    await nextTick();

    renderedOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    expect(renderedOptions[0]?.attributes('aria-disabled')).toBeUndefined();
    expect(renderedOptions[0]?.element.tabIndex).toBe(-1);
    expect(renderedOptions[1]?.attributes('aria-selected')).toBe('true');
    expect(renderedOptions[1]?.element.tabIndex).toBe(0);
    expect(renderedOptions[2]?.attributes('aria-disabled')).toBe('true');
    expect(renderedOptions[2]?.element.tabIndex).toBe(-1);
    expect(renderedOptions.filter((option) => option.element.tabIndex === 0)).toHaveLength(1);
  });

  it('leaves all options out of the tab order when every option is disabled', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="multiple" :model-value="[]">
            <MDListSelectionItem label-text="One" value="one" disabled />
            <MDListSelectionItem label-text="Two" value="two" disabled />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await wrapper.vm.$nextTick();

    for (const option of wrapper.findAll<HTMLElement>('[role="option"]')) {
      expect(option.element.tabIndex).toBe(-1);
      expect(option.attributes('aria-disabled')).toBe('true');
    }
  });

  it('keeps nested selection-list options out of the parent roving focus registry', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="outer-two">
            <MDListSelectionItem label-text="Outer one" value="outer-one" />
            <MDListSelectionItem label-text="Outer two" value="outer-two" />
            <div class="nested-owner">
              <MDList selection-mode="single" model-value="inner-one">
                <MDListSelectionItem label-text="Inner one" value="inner-one" />
                <MDListSelectionItem label-text="Inner two" value="inner-two" />
              </MDList>
            </div>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();

    const allOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    const outerOptions = allOptions.slice(0, 2);
    const innerOptions = allOptions.slice(2);

    expect(outerOptions).toHaveLength(2);
    expect(innerOptions).toHaveLength(2);
    expect(outerOptions[0]?.element.tabIndex).toBe(-1);
    expect(outerOptions[1]?.element.tabIndex).toBe(0);

    outerOptions[1]?.element.focus();
    await outerOptions[1]?.trigger('keydown', { key: 'ArrowDown' });

    expect(document.activeElement).toBe(outerOptions[0]?.element);
    expect(innerOptions[0]?.element.tabIndex).toBe(0);
    expect(innerOptions[1]?.element.tabIndex).toBe(-1);
  });

  it('does not let a nested selection list nested inside a parent item move the parent roving focus', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="outer-two">
            <MDListSelectionItem label-text="Outer one" value="outer-one" />
            <MDListSelectionItem label-text="Outer two" value="outer-two">
              <template #trailing>
                <MDList selection-mode="single" model-value="inner-one">
                  <MDListSelectionItem label-text="Inner one" value="inner-one" />
                  <MDListSelectionItem label-text="Inner two" value="inner-two" />
                </MDList>
              </template>
            </MDListSelectionItem>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();

    const allOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    const outerOptions = allOptions.slice(0, 2);
    const innerOptions = allOptions.slice(2);

    expect(outerOptions).toHaveLength(2);
    expect(innerOptions).toHaveLength(2);

    innerOptions[0]?.element.focus();
    await innerOptions[0]?.trigger('keydown', { key: 'ArrowDown' });

    // The inner list must handle its own ArrowDown without the bubbled event also
    // moving the outer list's roving focus or tab stops, even though the inner list is
    // nested inside one of the outer list's own item DOM subtrees.
    expect(document.activeElement).toBe(innerOptions[1]?.element);
    expect(outerOptions[1]?.element.tabIndex).toBe(0);
  });

  it('lets a nested action list handle its own ArrowDown/ArrowUp without moving the parent action list focus', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="Outer one" mode="single-action" />
            <MDListItem label-text="Outer two" mode="multi-action">
              <template #trailingAction>
                <MDList>
                  <MDListItem label-text="Inner one" mode="single-action" />
                  <MDListItem label-text="Inner two" mode="single-action" />
                </MDList>
              </template>
            </MDListItem>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const allActions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    const outerActions = allActions.filter(
      (action) => !action.element.closest('.md-list-item__trailing-action'),
    );
    const innerActions = allActions.filter((action) =>
      action.element.closest('.md-list-item__trailing-action'),
    );

    expect(outerActions).toHaveLength(2);
    expect(innerActions).toHaveLength(2);

    innerActions[0]?.element.focus();
    await innerActions[0]?.trigger('keydown', { key: 'ArrowDown' });

    // The inner list owns this row's traversal and must not move the outer list's
    // roving focus, even though the inner list is nested inside the outer row's own
    // trailing-action DOM subtree.
    expect(document.activeElement).toBe(innerActions[1]?.element);

    document.body.innerHTML = '';
  });

  it('keeps ArrowLeft/ArrowRight contained inside a nested action list with no same-row counterpart', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="Outer one" mode="single-action" />
            <MDListItem label-text="Outer two" mode="multi-action">
              <template #trailingAction>
                <MDList>
                  <MDListItem label-text="Inner one" mode="single-action" />
                  <MDListItem label-text="Inner two" mode="single-action" />
                </MDList>
              </template>
            </MDListItem>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const allActions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    const outerActions = allActions.filter(
      (action) => !action.element.closest('.md-list-item__trailing-action'),
    );
    const innerActions = allActions.filter((action) =>
      action.element.closest('.md-list-item__trailing-action'),
    );

    expect(outerActions).toHaveLength(2);
    expect(innerActions).toHaveLength(2);

    innerActions[0]?.element.focus();
    const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    innerActions[0]?.element.dispatchEvent(keydownEvent);
    await nextTick();

    // The inner single-action row has no trailing counterpart, but the inner list still
    // owns this key once the target resolves to its own registry: it must not bubble out
    // and let the outer row's (incorrectly inherited) trailing-column resolution steal
    // focus onto an outer action. preventDefault is only called when focus actually moves.
    expect(document.activeElement).toBe(innerActions[0]?.element);
    expect(keydownEvent.defaultPrevented).toBe(false);

    document.body.innerHTML = '';
  });

  it('warns in development when MDListItem is used inside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList selection-mode="single">
            <MDListItem label-text="Wrong component" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Use MDListSelectionItem instead'),
    );

    warnSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('warns in development when a selection listbox is missing an accessible name', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single">
            <MDListSelectionItem label-text="One" value="one" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    expect(
      warnSpy.mock.calls.some((call) => String(call[0]).includes('missing an accessible name')),
    ).toBe(true);

    warnSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('does not warn when a selection listbox has an accessible name', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" aria-label="Colors">
            <MDListSelectionItem label-text="One" value="one" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('accessible name'));

    warnSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('does not warn about accessible name for non-selection lists', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(MDList, {
      attachTo: document.body,
      slots: { default: '<div>Row</div>' },
    });

    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('accessible name'));

    warnSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('moves focus vertically between enabled single-action rows and skips disabled rows', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="One" mode="single-action" />
            <MDListItem label-text="Two" mode="single-action" disabled />
            <MDListItem label-text="Three" mode="single-action" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    expect(actions).toHaveLength(3);

    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[2]?.element);

    await actions[2]?.trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement).toBe(actions[0]?.element);

    await actions[0]?.trigger('keydown', { key: 'End' });
    expect(document.activeElement).toBe(actions[2]?.element);

    await actions[2]?.trigger('keydown', { key: 'Home' });
    expect(document.activeElement).toBe(actions[0]?.element);

    document.body.innerHTML = '';
  });

  // happy-dom does not implement the browser's native default action that turns a
  // focused <button>'s Enter/Space keydown into a click — that translation is pure
  // browser behavior, not something MDListItem's own JS implements for non-href rows.
  // The href-rendered path IS implemented in JS (onActionKeydown dispatches a
  // synthetic click for Space, since anchors have no native Space activation), so
  // that path is the one real keyboard-driven activation this suite can verify
  // without relying on a browser engine. Native button Enter/Space activation is
  // covered by the Playwright keyboard-activation suite in md-list.spec.ts instead.
  it('does not create a synthetic click for an href-rendered single-action row on Space', async () => {
    const onAction = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="One" mode="single-action" href="#one" @action="onAction" />
          </MDList>
        `,
        setup: () => ({ onAction }),
      },
      { attachTo: document.body },
    );

    const action = wrapper.get<HTMLElement>('a.md-list-item__primary-action');
    action.element.focus();
    await action.trigger('keydown', { key: ' ' });

    // Links activate via Enter/click per native semantics; Space must not be bridged into
    // a synthetic click (no dispatchEvent activation in MDListItem).
    expect(onAction).not.toHaveBeenCalled();

    document.body.innerHTML = '';
  });

  it('does not activate a disabled href-rendered single-action row via Space', async () => {
    const onAction = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="One" mode="single-action" href="#one" disabled @action="onAction" />
          </MDList>
        `,
        setup: () => ({ onAction }),
      },
      { attachTo: document.body },
    );

    const action = wrapper.get<HTMLElement>('a.md-list-item__primary-action');
    action.element.focus();
    await action.trigger('keydown', { key: ' ' });

    expect(onAction).not.toHaveBeenCalled();

    document.body.innerHTML = '';
  });

  it('traverses primary and trailing actions within a multi-action row and between rows, skipping a disabled trailing action', async () => {
    const onPrimaryAction = vi.fn();
    const onTrailingAction = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="One" mode="multi-action" @action="onPrimaryAction">
              <template #trailingAction>
                <button @click="onTrailingAction">Menu</button>
              </template>
            </MDListItem>
            <MDListItem label-text="Two" mode="multi-action" @action="onPrimaryAction">
              <template #trailingAction>
                <button disabled @click="onTrailingAction">Menu</button>
              </template>
            </MDListItem>
            <MDListItem label-text="Three" mode="multi-action" @action="onPrimaryAction">
              <template #trailingAction>
                <button @click="onTrailingAction">Menu</button>
              </template>
            </MDListItem>
          </MDList>
        `,
        setup: () => ({ onPrimaryAction, onTrailingAction }),
      },
      { attachTo: document.body },
    );

    const primaryActions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    const trailingActions = wrapper.findAll<HTMLElement>('.md-list-item__trailing-action button');
    expect(primaryActions).toHaveLength(3);
    expect(trailingActions).toHaveLength(3);

    primaryActions[0]?.element.focus();
    await primaryActions[0]?.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(trailingActions[0]?.element);

    // Row two's trailing action is disabled, so ArrowRight on its primary action must
    // not move focus there.
    primaryActions[1]?.element.focus();
    await primaryActions[1]?.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(primaryActions[1]?.element);

    // Vertical roving in the trailing column must skip row two's disabled trailing
    // action and land on row three's enabled trailing action.
    await trailingActions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trailingActions[2]?.element);

    await trailingActions[2]?.trigger('keydown', { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(primaryActions[2]?.element);

    // Trailing action click must not trigger the primary action's own handler.
    await trailingActions[0]?.trigger('click');
    expect(onTrailingAction).toHaveBeenCalledOnce();
    expect(onPrimaryAction).not.toHaveBeenCalled();

    document.body.innerHTML = '';
  });

  it('skips a fully disabled multi-action row in both the primary and trailing columns', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="One" mode="multi-action" @action="() => {}">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
            <MDListItem label-text="Two" mode="multi-action" disabled @action="() => {}">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
            <MDListItem label-text="Three" mode="multi-action" @action="() => {}">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const primaryActions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    const trailingActions = wrapper.findAll<HTMLElement>('.md-list-item__trailing-action button');
    const trailingWrappers = wrapper.findAll('.md-list-item__trailing-action');
    expect(primaryActions).toHaveLength(3);
    expect(trailingActions).toHaveLength(3);

    // The disabled row's primary action is disabled and its trailing action is inert, so
    // neither column can be a focus target for List keyboard traversal.
    expect(primaryActions[1]?.attributes('disabled')).toBeDefined();
    expect(trailingWrappers[1]?.attributes('inert')).toBeDefined();

    // Primary column: ArrowDown from row one skips the disabled row two and lands on row
    // three's primary action.
    primaryActions[0]?.element.focus();
    await primaryActions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(primaryActions[2]?.element);

    // Trailing column: ArrowDown from row one's trailing action skips the disabled row
    // two's trailing action and lands on row three's trailing action.
    trailingActions[0]?.element.focus();
    await trailingActions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trailingActions[2]?.element);

    document.body.innerHTML = '';
  });

  it('discovers a row primary action that appears after a post-mount mode change and drops it when it reverts to static', async () => {
    const secondMode = ref<'static' | 'single-action'>('static');
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        setup: () => ({ secondMode }),
        template: `
          <MDList>
            <MDListItem label-text="One" mode="single-action" />
            <MDListItem label-text="Two" :mode="secondMode" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    // Row two starts static, so only row one has a primary action and vertical roving
    // cycles back to it.
    let actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    expect(actions).toHaveLength(1);
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[0]?.element);

    // Row two becomes single-action after mount: the one-time registration's live getter
    // must expose the newly rendered primary action so navigation can discover it.
    secondMode.value = 'single-action';
    await nextTick();
    actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    expect(actions).toHaveLength(2);
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[1]?.element);

    // Reverting row two to static must drop it from navigation again, proving the getter
    // reads live state rather than a value captured at mount.
    secondMode.value = 'static';
    await nextTick();
    actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    expect(actions).toHaveLength(1);
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[0]?.element);

    document.body.innerHTML = '';
  });

  it('suppresses and restores action navigation when the list selectionMode toggles after mount', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const selectionMode = ref<'none' | 'single'>('none');
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        setup: () => ({ selectionMode }),
        template: `
          <MDList :selection-mode="selectionMode" aria-label="Rows">
            <MDListItem label-text="One" mode="single-action" />
            <MDListItem label-text="Two" mode="single-action" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    // selectionMode="none": both action rows participate in keyboard navigation.
    let actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    expect(actions).toHaveLength(2);
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[1]?.element);

    // selectionMode="single": MDListItem suppresses its action surfaces, so no
    // primary-action target survives for keyboard navigation to land on.
    selectionMode.value = 'single';
    await nextTick();
    expect(wrapper.findAll('button.md-list-item__primary-action')).toHaveLength(0);

    // Back to "none": the one-time registration must still drive navigation after the
    // round trip, with action surfaces restored.
    selectionMode.value = 'none';
    await nextTick();
    actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    expect(actions).toHaveLength(2);
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[1]?.element);

    warnSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('keeps keyboard listeners attached across a tag="ul" + selectionMode round trip that swaps the root element', async () => {
    const selectionMode = ref<'none' | 'single'>('none');
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        setup: () => ({ selectionMode }),
        template: `
          <MDList tag="ul" :selection-mode="selectionMode" aria-label="Rows">
            <MDListItem label-text="One" mode="single-action" />
            <MDListItem label-text="Two" mode="single-action" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    // tag="ul": root renders as a UL and action rows take part in keyboard navigation.
    expect(wrapper.element.tagName).toBe('UL');
    let actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[1]?.element);

    // selectionMode="single": MDList swaps its root tag to DIV regardless of `tag`. The
    // listener must follow the new live root rather than staying attached to the
    // discarded UL.
    selectionMode.value = 'single';
    await nextTick();
    expect(wrapper.element.tagName).toBe('DIV');

    // Back to selectionMode="none": the root swaps back to UL. Keyboard traversal must
    // still work on the new live root, proving the listener followed both swaps and was
    // not left stale on a detached element.
    selectionMode.value = 'none';
    await nextTick();
    expect(wrapper.element.tagName).toBe('UL');
    actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(actions[1]?.element);

    await actions[1]?.trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement).toBe(actions[0]?.element);

    document.body.innerHTML = '';
  });

  it('does not duplicate keyboard handling after repeated tag/selectionMode root-element swaps', async () => {
    const selectionMode = ref<'none' | 'single'>('none');
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        setup: () => ({ selectionMode }),
        template: `
          <MDList tag="ul" :selection-mode="selectionMode" aria-label="Rows">
            <MDListItem label-text="One" mode="single-action" />
            <MDListItem label-text="Two" mode="single-action" />
            <MDListItem label-text="Three" mode="single-action" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    for (let i = 0; i < 3; i += 1) {
      selectionMode.value = 'single';
      // eslint-disable-next-line no-await-in-loop -- each iteration must settle the root-element swap before the next toggle
      await nextTick();
      selectionMode.value = 'none';
      // eslint-disable-next-line no-await-in-loop -- each iteration must settle the root-element swap before the next toggle
      await nextTick();
    }

    const actions = wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    actions[0]?.element.focus();
    await actions[0]?.trigger('keydown', { key: 'ArrowDown' });

    // A duplicated listener would call preventDefault()/focus() more than once per
    // dispatch, which getNextEnabledActionTarget's single-step navigation would surface
    // as landing two rows down instead of one.
    expect(document.activeElement).toBe(actions[1]?.element);

    document.body.innerHTML = '';
  });

  it('skips and re-includes a multi-action row in keyboard traversal when its disabled state toggles after mount', async () => {
    const middleDisabled = ref(false);
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        setup: () => ({ middleDisabled }),
        template: `
          <MDList>
            <MDListItem label-text="One" mode="multi-action" @action="() => {}">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
            <MDListItem label-text="Two" mode="multi-action" :disabled="middleDisabled" @action="() => {}">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
            <MDListItem label-text="Three" mode="multi-action" @action="() => {}">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const primaryActions = () =>
      wrapper.findAll<HTMLElement>('button.md-list-item__primary-action');
    const trailingActions = () =>
      wrapper.findAll<HTMLElement>('.md-list-item__trailing-action button');

    // Middle row enabled: both columns can reach it.
    primaryActions()[0]?.element.focus();
    await primaryActions()[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(primaryActions()[1]?.element);

    trailingActions()[0]?.element.focus();
    await trailingActions()[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trailingActions()[1]?.element);

    // Disable the middle row after mount: live getters must report both columns disabled
    // so primary and trailing traversal skip it.
    middleDisabled.value = true;
    await nextTick();
    primaryActions()[0]?.element.focus();
    await primaryActions()[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(primaryActions()[2]?.element);

    trailingActions()[0]?.element.focus();
    await trailingActions()[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trailingActions()[2]?.element);

    // Re-enable the middle row: traversal reaches it again, proving the disabled getters
    // are not stuck at the mount-time value.
    middleDisabled.value = false;
    await nextTick();
    primaryActions()[0]?.element.focus();
    await primaryActions()[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(primaryActions()[1]?.element);

    trailingActions()[0]?.element.focus();
    await trailingActions()[0]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(trailingActions()[1]?.element);

    document.body.innerHTML = '';
  });

  it('warns in development when tag="ul" is requested for a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(MDList, {
      attachTo: document.body,
      props: {
        selectionMode: 'single',
        tag: 'ul',
      },
      slots: {
        default: '<div>Row</div>',
      },
    });

    expect(wrapper.get('.md-list').element.tagName.toLowerCase()).toBe('div');
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
      'selectionMode lists render as div/listbox containers',
    );

    warnSpy.mockRestore();
  });
});
