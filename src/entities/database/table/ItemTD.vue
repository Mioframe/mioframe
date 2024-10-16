<template>
  <td><slot /></td>
</template>

<style lang="scss" scoped>
td {
  > * {
    display: block;
    height: 100%;
  }
}
</style>
