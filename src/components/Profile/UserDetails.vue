<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import Avatar from '@/components/Avatar.vue'
import DeleteDialog from '@/components/Dialogs/DeleteDialog.vue'

const dialogStore = useDialogStore()
const userStore = useUserStore()
const { userDetails } = storeToRefs(userStore)

const fullName = ref('')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const username = ref('')
const isNameUpdating = ref(false)
const isUsernameUpdating = ref(false)

const nameBtnText = computed(() =>
  isNameUpdating.value
    ? firstName.value + ' ' + lastName.value === userDetails.value?.fullName
      ? 'Cancel'
      : 'Update'
    : 'Edit'
)
const usernameBtnText = computed(() =>
  isUsernameUpdating.value
    ? username.value === userDetails.value?.userName
      ? 'Cancel'
      : 'Update'
    : 'Edit'
)

function editName() {
  if (nameBtnText.value === 'Cancel') {
    isNameUpdating.value = false
  } else {
    isNameUpdating.value = true
  }
  isUsernameUpdating.value = false
}

function editUsername() {
  if (usernameBtnText.value === 'Cancel') {
    isUsernameUpdating.value = false
  } else {
    isUsernameUpdating.value = true
  }
  isNameUpdating.value = false
}

watch(
  () => userDetails.value,
  () => {
    fullName.value = userDetails.value?.fullName ?? ''
    firstName.value = userDetails.value?.firstName ?? ''
    lastName.value = userDetails.value?.lastName ?? ''
    email.value = userDetails.value?.email ?? ''
    username.value = userDetails.value?.userName ?? ''
  },
  { immediate: true, deep: true }
)
</script>
<template>
  <div class="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-5 tw-mt-4">
    <Avatar :size="'x-large'" />
    <div class="tw-flex tw-w-[30%] tw-flex-col tw-gap-5">
      <div class="tw-flex tw-gap-3">
        <v-text-field
          :readonly="!isNameUpdating"
          label="First Name"
          v-model="firstName"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>

        <v-text-field
          :readonly="!isNameUpdating"
          label="Last Name"
          v-model="lastName"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>

        <v-btn variant="outlined" @click="editName">{{ nameBtnText }}</v-btn>
      </div>
      <div class="tw-flex tw-gap-3">
        <v-text-field
          :readonly="!isUsernameUpdating"
          label="Username"
          v-model="username"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>

        <v-btn variant="outlined" @click="editUsername">{{ usernameBtnText }}</v-btn>
      </div>
      <div>
        <v-text-field
          :disabled="true"
          label="Email"
          v-model="email"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>
      </div>
      <v-divider></v-divider>
      <div>
        <v-btn variant="outlined" color="red" block @click="dialogStore.showDelete()"
          >Delete Account</v-btn
        >
      </div>
    </div>
  </div>
  <DeleteDialog />
</template>
<style scoped lang="scss"></style>
