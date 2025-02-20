<script setup lang="ts">
import { useAuthStore } from "src/stores/auth.store";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

enum Role {
  ADMIN = "admin",
  GERENTE = "gerente",
}

const fullLinksList = [
  {
    title: "Procesos",
    icon: "folder_open",
    children: [
      { title: "Hora Salida", url: "/registrar-pasaje", roles: [Role.GERENTE, Role.ADMIN] },
      { title: "Datos empresa", url: "/", roles: [Role.GERENTE, Role.ADMIN] },
    ],
  },
  {
    title: "Registros",
    icon: "add",
    children: [
      { title: "Registrar conductores", url: "/registrar-conductor", roles: [Role.ADMIN] },
      { title: "Registrar vehículos", url: "/registrar-vehiculo", roles: [Role.ADMIN] },
      { title: "Registrar personal", url: "/registrar-personal", roles: [Role.ADMIN] },
      { title: "Registrar ruta", url: "/registrar-ruta", roles: [Role.ADMIN] },
    ],
  },
  {
    title: "Administrar",
    icon: "manage_accounts",
    children: [
      { title: "Crear Terminales", url: "/crear-terminal", roles: [Role.ADMIN] },
      { title: "Crear Viaje", url: "/crear-viaje", roles: [Role.GERENTE, Role.ADMIN] },
    ],
  },
  {
    title: "Configuración",
    icon: "settings",
    children: [
      { title: "Mi perfil", url: "/", roles: [Role.ADMIN] },
      { title: "Datos empresa", url: "/", roles: [Role.ADMIN] },
    ],
  },
];

const filteredLinksList = computed(() => {
  if (!user.value.role) return [];

  return fullLinksList
    .map((link) => {
      const filteredChildren = link.children?.filter((child) =>
        child.roles.includes(user.value.role as Role)
      );
      if (filteredChildren && filteredChildren.length > 0) {
        return { ...link, children: filteredChildren };
      }
      return null;
    })
    .filter((link) => link !== null) as Link[];
});

const leftDrawerOpen = ref(false);
const confirmLogout = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function logout() {
  authStore.logout();
  router.push("/auth/login");
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
      </q-toolbar>
    </q-header>

    <!-- Drawer lateral -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>
          <img src="transporte.png" alt="Logo" style="
              display: block;
              margin: auto;
              width: 100%;
              max-width: 100px;
              height: auto;
            " />
        </q-item-label>

        <q-item clickable tag="a" @click="router.push('/')">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
          </q-item-section>
        </q-item>

        <q-expansion-item v-for="(link, index) in filteredLinksList" :key="index" :icon="link.icon" :label="link.title"
          expand-separator>
          <q-list dense>
            <q-item v-for="(child, idx) in link.children" :key="idx" clickable v-ripple @click="router.push(child.url)">
              <q-item-section>{{ child.title }}</q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </q-list>

      <div class="user-card">
        <q-card flat bordered>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-avatar size="40px">
                <img v-if="user?.photoUrl" :src="user.photoUrl" />
                <q-icon v-else name="person" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ user?.name || user?.email }}</q-item-label>
              <q-item-label caption> {{ user?.role }} </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn flat dense round icon="more_vert">
                <q-menu anchor="top middle" self="bottom middle">
                  <q-list>
                    <q-item clickable v-close-popup @click="confirmLogout = true">
                      <q-item-section>
                        <q-item-label>Cerrar sesión</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="confirmLogout">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="red" text-color="white" />
          <span class="q-ml-sm">¿Estás seguro de que deseas cerrar sesión?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Salir" color="red" @click="logout" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<style scoped>
.user-card {
  position: absolute;
  bottom: 10px;
  width: 100%;
  padding: 10px;
}
</style>
