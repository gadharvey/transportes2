import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        component: () => import("pages/HomePage.vue"),
      },
      {
        path: "registrar-conductor",
        component: () => import("pages/RegistrarConductor.vue"),
      },
      {
        path: "registrar-vehiculo",
        component: () => import("pages/RegistrarVehiculo.vue"),
      },
      {
        path: "registrar-personal",
        component: () => import("pages/RegistrarPersonal.vue"),
      },
      {
        path: "registrar-ruta",
        component: () => import("pages/RegistrarRuta.vue"),
      },
      {
        path: "crear-terminal",
        component: () => import("pages/CrearTerminal.vue"),
      },
      {
        path: "crear-viaje",
        component: () => import("pages/CrearViaje.vue"),
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
