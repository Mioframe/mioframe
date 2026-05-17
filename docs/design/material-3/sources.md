# Material 3 source index

Indexed on 2026-05-17.

## Primary sources

- Material Design 3: `https://m3.material.io/`
- Material Web: `https://material-web.dev/`
- Material Web components: `https://material-web.dev/components/`
- Material Web theming: `https://material-web.dev/theming/`

## Material Web pages used

Material Web is the practical implementation reference for web component behavior, token names, theming hooks, and accessibility notes.

- `https://material-web.dev/components/button/`
- `https://material-web.dev/components/icon-button/`
- `https://material-web.dev/components/fab/`
- `https://material-web.dev/components/dialog/`
- `https://material-web.dev/components/text-field/`
- `https://material-web.dev/components/checkbox/`
- `https://material-web.dev/components/chips/`
- `https://material-web.dev/components/list/`
- `https://material-web.dev/components/menu/`
- `https://material-web.dev/components/tooltip/`
- `https://material-web.dev/components/progress/`
- `https://material-web.dev/components/tabs/`
- `https://material-web.dev/theming/color/`
- `https://material-web.dev/theming/typography/`
- `https://material-web.dev/theming/shape/`

## Material Design 3 pages to re-check when changing UI

The official M3 site is the design source for intent and component usage. Some pages require JavaScript rendering, so do not rely on plain HTML scraping alone.

- `https://m3.material.io/foundations`
- `https://m3.material.io/styles/color`
- `https://m3.material.io/styles/typography`
- `https://m3.material.io/styles/shape`
- `https://m3.material.io/styles/elevation`
- `https://m3.material.io/styles/motion`
- `https://m3.material.io/foundations/layout`
- `https://m3.material.io/components/buttons`
- `https://m3.material.io/components/icon-buttons`
- `https://m3.material.io/components/floating-action-button`
- `https://m3.material.io/components/dialogs`
- `https://m3.material.io/components/text-fields`
- `https://m3.material.io/components/checkbox`
- `https://m3.material.io/components/chips`
- `https://m3.material.io/components/lists`
- `https://m3.material.io/components/menus`
- `https://m3.material.io/components/tooltips`
- `https://m3.material.io/components/progress-indicators`
- `https://m3.material.io/components/tabs`

## Local project sources

- `src/shared/lib/md/tokens.css`
- `src/shared/ui/Button/MDButton.vue`
- `src/shared/ui/Button/MDIconButton.vue`
- `src/shared/ui/Button/MDFab.vue`
- `src/shared/ui/TextField/MDTextField.vue`
- `src/shared/ui/Checkbox/MDCheckbox.vue`
- `src/shared/ui/Chips/MDChip.vue`
- `src/shared/ui/ProgressIndicators/MDCircularProgressIndicator.vue`
- `src/shared/ui/Toolbar/MDToolbarContainer.vue`

## Rules for future indexing

- Prefer official Material Design and Material Web sources.
- Keep local files concise and decision-oriented.
- Link to source pages instead of copying large external sections.
- For pages that require JavaScript rendering, use a browser-rendered capture or manual reading before updating project rules.
- Record any unresolved mismatch between M3 guidance and current Mioframe implementation in the relevant markdown file.
