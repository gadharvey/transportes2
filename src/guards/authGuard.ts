import { useAuthStore } from "src/stores/auth.store";
import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.user?.role || "no rol mono travieso";

  if (to.meta.requiresAuth && !isAuthenticated) {
    if (to.path !== "/auth/login") {
      next("/auth/login");
    } else {
      next();
    }
  } else if (isAuthenticated && to.path === "/auth/login") {
    next("/");
  } else if (to.meta.roles) {
    const allowedRoles = to.meta.roles as string[];
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      next("/");
    }
  } else {
    next();
  }
}
