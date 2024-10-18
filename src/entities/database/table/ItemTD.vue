<template>
  <td><slot /></td>
</template>

<style lang="scss" scoped>
td {
  vertical-align: middle;
  &::before {
    content: '';
    display: inline-block;
    vertical-align: middle;
  }
  > * {
    vertical-align: middle;
  }
}
</style>
