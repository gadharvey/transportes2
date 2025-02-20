import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    meta: {
      requiresAuth: true,
      roles: ["admin", "gerente"],
    },
    children: [
      {
        path: "",
        component: () => import("pages/HomePage.vue"),
      },
      {
        path: "registrar-conductor",
        component: () => import("pages/RegistrarConductor.vue"),
        meta: { roles: ["admin"] },
      },
      {
        path: "registrar-vehiculo",
        component: () => import("pages/RegistrarVehiculo.vue"),
        meta: { roles: ["admin"] },
      },
      {
        path: "registrar-personal",
        component: () => import("pages/RegistrarPersonal.vue"),
        meta: { roles: ["admin"] },
      },
      {
        path: "registrar-ruta",
        component: () => import("pages/RegistrarRuta.vue"),
        meta: { roles: ["admin"] },
      },
      {
        path: "crear-terminal",
        component: () => import("pages/CrearTerminal.vue"),
        meta: { roles: ["admin"] },
      },
      {
        path: "crear-viaje",
        component: () => import("pages/CrearViaje.vue"),
        meta: { roles: ["admin", "gerente"] },
      },
      {
        path: "registrar-pasaje",
        component: () => import("pages/HoraSalida.vue"),
        meta: { roles: ["admin", "gerente"] },
      },
    ],
  },
  {
    path: "/auth",
    component: () => import("layouts/AuthLayout.vue"),
    children: [
      {
        path: "login",
        component: () => import("pages/LoginPage.vue"),
      },
      {
        path: "register",
        component: () => import("pages/RegisterPage.vue"),
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
