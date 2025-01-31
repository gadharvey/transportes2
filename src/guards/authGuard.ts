import { useAuthStore } from "src/stores/auth.store";
import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

export function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    if (to.path !== "/auth/login") {
      next("/auth/login"); // Redirigir solo si NO está en /login
    } else {
      next(); // Permitir el acceso a /login para evitar bucle
    }
  } else if (isAuthenticated && to.path === "/auth/login") {
    next("/"); // Si está autenticado y va a /login, enviarlo al inicio
  } else {
    next(); // Continuar con la navegación normal
  }
}
