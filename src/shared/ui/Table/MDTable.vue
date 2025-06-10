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

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0px;
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
      --md-content-color: var(--md-sys-color-on-surface-variant);
    }

    thead,
    tbody,
    tfoot {
      &:first-child {
        tr:first-child {
          th,
          td {
            border-top: var(--md-table-border);

            &:first-child {
              border-top-left-radius: var(--md-table-border-radius);
            }

            &:last-child {
              border-top-right-radius: var(--md-table-border-radius);
            }
          }
        }
      }

      &:last-child {
        tr:last-child {
          th,
          td {
            border-bottom: var(--md-table-border);

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
      padding: 12px;
      font-weight: inherit;
      border-bottom: var(--md-table-border);
      text-align: left;

      &:first-child {
        border-left: var(--md-table-border);
      }
      &:last-child {
        border-right: var(--md-table-border);
      }
    }

    tbody {
      td {
        font-weight: 400;
      }
    }
  }
}
</style>
