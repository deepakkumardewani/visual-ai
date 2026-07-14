<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUser } from 'vue-clerk';

const { user } = useUser();

const props = withDefaults(
  defineProps<{
    size?: 'small' | 'medium' | 'large' | 'x-large';
  }>(),
  {
    size: 'small',
  },
);

const userInitials = ref('');
const userImage = ref('');
const imageFailed = ref(false);

const sizePx = computed(() => {
  switch (props.size) {
    case 'x-large':
      return 96;
    case 'large':
      return 64;
    case 'medium':
      return 48;
    default:
      return 36;
  }
});

function getUserInitials() {
  if (!user.value) return '';
  const first = user.value.firstName?.charAt(0) ?? '';
  const last = user.value.lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

function updateUserInfo() {
  if (!user.value) return;
  userInitials.value = getUserInitials();
  userImage.value = user.value.imageUrl ?? '';
  imageFailed.value = false;
}

watch(() => user.value, updateUserInfo, { immediate: true, deep: true });
</script>

<template>
  <span
    class="avatar"
    :style="{ width: `${sizePx}px`, height: `${sizePx}px`, fontSize: `${sizePx * 0.32}px` }"
    role="img"
    :aria-label="userInitials ? `Avatar for ${userInitials}` : 'User avatar'"
  >
    <img
      v-if="userImage && !imageFailed"
      :src="userImage"
      alt=""
      class="avatar__img"
      @error="imageFailed = true"
    />
    <span v-else class="avatar__initials" aria-hidden="true">{{ userInitials }}</span>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(var(--tw-surface-3));
  color: rgb(var(--tw-ink-primary));
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 1px rgb(var(--tw-border) / 0.55);
}

.avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar__initials {
  line-height: 1;
  text-transform: uppercase;
}
</style>
