<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, ref } from 'vue'

import { useAppStore } from '@/stores/app'

import { useFetch } from '@/composables/useFetch'

interface FormData {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}

const isFormValid = ref(false)
const isLoading = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const formData = reactive<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: ''
})

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters'
]

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const subjectRules = [
  (v: string) => !!v || 'Subject is required',
  (v: string) => v.length >= 5 || 'Subject must be at least 5 characters'
]

const messageRules = [
  (v: string) => !!v || 'Message is required',
  (v: string) => v.length >= 10 || 'Message must be at least 10 characters'
]

const handleSubmit = async () => {
  try {
    isLoading.value = true

    const { error } = await useFetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(formData)
    }).json()

    if (error.value) {
      throw new Error(error.value)
    }

    // Show success message
    snackbarColor.value = 'success'
    snackbarText.value = 'Message sent successfully!'
    showSnackbar.value = true

    // Reset form
    Object.keys(formData).forEach((key) => {
      formData[key as keyof FormData] = ''
    })
  } catch (error) {
    // Show error message
    snackbarColor.value = 'error'
    snackbarText.value = 'Failed to send message. Please try again.'
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-container class="tw-py-12">
    <v-row justify="center">
      <!-- Contact Form Section -->
      <v-col cols="12" md="8">
        <h1 class="tw-text-3xl tw-font-bold tw-mb-8">Get in Touch</h1>
        <v-form @submit.prevent="handleSubmit" v-model="isFormValid">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.firstName"
                :rules="nameRules"
                label="First Name"
                variant="outlined"
                required
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.lastName"
                :rules="nameRules"
                label="Last Name"
                variant="outlined"
                required
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.email"
                :rules="emailRules"
                label="Email"
                variant="outlined"
                required
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.subject"
                :rules="subjectRules"
                label="Subject"
                variant="outlined"
                required
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.message"
                :rules="messageRules"
                label="Message"
                variant="outlined"
                required
                rows="4"
              />
            </v-col>
            <v-col cols="12">
              <v-btn
                type="submit"
                :color="isDark ? '#6b21a8' : '#9333ea'"
                size="large"
                block
                :loading="isLoading"
                :disabled="!isFormValid"
              >
                <v-icon start icon="fas fa-paper-plane" />
                Send Message
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>

    <!-- Success Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.v-container {
  max-width: 1200px;
}
</style>
