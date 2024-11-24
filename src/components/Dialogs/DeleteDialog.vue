<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import { useFetch } from '@/composables/useFetch'

const userStore = useUserStore()
const { userId } = storeToRefs(userStore)

const router = useRouter()

const dialogStore = useDialogStore()
const { showDeleteDialog } = storeToRefs(dialogStore)

const agree = ref(false)
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
    router.push('/')
  }
  if (error) {
    console.error(error)
  }
}
</script>
<template>
  <v-dialog v-model="showDeleteDialog" max-width="700">
    <v-card class="tw-p-4">
      <v-card-title class="tw-text-orange-500">Warning!</v-card-title>
      <v-card-text>
        <div class="tw-text-xl tw-font-bold">
          You're about to delete your account. This action is irreversible.
        </div>
        <div class="tw-font-normal tw-my-3">
          Deleting your account will permanently remove all of your information from our systems.
          This includes any AI-generated creations.
        </div>

        <div class="tw-flex tw-gap-2 -tw-ml-2">
          <v-checkbox
            v-model="agree"
            label="I understand that deleting my account is permanent and irreversible."
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn variant="outlined" @click="showDeleteDialog = false">No, go back</v-btn>
        <v-btn variant="outlined" color="red" @click="deleteAccount" :disabled="!agree"
          >Yes, delete account</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss"></style>
