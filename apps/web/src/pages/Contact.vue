<script setup lang="ts">
import { faPaperPlane } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { reactive, ref, watch } from 'vue';

import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

import { contactForm } from '@/utils/helpers';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}
const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const userStore = useUserStore();
const { userDetails } = storeToRefs(userStore);

const isFormValid = ref(false);
const isLoading = ref(false);
const showSnackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const form = ref();

const formData = reactive<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
});

const firstNameRules = [
  (v: string) => !!v || 'First Name is required',
  (v: string) => v.length >= 2 || 'First Name must be at least 2 characters',
];

const lastNameRules = [
  (v: string) => !!v || 'Last Name is required',
  (v: string) => v.length >= 2 || 'Last Name must be at least 2 characters',
];

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
];

const subjectRules = [
  (v: string) => !!v || 'Subject is required',
  (v: string) => v.length >= 5 || 'Subject must be at least 5 characters',
];

const messageRules = [
  (v: string) => !!v || 'Message is required',
  (v: string) => v.length >= 10 || 'Message must be at least 10 characters',
];

const handleSubmit = async () => {
  try {
    if (!isFormValid.value) {
      return;
    }
    isLoading.value = true;

    const data = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    };
    await contactForm(data);

    // Show success message
    snackbarColor.value = 'success';
    snackbarText.value = 'Message sent successfully!';
    showSnackbar.value = true;

    // Reset form
    form.value.reset();
  } catch (error) {
    // Show error message
    snackbarColor.value = 'error';
    snackbarText.value = 'Failed to send message. Please try again.';
    showSnackbar.value = true;
  } finally {
    isLoading.value = false;
  }
};

watch(userDetails, () => {
  formData.firstName = userDetails.value?.firstName || '';
  formData.lastName = userDetails.value?.lastName || '';
  formData.email = userDetails.value?.email || '';
});
</script>

<template>
  <v-container class="tw-py-12">
    <v-row justify="center">
      <!-- Contact Form Section -->
      <v-col cols="12" md="8">
        <h1 class="tw-text-3xl tw-font-bold tw-mb-8">Get in Touch</h1>
        <v-form ref="form" @submit.prevent="handleSubmit" v-model="isFormValid">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.firstName"
                :rules="firstNameRules"
                label="First Name"
                variant="outlined"
                name="firstName"
                required
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.lastName"
                :rules="lastNameRules"
                label="Last Name"
                variant="outlined"
                name="lastName"
                required
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.email"
                :rules="emailRules"
                label="Email"
                variant="outlined"
                name="email"
                required
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.subject"
                :rules="subjectRules"
                label="Subject"
                variant="outlined"
                name="subject"
                required
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.message"
                :rules="messageRules"
                label="Message"
                variant="outlined"
                name="message"
                required
                rows="4"
              />
            </v-col>
            <v-col cols="12">
              <v-btn
                type="submit"
                :color="isDark ? '#C98A5A' : '#C9A84C'"
                size="large"
                block
                :loading="isLoading"
              >
                <font-awesome-icon :icon="faPaperPlane" class="tw-mr-2" />
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
