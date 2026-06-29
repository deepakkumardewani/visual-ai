import { defineStore } from "pinia";
import { useUser } from "vue-clerk";

import type { IImageObject, IPayment, IUser } from "@/types";

import { useFetch } from "@/composables/useFetch";

export const useUserStore = defineStore("user", () => {
  const { user } = useUser();
  const userDetails = ref<IUser | null>(null);
  const history = ref<IImageObject[]>([]);
  const payments = ref<IPayment[]>([]);
  const userId = ref("");
  const credits = ref(0);
  const isPro = ref(false);
  const hasJustSubscribed = ref(false);
  const isUpdatingName = ref(false);
  const isUpdatingUsername = ref(false);
  function setCredits(value: number) {
    credits.value = value;
  }
  async function getUserDetails() {
    const url = `/users/${userId.value}`;
    const { error, data: userData } = await useFetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        mode: "cors",
      },
    }).json<IUser>();

    if (userData.value) {
      userDetails.value = userData.value;
      history.value = userData.value.history;
      payments.value = userData.value.payments;
      isPro.value = userData.value.isPro;
      const dataToStoreInLocalStorage = {
        userId: userData.value.userId,
      };
      if (localStorage.getItem("userDetails") === null) {
        localStorage.setItem("userDetails", JSON.stringify(dataToStoreInLocalStorage));
      }
      credits.value = userData.value.credits;
    }
    if (error.value) {
      console.error("Error fetching user details:", error.value);
      return;
    }
  }

  async function updateName(firstName: string, lastName: string) {
    const url = `/users/fullname`;
    isUpdatingName.value = true;
    const { error } = await useFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        mode: "cors",
      },
      body: JSON.stringify({ firstName, lastName, userId: userId.value }),
    }).json();
    isUpdatingName.value = false;

    if (error.value) {
      console.error("Error updating name:", error.value);
      return;
    }
  }

  async function updateUsername(username: string) {
    const url = `/users/username`;
    isUpdatingUsername.value = true;
    const { error } = await useFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        mode: "cors",
      },
      body: JSON.stringify({ userName: username, userId: userId.value }),
    }).json();
    isUpdatingUsername.value = false;
    if (error.value) {
      console.error("Error updating username:", error.value);
      return;
    }
  }
  watch(user, () => {
    if (user.value) {
      const { id } = user.value;
      userId.value = id;
      getUserDetails();
    }
  });
  return {
    userId,
    credits,
    userDetails,
    history,
    isPro,
    payments,
    hasJustSubscribed,
    isUpdatingName,
    isUpdatingUsername,
    setCredits,
    updateName,
    updateUsername,
  };
});
