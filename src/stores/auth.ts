// Utilities
import { defineStore } from "pinia";
import { useAuth, useUser } from "vue-clerk";

export const useAuthStore = defineStore("auth", () => {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  return { isLoaded, isSignedIn, getToken };
});
