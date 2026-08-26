import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { IImageObject, IPayment, IUser } from '@/types';

import { useAuthStore } from '@/stores/auth';
import { useFetch } from '@/composables/useFetch';
import { canAffordGeneration } from '@/utils/generationCredits';
import { createLogger } from '@/utils/logger';

const log = createLogger('user');

export const useUserStore = defineStore('user', () => {
  const userDetails = ref<IUser | null>(null);
  const history = ref<IImageObject[]>([]);
  const payments = ref<IPayment[]>([]);
  const userId = ref('');
  const credits = ref(0);
  const dailyCredits = ref(0);
  /** True after the first getUserDetails attempt finishes (success or failure). */
  const isReady = ref(false);
  const hasJustSubscribed = ref(false);
  const isUpdatingName = ref(false);
  const isUpdatingUsername = ref(false);
  function setCredits(value: number) {
    credits.value = value;
  }

  /** Whether balance covers the cost for the given output count and model. */
  function canAffordOutputs(noOfOutputs: number, baseCostPerImage = 1): boolean {
    return canAffordGeneration(credits.value, noOfOutputs, baseCostPerImage);
  }

  const hasCredits = computed(() => credits.value > 0);
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
      const dataToStoreInLocalStorage = {
        userId: userData.userId,
      };
      if (localStorage.getItem('userDetails') === null) {
        localStorage.setItem('userDetails', JSON.stringify(dataToStoreInLocalStorage));
      }
      credits.value = userData.credits;
      dailyCredits.value = userData.dailyCredits ?? 0;
    } catch (error) {
      log.error('getUserDetails failed', { error, userId: userId.value });
    } finally {
      isReady.value = true;
    }
  }

  async function updateName(firstName: string, lastName: string): Promise<boolean> {
    const url = `/users/fullname`;
    isUpdatingName.value = true;
    try {
      const { error } = await useFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          mode: 'cors',
        },
        body: JSON.stringify({ firstName, lastName, userId: userId.value }),
      }).json();

      if (error.value) {
        log.error('updateName failed', { error: error.value, userId: userId.value });
        return false;
      }
      return true;
    } catch (error) {
      log.error('updateName failed', { error, userId: userId.value });
      return false;
    } finally {
      isUpdatingName.value = false;
    }
  }

  async function updateUsername(username: string): Promise<boolean> {
    const url = `/users/username`;
    isUpdatingUsername.value = true;
    try {
      const { error } = await useFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          mode: 'cors',
        },
        body: JSON.stringify({ userName: username, userId: userId.value }),
      }).json();
      if (error.value) {
        log.error('updateUsername failed', { error: error.value, userId: userId.value });
        return false;
      }
      return true;
    } catch (error) {
      log.error('updateUsername failed', { error, userId: userId.value });
      return false;
    } finally {
      isUpdatingUsername.value = false;
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
    dailyCredits,
    userDetails,
    history,
    isReady,
    payments,
    hasJustSubscribed,
    isUpdatingName,
    isUpdatingUsername,
    hasCredits,
    canAffordOutputs,
    setCredits,
    syncFromClerk,
    getUserDetails,
    updateName,
    updateUsername,
  };
});
