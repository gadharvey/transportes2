import { defineStore } from "pinia";

interface User {
  id: string;
  email: string | null;
  role: string;
  name: string | null;
  photoUrl: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
    isAdmin: (state) => state.user?.role === "admin",
  },
  actions: {
    login(userData: User) {
      this.user = userData;
    },
    logout() {
      this.user = null;
    },
  },
  persist: true,
});
