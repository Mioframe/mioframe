<template>
  <div class="md-table">
    <table>
      <slot />
    </table>
  </div>
</template>

<style lang="css" scoped>
.md-table {
  --md-table-border-radius: 8px;
  --md-table-border-color: var(--md-sys-color-surface-variant);
  --md-table-border: 1px solid var(--md-table-border-color);
  overflow: auto;
  border-radius: var(--md-table-border-radius);
  border: var(--md-table-border);

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0px;
    border-radius: inherit;
  }

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
      --md-container-color: var(--md-sys-color-surface-variant);
      background-color: var(--md-container-color);

      th {
        --md-container-color: var(--md-sys-color-surface-variant);
        --md-content-color: var(--md-sys-color-on-surface-variant);
      }
    }

    thead,
    tbody,
    tfoot {
      &:first-child {
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;

        tr:first-child {
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;

          th,
          td {
            &:first-child {
              border-top-left-radius: inherit;
            }

            &:last-child {
              border-top-right-radius: inherit;
            }
          }
        }
      }

      &:last-child {
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;

        tr:last-child {
          border-bottom-left-radius: inherit;
          border-bottom-right-radius: inherit;

          td {
            border-bottom: none;

            &:first-child {
              border-bottom-left-radius: inherit;
            }

            &:last-child {
              border-bottom-right-radius: inherit;
            }
          }
        }
      }
    }

    td,
    th {
      padding: 12px;
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
