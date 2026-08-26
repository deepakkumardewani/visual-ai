<script setup lang="ts">
import { faCircleCheck } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import Avatar from '@/components/Avatar.vue';
import DeleteDialog from '@/components/Dialogs/DeleteDialog.vue';
import ProfileCreditsCard from '@/components/Profile/ProfileCreditsCard.vue';

const SAVE_ERROR_MESSAGE = 'Couldn’t save. Try again.';

const dialogStore = useDialogStore();
const userStore = useUserStore();
const { userDetails, isUpdatingName, isUpdatingUsername } = storeToRefs(userStore);

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const username = ref('');
const isEditingName = ref(false);
const isEditingUsername = ref(false);
const showNameCheckmark = ref(false);
const showUsernameCheckmark = ref(false);
const nameSaveError = ref('');
const usernameSaveError = ref('');

const hasNameChanged = computed(() => {
  return (
    firstName.value !== userDetails.value?.firstName ||
    lastName.value !== userDetails.value?.lastName
  );
});

const hasUsernameChanged = computed(() => {
  return username.value !== userDetails.value?.userName;
});

async function updateName() {
  nameSaveError.value = '';
  const saved = await userStore.updateName(firstName.value, lastName.value);
  if (!saved) {
    nameSaveError.value = SAVE_ERROR_MESSAGE;
    return;
  }
  isEditingName.value = false;
  showNameCheckmark.value = true;
  setTimeout(() => {
    showNameCheckmark.value = false;
  }, 2000);
}

async function updateUsername() {
  usernameSaveError.value = '';
  const saved = await userStore.updateUsername(username.value);
  if (!saved) {
    usernameSaveError.value = SAVE_ERROR_MESSAGE;
    return;
  }
  isEditingUsername.value = false;
  showUsernameCheckmark.value = true;
  setTimeout(() => {
    showUsernameCheckmark.value = false;
  }, 2000);
}

function startNameEdit() {
  nameSaveError.value = '';
  isEditingName.value = true;
}

function startUsernameEdit() {
  usernameSaveError.value = '';
  isEditingUsername.value = true;
}

function cancelNameUpdate() {
  isEditingName.value = false;
  nameSaveError.value = '';
  firstName.value = userDetails.value?.firstName ?? '';
  lastName.value = userDetails.value?.lastName ?? '';
}

function cancelUsernameUpdate() {
  isEditingUsername.value = false;
  usernameSaveError.value = '';
  username.value = userDetails.value?.userName ?? '';
}

