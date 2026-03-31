<script setup lang="ts">
import { GoogleUserInfoList } from '@entity/googleUserInfo';
import { GoogleSessionAddListItem } from '@feature/googleSessionAdd';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
}>();
</script>

<template>
  <MDPane class="account">
    <GoogleUserInfoList>
      <template #after>
        <GoogleSessionAddListItem />
      </template>
    </GoogleUserInfoList>
  </MDPane>
</template>
