<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useClerk, useUser } from 'vue-clerk'

import { useFetch } from '@/composables/useFetch'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { user } = useUser()
const { signOut } = useClerk()
const { userId, referralCode } = storeToRefs(userStore)
const userInitials = ref<string | undefined>('')
const fullName = ref<string | undefined>('')
const email = ref<string | undefined>('')
const userImage = ref<string | undefined>('')

function getUserInitials() {
  if (!user.value) return ''
  if (!user.value.firstName || !user.value.lastName) return ''
  return user.value?.firstName?.charAt(0) + user.value?.lastName?.charAt(0)
}

function copyReferralLink() {
  console.log('copyReferralLink')
  const referralLink = `${import.meta.env.VITE_API_BASEPATH}/signup?referral=${referralCode.value}`
  navigator.clipboard.writeText(referralLink)
}

async function deleteAccount() {
  console.log('deleteAccount')
  const { error, data } = await useFetch(`/api/users/${userId.value}`, {
    method: 'DELETE',
    headers: {
      mode: 'cors'
    }
  })
  if (data) {
    console.log(data)
  }
  if (error) {
    console.error(error)
  }
}

function updateUserInfo() {
  if (user.value) {
    userInitials.value = getUserInitials()
    fullName.value = user.value.fullName ?? ''
    email.value = user.value.primaryEmailAddress?.emailAddress
    userImage.value = user.value.imageUrl
  }
}

watch(
  () => user.value,
  () => {
    updateUserInfo()
  },
  { immediate: true, deep: true }
)
</script>
<template>
  <div
    id="user"
    class="tw-flex tw-cursor-pointer tw-shrink-0 tw-items-center tw-gap-2 tw-lg:tw-gap-3"
  >
    <v-menu min-width="200px" rounded>
      <template v-slot:activator="{ props }">
        <div v-if="user" v-bind="props" class="mr-4">
          <v-avatar class="mr-2" size="small">
            <v-img alt="user image" :src="userImage">
              <template v-slot:error>
                <span class="text-body-1">{{ userInitials }}</span>
              </template>
            </v-img>
          </v-avatar>
          <v-icon size="x-small" class="tw-cursor-pointer" icon="fas fa-caret-down"></v-icon>
        </div>
      </template>
      <v-card>
        <v-card-text>
          <div class="mx-auto text-center">
            <v-avatar>
              <v-img alt="user image" :src="userImage">
                <template v-slot:error>
                  <span class="text-body-1">{{ userInitials }}</span>
                </template>
              </v-img>
            </v-avatar>
            <h3 class="tw-font-bold">{{ fullName }}</h3>
            <p class="text-caption mt-1">
              {{ email }}
            </p>
            <v-divider class="my-3"></v-divider>
            <v-btn @click="copyReferralLink" variant="text"> Copy Referral Link </v-btn>
            <v-divider class="my-3"></v-divider>
            <v-btn @click="deleteAccount" variant="text"> Delete Account </v-btn>
            <v-divider class="my-3"></v-divider>
            <v-btn @click="signOut({ redirectUrl: '/' })" variant="text"> Logout </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<style scoped></style>
