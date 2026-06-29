<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import { useDialogStore } from "@/stores/dialog";
import { useUserStore } from "@/stores/user";

import Avatar from "@/components/Avatar.vue";
import DeleteDialog from "@/components/Dialogs/DeleteDialog.vue";

const dialogStore = useDialogStore();
const userStore = useUserStore();
const { userDetails, isUpdatingName, isUpdatingUsername } = storeToRefs(userStore);

const fullName = ref("");
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const username = ref("");
const isEditingName = ref(false);
const isEditingUsername = ref(false);
const showNameCheckmark = ref(false);
const showUsernameCheckmark = ref(false);

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
  try {
    await userStore.updateName(firstName.value, lastName.value);
    isEditingName.value = false;
    showNameCheckmark.value = true;
    setTimeout(() => {
      showNameCheckmark.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to update name:", error);
  }
}

async function updateUsername() {
  try {
    await userStore.updateUsername(username.value);
    isEditingUsername.value = false;
    showUsernameCheckmark.value = true;
    setTimeout(() => {
      showUsernameCheckmark.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to update username:", error);
  }
}
function cancelNameUpdate() {
  isEditingName.value = false;
  firstName.value = userDetails.value?.firstName ?? "";
  lastName.value = userDetails.value?.lastName ?? "";
}

function cancelUsernameUpdate() {
  isEditingUsername.value = false;
  username.value = userDetails.value?.userName ?? "";
}

watch(
  () => userDetails.value,
  () => {
    fullName.value = userDetails.value?.fullName ?? "";
    firstName.value = userDetails.value?.firstName ?? "";
    lastName.value = userDetails.value?.lastName ?? "";
    email.value = userDetails.value?.email ?? "";
    username.value = userDetails.value?.userName ?? "";
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <div class="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-5 tw-mt-4">
    <Avatar :size="'x-large'" />
    <div class="tw-flex tw-w-full sm:tw-w-[50%] tw-flex-col tw-gap-5">
      <div class="tw-flex tw-gap-3">
        <v-text-field
          :readonly="!isEditingName"
          :loading="isUpdatingName"
          label="First Name"
          v-model="firstName"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>

        <v-text-field
          :readonly="!isEditingName"
          :loading="isUpdatingName"
          label="Last Name"
          v-model="lastName"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>

        <div class="tw-flex tw-items-center tw-gap-2 tw-relative">
          <v-btn v-if="!isEditingName" variant="outlined" @click="isEditingName = true">
            Edit
          </v-btn>
          <v-btn
            v-else
            variant="outlined"
            @click="updateName"
            :loading="isUpdatingName"
            :disabled="!hasNameChanged"
          >
            Update
          </v-btn>
          <v-btn v-if="isEditingName" variant="outlined" @click="cancelNameUpdate" color="red">
            Cancel
          </v-btn>
          <Transition>
            <v-icon
              v-if="showNameCheckmark"
              icon="fas fa-check-circle"
              color="success"
              class="checkmark-animation tw-absolute tw-left-full tw-ml-2"
            />
          </Transition>
        </div>
      </div>
      <div class="tw-flex tw-gap-3">
        <v-text-field
          :readonly="!isEditingUsername"
          :loading="isUpdatingUsername"
          label="Username"
          v-model="username"
          variant="outlined"
          rounded="2"
          hide-details
          density="compact"
        ></v-text-field>

        <div class="tw-flex tw-items-center tw-gap-2 tw-relative">
          <v-btn v-if="!isEditingUsername" variant="outlined" @click="isEditingUsername = true">
            Edit
          </v-btn>
          <v-btn
            v-else
            variant="outlined"
            @click="updateUsername"
            :loading="isUpdatingUsername"
            :disabled="!hasUsernameChanged"
          >
            Update
          </v-btn>
          <v-btn
            v-if="isEditingUsername"
            variant="outlined"
            @click="cancelUsernameUpdate"
            color="red"
          >
            Cancel
          </v-btn>
          <Transition>
            <v-icon
              v-if="showUsernameCheckmark"
              icon="fas fa-check-circle"
              color="success"
              class="checkmark-animation tw-absolute tw-left-full tw-ml-2"
            />
          </Transition>
        </div>
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
<style scoped lang="scss">
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.checkmark-animation {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