watch(
  () => userDetails.value,
  () => {
    firstName.value = userDetails.value?.firstName ?? '';
    lastName.value = userDetails.value?.lastName ?? '';
    email.value = userDetails.value?.email ?? '';
    username.value = userDetails.value?.userName ?? '';
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="user-details">
    <div class="user-details__masthead">
      <div class="user-details__hero">
        <Avatar size="x-large" />
        <div class="user-details__identity">
          <h2 class="user-details__name">
            {{ userDetails?.fullName || 'Your profile' }}
          </h2>
          <p v-if="email" class="user-details__email">{{ email }}</p>
        </div>
      </div>
      <ProfileCreditsCard />
    </div>

    <div class="user-details__form">
      <fieldset class="user-details__fieldset">
        <legend class="user-details__legend">
          <span>Name</span>
          <span class="user-details__actions">
            <button
              v-if="!isEditingName"
              type="button"
              class="btn btn--ghost"
              @click="startNameEdit"
            >
              Edit
            </button>
            <template v-else>
              <button
                type="button"
                class="btn btn--primary"
                :disabled="!hasNameChanged || isUpdatingName"
                @click="updateName"
              >
                {{ isUpdatingName ? 'Saving…' : 'Save' }}
              </button>
              <button type="button" class="btn btn--ghost" @click="cancelNameUpdate">Cancel</button>
            </template>
            <Transition name="check">
              <font-awesome-icon
                v-if="showNameCheckmark"
                :icon="faCircleCheck"
                class="user-details__check"
                aria-label="Name saved"
              />
            </Transition>
          </span>
        </legend>
        <div class="user-details__row">
          <label class="field">
            <span class="field__label">First name</span>
            <input
              v-model="firstName"
              class="field__input"
              type="text"
              autocomplete="given-name"
              :readonly="!isEditingName"
              :disabled="isUpdatingName"
            />
          </label>
          <label class="field">
            <span class="field__label">Last name</span>
            <input
              v-model="lastName"
              class="field__input"
              type="text"
              autocomplete="family-name"
              :readonly="!isEditingName"
              :disabled="isUpdatingName"
            />
          </label>
        </div>
        <p v-if="nameSaveError" class="user-details__error" role="alert">{{ nameSaveError }}</p>
      </fieldset>

      <fieldset class="user-details__fieldset">
        <legend class="user-details__legend">
          <span>Username</span>
          <span class="user-details__actions">
            <button
              v-if="!isEditingUsername"
              type="button"
              class="btn btn--ghost"
              @click="startUsernameEdit"
            >
              Edit
            </button>
            <template v-else>
              <button
                type="button"
                class="btn btn--primary"
                :disabled="!hasUsernameChanged || isUpdatingUsername"
                @click="updateUsername"
              >
                {{ isUpdatingUsername ? 'Saving…' : 'Save' }}
              </button>
              <button type="button" class="btn btn--ghost" @click="cancelUsernameUpdate">
                Cancel
              </button>
            </template>
            <Transition name="check">
              <font-awesome-icon
                v-if="showUsernameCheckmark"
                :icon="faCircleCheck"
                class="user-details__check"
                aria-label="Username saved"
              />
            </Transition>
          </span>
        </legend>
        <div class="user-details__row user-details__row--single">
          <label class="field">
            <span class="field__label">Username</span>
            <input
              v-model="username"
              class="field__input"
              type="text"
              autocomplete="username"
              :readonly="!isEditingUsername"
              :disabled="isUpdatingUsername"
            />
          </label>
        </div>
        <p v-if="usernameSaveError" class="user-details__error" role="alert">
          {{ usernameSaveError }}
        </p>
      </fieldset>

      <fieldset class="user-details__fieldset">
        <legend class="user-details__legend">Email</legend>
        <label class="field">
          <span class="field__label">Email address</span>
          <input v-model="email" class="field__input" type="email" autocomplete="email" disabled />
        </label>
        <p class="user-details__hint">Email is managed by your sign-in provider.</p>
      </fieldset>

      <div class="user-details__danger">
        <h3 class="user-details__danger-title">Danger zone</h3>
        <p class="user-details__hint">Permanently delete your account and associated data.</p>
        <button type="button" class="btn btn--danger" @click="dialogStore.showDelete()">
          Delete account
        </button>
      </div>
    </div>
  </div>
  <DeleteDialog />
</template>

<style scoped lang="scss">
.user-details {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 40rem;
}

.user-details__masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem 2rem;
}

.user-details__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.user-details__name {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 400;
  color: rgb(var(--tw-ink-primary));
}

.user-details__email {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-muted));
}

.user-details__form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-details__fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.user-details__legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
}

.user-details__row {
  display: grid;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
}

.user-details__row--single {
  grid-template-columns: 1fr;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.field__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgb(var(--tw-ink-muted));
}

.field__input {
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 10px;
  background: rgb(var(--tw-surface-2) / 0.65);
  color: rgb(var(--tw-ink-primary));
  font-size: 0.95rem;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &:focus {
    outline: none;
    border-color: rgb(var(--tw-accent) / 0.55);
    box-shadow: 0 0 0 3px rgb(var(--tw-accent) / 0.15);
  }

  &:read-only,
  &:disabled {
    opacity: 0.72;
    cursor: default;
  }
}

.user-details__actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  text-transform: none;
  letter-spacing: 0;
}

.user-details__hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: rgb(var(--tw-ink-muted));
}

.user-details__error {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: #e08585;
}

:global(html:not(.tw-dark)) .user-details__error {
  color: #b03c3c;
}

.user-details__check {
  color: #6faf7a;
  font-size: 1.1rem;
}

.user-details__danger {
  padding-top: 2rem;
  border-top: 1px solid rgb(var(--tw-hairline));
}

.user-details__danger-title {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    opacity 150ms ease,
    color 150ms ease;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 2px;
  }
}

.btn--ghost {
  border-color: rgb(var(--tw-border));
  background: transparent;
  color: rgb(var(--tw-ink-primary));

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
  }
}

.btn--primary {
  background: rgb(var(--tw-accent));
  color: rgb(var(--tw-canvas));

  &:hover:not(:disabled) {
    opacity: 0.92;
  }
}

.btn--danger {
  margin-top: 0.75rem;
  border-color: rgba(176, 60, 60, 0.45);
  background: rgba(176, 60, 60, 0.08);
  color: #e08585;

  &:hover {
    background: rgba(176, 60, 60, 0.16);
  }
}

:global(html:not(.tw-dark)) .btn--danger {
  color: #b03c3c;
}

.check-enter-active,
.check-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.check-enter-from,
.check-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .field__input,
  .btn,
  .check-enter-active,
  .check-leave-active {
    transition: none;
  }
}
</style>
