<script setup lang="ts">
import { useUser } from 'vue-clerk';

const { user } = useUser();

const userInitials = ref('');
const userImage = ref('');

withDefaults(defineProps<{ size?: string }>(), {
  size: 'small',
});

function getUserInitials() {
  if (!user.value) return '';
  if (!user.value.firstName || !user.value.lastName) return '';
  return user.value?.firstName?.charAt(0) + user.value?.lastName?.charAt(0);
}

function updateUserInfo() {
  if (user.value) {
    userInitials.value = getUserInitials();
    userImage.value = user.value.imageUrl;
  }
}

watch(
  () => user.value,
  () => {
    updateUserInfo();
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <v-avatar class="mr-2" :size="size">
    <v-img alt="user image" :src="userImage">
      <template v-slot:error>
        <span class="text-body-1">{{ userInitials }}</span>
      </template>
    </v-img>
  </v-avatar>
</template>
<style scoped lang="scss"></style>
