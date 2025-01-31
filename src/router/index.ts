import { defineRouter } from "#q-app/wrappers";
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";
import routes from "./routes";
import { authGuard } from "src/guards/authGuard";

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : createWebHistory; // 🔥 Cambiado aquí

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(authGuard);

  return Router;
});
