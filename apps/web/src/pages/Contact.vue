<script setup lang="ts">
import { faPaperPlane } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';

import LandingFooter from '@/components/Landing/LandingFooter.vue';
import { usePageSeo } from '@/composables/usePageSeo';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

import { contactForm } from '@/utils/helpers';

usePageSeo({
  title: 'Contact Visual AI – support and questions',
  description:
    'Questions about Visual AI credits, generation, or your account? Send a message and the team will get back to you with help on studio tools.',
  path: '/contact',
});

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

type FieldRule = (value: string) => true | string;

const FIELD_CLASS =
  'tw-w-full tw-rounded tw-border tw-border-ink-faint tw-bg-surface-1 tw-px-3 tw-py-3 tw-font-body tw-text-ink tw-outline-none focus:tw-border-[#C9A84C]';

const appStore = useAppStore();
const { isDark, snackbar, snackbarText } = storeToRefs(appStore);
const userStore = useUserStore();
const { userDetails } = storeToRefs(userStore);

const isLoading = ref(false);
const submitted = ref(false);

const formData = reactive<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
});

const firstNameRules: FieldRule[] = [
  (v) => !!v || 'First Name is required',
  (v) => v.length >= 2 || 'First Name must be at least 2 characters',
];

const lastNameRules: FieldRule[] = [
  (v) => !!v || 'Last Name is required',
  (v) => v.length >= 2 || 'Last Name must be at least 2 characters',
];

const emailRules: FieldRule[] = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
];

const subjectRules: FieldRule[] = [
  (v) => !!v || 'Subject is required',
  (v) => v.length >= 5 || 'Subject must be at least 5 characters',
];

const messageRules: FieldRule[] = [
  (v) => !!v || 'Message is required',
  (v) => v.length >= 10 || 'Message must be at least 10 characters',
];

function firstError(value: string, rules: FieldRule[]): string {
  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) return result;
  }
  return '';
}

const fieldErrors = computed(() => ({
  firstName: firstError(formData.firstName, firstNameRules),
  lastName: firstError(formData.lastName, lastNameRules),
  email: firstError(formData.email, emailRules),
  subject: firstError(formData.subject, subjectRules),
  message: firstError(formData.message, messageRules),
}));

const isFormValid = computed(() => Object.values(fieldErrors.value).every((error) => !error));

function resetForm() {
  formData.firstName = userDetails.value?.firstName || '';
  formData.lastName = userDetails.value?.lastName || '';
  formData.email = userDetails.value?.email || '';
  formData.subject = '';
  formData.message = '';
  submitted.value = false;
}

const handleSubmit = async () => {
  submitted.value = true;
  if (!isFormValid.value) return;

  try {
    isLoading.value = true;

    await contactForm({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    });

    snackbarText.value = 'Message sent successfully!';
    snackbar.value = true;
    resetForm();
  } catch {
    snackbarText.value = 'Failed to send message. Please try again.';
    snackbar.value = true;
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
  <div class="tw-mx-auto tw-max-w-[1200px] tw-px-4 tw-py-12">
    <div class="tw-flex tw-justify-center">
      <div class="tw-w-full md:tw-w-8/12">
        <h1 class="tw-mb-8 tw-font-display tw-text-3xl tw-font-bold tw-text-ink">Get in Touch</h1>
        <form
          class="tw-grid tw-grid-cols-1 tw-gap-4 tw-font-body sm:tw-grid-cols-2"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label class="tw-mb-1 tw-block tw-text-sm tw-text-ink-muted" for="firstName"
              >First Name</label
            >
            <input
              id="firstName"
              v-model="formData.firstName"
              :class="FIELD_CLASS"
              name="firstName"
              required
              autocomplete="given-name"
            />
            <p v-if="submitted && fieldErrors.firstName" class="tw-mt-1 tw-text-sm tw-text-red-500">
              {{ fieldErrors.firstName }}
            </p>
          </div>
          <div>
            <label class="tw-mb-1 tw-block tw-text-sm tw-text-ink-muted" for="lastName"
              >Last Name</label
            >
            <input
              id="lastName"
              v-model="formData.lastName"
              :class="FIELD_CLASS"
              name="lastName"
              required
              autocomplete="family-name"
            />
            <p v-if="submitted && fieldErrors.lastName" class="tw-mt-1 tw-text-sm tw-text-red-500">
              {{ fieldErrors.lastName }}
            </p>
          </div>
          <div class="sm:tw-col-span-2">
            <label class="tw-mb-1 tw-block tw-text-sm tw-text-ink-muted" for="email">Email</label>
            <input
              id="email"
              v-model="formData.email"
              :class="FIELD_CLASS"
              name="email"
              type="email"
              required
              autocomplete="email"
            />
            <p v-if="submitted && fieldErrors.email" class="tw-mt-1 tw-text-sm tw-text-red-500">
              {{ fieldErrors.email }}
            </p>
          </div>
          <div class="sm:tw-col-span-2">
            <label class="tw-mb-1 tw-block tw-text-sm tw-text-ink-muted" for="subject"
              >Subject</label
            >
            <input
              id="subject"
              v-model="formData.subject"
              :class="FIELD_CLASS"
              name="subject"
              required
            />
            <p v-if="submitted && fieldErrors.subject" class="tw-mt-1 tw-text-sm tw-text-red-500">
              {{ fieldErrors.subject }}
            </p>
          </div>
          <div class="sm:tw-col-span-2">
            <label class="tw-mb-1 tw-block tw-text-sm tw-text-ink-muted" for="message"
              >Message</label
            >
            <textarea
              id="message"
              v-model="formData.message"
              :class="FIELD_CLASS"
              name="message"
              required
              rows="4"
            />
            <p v-if="submitted && fieldErrors.message" class="tw-mt-1 tw-text-sm tw-text-red-500">
              {{ fieldErrors.message }}
            </p>
          </div>
          <div class="sm:tw-col-span-2">
            <button
              type="submit"
              class="tw-inline-flex tw-min-h-[48px] tw-w-full tw-items-center tw-justify-center tw-rounded tw-px-4 tw-py-3 tw-font-medium tw-text-white disabled:tw-opacity-70"
              :style="{ backgroundColor: isDark ? '#C98A5A' : '#C9A84C' }"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="contact-spinner tw-mr-2" aria-hidden="true" />
              <font-awesome-icon v-else :icon="faPaperPlane" class="tw-mr-2" />
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <LandingFooter />
</template>

<style scoped>
.contact-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: contact-spin 0.7s linear infinite;
}

@keyframes contact-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
