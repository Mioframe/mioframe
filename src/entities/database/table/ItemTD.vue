<template>
  <td><slot /></td>
</template>

<style scoped>
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
