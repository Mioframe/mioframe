<template>
  <table class="md-table">
    <slot />
  </table>
</template>

<style lang="css" scoped>
.md-table {
  --md-table-border-radius: 8px;
  --md-table-border-width: 1px;
  --md-table-border-color: var(--md-sys-color-surface-variant);
  --md-table-border: var(--md-table-border-width) solid var(--md-table-border-color);
  --md-table-inner-border-radius: calc(
    var(--md-table-border-radius) - var(--md-table-border-width)
  );
  overflow: auto;
  border-radius: var(--md-table-border-radius);
  border: var(--md-table-border);
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  :deep() {
    caption,
    th,
    td {
      background-color: var(--md-container-color);
      color: var(--md-content-color);
    }

    thead {
      position: sticky;
      z-index: 1;
      top: var(--md-table-border-width);

      tr {
        background-color: var(--md-container-color);

        &:first-child {
          > th,
          > td {
            &:first-child {
              border-top-left-radius: var(--md-table-inner-border-radius);
            }

            &:last-child {
              border-top-right-radius: var(--md-table-inner-border-radius);
            }
          }
        }
      }

      th {
        --md-container-color: var(--md-sys-color-surface-variant);
        --md-content-color: var(--md-sys-color-on-surface-variant);
      }
    }

    :is(tbody, tfoot):last-child > tr:last-child {
      > td,
      > th {
        border-bottom: none;

        &:first-child {
          border-bottom-left-radius: var(--md-table-inner-border-radius);
        }

        &:last-child {
          border-bottom-right-radius: var(--md-table-inner-border-radius);
        }
      }
    }

    td,
    th {
      padding: 2step;
      font-weight: inherit;
      border-bottom: var(--md-table-border);
      text-align: left;
    }

    tbody {
      td {
        font-weight: 400;
      }
    }
  }
}
</style>
