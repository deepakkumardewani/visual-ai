<script setup lang="ts">
import { faCaretDown, faCrown, faLink, faSignOutAlt, faUser, faUsers } from '@/plugins/icons'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useClerk } from 'vue-clerk'
import { useRouter } from 'vue-router'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import Avatar from '@/components/Avatar.vue'
import ReferralCopyDialog from '@/components/Dialogs/ReferralCopyDialog.vue'
import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue'
import ThemeButton from '@/components/Header/ThemeButton.vue'

const router = useRouter()

const dialogStore = useDialogStore()

const userStore = useUserStore()
const { signOut } = useClerk()
const { userDetails, isPro } = storeToRefs(userStore)
const fullName = ref<string | undefined>('')
const email = ref<string | undefined>('')
const menu = ref(false)
const snackbar = ref(false)
const snackbarTimeout = ref(2000)

const subscriptionStatus = computed(() => {
  return isPro.value ? 'Pro' : 'Free'
})

function showReferralDialog() {
  menu.value = false
  dialogStore.showReferral()
}

async function copyReferralCode() {
  dialogStore.showCopyReferral()
  // try {
  //   await navigator.clipboard.writeText(userDetails.value?.referralCode ?? '')
  //   snackbar.value = true
  // } catch (err) {
  //   console.error('Failed to copy referral code:', err)
  // }
}

function updateUserInfo() {
  if (userDetails.value) {
    fullName.value = userDetails.value.fullName ?? ''
    email.value = userDetails.value.email ?? ''
  }
}

watch(
  () => userDetails.value,
  () => {
    updateUserInfo()
  },
  { immediate: true, deep: true }
)

function goToSubscription() {
  menu.value = false
  router.push({
    name: 'profile',
    query: { tab: 'subscription' } // This will be used to activate the subscription tab
  })
}
</script>
<template>
  <div
    id="user"
    class="tw-flex tw-cursor-pointer tw-shrink-0 tw-items-center tw-gap-2 tw-lg:tw-gap-3"
  >
    <v-menu v-model="menu" min-width="200px" rounded :close-on-content-click="false" offset="10">
      <template v-slot:activator="{ props }">
        <div v-if="userDetails" v-bind="props" class="mr-4">
          <Avatar />
          <font-awesome-icon :icon="faCaretDown" class="tw-cursor-pointer tw-text-xs" />
        </div>
      </template>
      <v-card>
        <v-card-text class="pa-2">
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <Avatar />
              </template>
              <v-list-item-title>{{ fullName }}</v-list-item-title>
              <v-list-item-subtitle>{{ email }}</v-list-item-subtitle>
            </v-list-item>

            <!-- <v-divider class="my-1"></v-divider> -->
            <!-- <v-list-item class="tw-cursor-pointer">
              <div class="tw-flex tw-items-center tw-gap-2">
                <v-icon size="small" :icon="isDark ? 'fas fa-sun' : 'fas fa-moon'"></v-icon>
                <v-list-item-title>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</v-list-item-title>
              </div>
              <template v-slot:append>
                <v-switch
                  @click="appStore.toggleTheme"
                  v-model="isDark"
                  hide-details
                  inset
                ></v-switch>
              </template>
            </v-list-item> -->
            <v-divider class="my-1"></v-divider>
            <v-list-item
              class="tw-cursor-pointer"
              @click="router.push({ name: 'profile' }), (menu = false)"
            >
              <div class="tw-flex tw-items-center tw-gap-2">
                <font-awesome-icon :icon="faUser" class="tw-text-sm" />
                <v-list-item-title>View Profile</v-list-item-title>
              </div>
            </v-list-item>
            <v-list-item class="tw-cursor-pointer" @click="goToSubscription">
              <div class="tw-flex tw-items-center tw-gap-2">
                <font-awesome-icon :icon="faCrown" class="tw-text-sm" />
                <v-list-item-title>My Subscription</v-list-item-title>
              </div>
              <template v-slot:append>
                <v-chip
                  :color="subscriptionStatus === 'Pro' ? 'purple-accent-4' : 'grey'"
                  size="small"
                  class="tw-ml-2"
                >
                  {{ subscriptionStatus }}
                </v-chip>
              </template>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item class="tw-cursor-pointer">
              <div @click="showReferralDialog" class="tw-flex tw-items-center tw-gap-2">
                <font-awesome-icon :icon="faUsers" class="tw-text-sm" />
                <v-list-item-title>Use Referral Code</v-list-item-title>
              </div>
            </v-list-item>
            <v-list-item class="tw-cursor-pointer">
              <div @click="copyReferralCode" class="tw-flex tw-items-center tw-gap-2">
                <font-awesome-icon :icon="faLink" class="tw-text-sm" />
                <v-list-item-title>Refer and Earn Credits</v-list-item-title>
              </div>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item class="tw-cursor-pointer">
              <div
                class="tw-flex tw-items-center tw-gap-2"
                @click="signOut({ redirectUrl: '/' }), (menu = false)"
              >
                <font-awesome-icon :icon="faSignOutAlt" class="tw-text-sm" />
                <v-list-item-title>Logout</v-list-item-title>
              </div>
            </v-list-item>
          </v-list>
          <div class="tw-flex tw-items-center tw-gap-2">
            <v-spacer />
            <ThemeButton />
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
  <ReferralDialog />
  <ReferralCopyDialog />
  <v-snackbar
    v-model="snackbar"
    :timeout="snackbarTimeout"
    location="bottom right"
    color="purple-accent-4"
  >
    Referral code copied to clipboard!
  </v-snackbar>
</template>

<style scoped></style>
