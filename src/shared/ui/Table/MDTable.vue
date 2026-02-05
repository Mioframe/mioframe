<template>
  <table class="md-table">
    <slot />
  </table>
</template>

<style lang="css" scoped>
.md-table {
  --md-table-border-radius: 8px;
  --md-table-border-color: var(--md-sys-color-surface-variant);
  --md-table-border: 1px solid var(--md-table-border-color);
  overflow: auto;
  border-radius: var(--md-table-border-radius);
  border: var(--md-table-border);
  width: 100%;
  border-collapse: separate;
  border-spacing: 0px;

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
      top: 0;

      th {
        --md-container-color: var(--md-sys-color-surface-variant);
        --md-content-color: var(--md-sys-color-on-surface-variant);
      }
    }

    thead,
    tbody,
    tfoot {
      --inner-border-radius: calc(var(--md-table-border-radius) - 1px);

      &:first-child {
        tr:first-child {
          border-top-left-radius: var(--inner-border-radius);
          border-top-right-radius: var(--inner-border-radius);

          th,
          td {
            &:first-child {
              border-top-left-radius: var(--inner-border-radius);
            }

            &:last-child {
              border-top-right-radius: var(--inner-border-radius);
            }
          }
        }
      }

      &:last-child {
        border-bottom-left-radius: var(--md-table-border-radius);
        border-bottom-right-radius: var(--md-table-border-radius);

        tr:last-child {
          border-bottom-left-radius: var(--md-table-border-radius);
          border-bottom-right-radius: var(--md-table-border-radius);

          td {
            border-bottom: none;

            &:first-child {
              border-bottom-left-radius: var(--md-table-border-radius);
            }

            &:last-child {
              border-bottom-right-radius: var(--md-table-border-radius);
            }
          }
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
      position: relative;
      z-index: 0;

      td {
        font-weight: 400;
      }
    }
  }
}
</style>
