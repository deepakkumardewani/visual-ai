import { defineStore } from 'pinia';

import type { IImageObject, IPayment, IUser } from '@/types';

import { useAuthStore } from '@/stores/auth';
import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('user');

export const useUserStore = defineStore('user', () => {
  const userDetails = ref<IUser | null>(null);
  const history = ref<IImageObject[]>([]);
  const payments = ref<IPayment[]>([]);
  const userId = ref('');
  const credits = ref(0);
  const isPro = ref(false);
  /** True after the first getUserDetails attempt finishes (success or failure). */
  const isReady = ref(false);
  const hasJustSubscribed = ref(false);
  const isUpdatingName = ref(false);
  const isUpdatingUsername = ref(false);
  function setCredits(value: number) {
    credits.value = value;
  }
  async function getUserDetails() {
    if (!userId.value) return;

    const { getToken } = useAuthStore();
    const token = await getToken();
    const url = `${import.meta.env.VITE_API_BASEPATH}/users/${userId.value}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        log.error('getUserDetails failed', {
          status: response.status,
          userId: userId.value,
        });
        return;
      }

      const userData = (await response.json()) as IUser;
      userDetails.value = userData;
      history.value = userData.history ?? [];
      payments.value = userData.payments ?? [];
      isPro.value = userData.isPro;
      const dataToStoreInLocalStorage = {
        userId: userData.userId,
      };
      if (localStorage.getItem('userDetails') === null) {
        localStorage.setItem('userDetails', JSON.stringify(dataToStoreInLocalStorage));
      }
      credits.value = userData.credits;
    } catch (error) {
      log.error('getUserDetails failed', { error, userId: userId.value });
    } finally {
      isReady.value = true;
    }
  }

  async function updateName(firstName: string, lastName: string) {
    const url = `/users/fullname`;
    isUpdatingName.value = true;
    const { error } = await useFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors',
      },
      body: JSON.stringify({ firstName, lastName, userId: userId.value }),
    }).json();
    isUpdatingName.value = false;

    if (error.value) {
      log.error('updateName failed', { error: error.value, userId: userId.value });
      return;
    }
  }

  async function updateUsername(username: string) {
    const url = `/users/username`;
    isUpdatingUsername.value = true;
    const { error } = await useFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors',
      },
      body: JSON.stringify({ userName: username, userId: userId.value }),
    }).json();
    isUpdatingUsername.value = false;
    if (error.value) {
      log.error('updateUsername failed', { error: error.value, userId: userId.value });
      return;
    }
  }
  async function syncFromClerk(clerkUserId: string) {
    if (!clerkUserId) return;
    userId.value = clerkUserId;
    await getUserDetails();
  }

  return {
    userId,
    credits,
    userDetails,
    history,
    isPro,
    isReady,
    payments,
    hasJustSubscribed,
    isUpdatingName,
    isUpdatingUsername,
    setCredits,
    syncFromClerk,
    getUserDetails,
    updateName,
    updateUsername,
  };
});
