<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "src/boot/firebase";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "src/stores/auth.store";

const router = useRouter();

const { login } = useAuthStore();

const $q = useQuasar();

const email = ref("");
const password = ref("");

const onSubmit = async () => {
  if (email.value && password.value) {
    try {
      console.log(email.value, password.value);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.value,
        password.value,
      );

      $q.notify({
        type: "positive",
        message: `¡Inicio de sesión exitoso! Bienvenido ${userCredential.user.email}`,
      });

      login({
        email: userCredential.user.email,
        id: userCredential.user.uid,
        name: userCredential.user.displayName,
        photoUrl: userCredential.user.photoURL,
        role: "admin",
      });

      await router.push("/");

      console.log("Usuario logueado:", userCredential.user);
    } catch (error) {
      $q.notify({
        type: "negative",
        message: `Error al intentar ingresar`,
      });
      console.error("Error en inicio de sesión:", error);
    }
  } else {
    $q.notify({
      type: "negative",
      message: "Por favor, completa todos los campos.",
    });
  }
};
</script>

<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="width: 300px">
      <q-card-section>
        <div class="box-img">
          <q-img
            src="/transporte.png"
            alt="Logo"
            style="width: 100px; height: auto"
          />
        </div>
        <h5 class="text-h5 text-center">Iniciar Sesión</h5>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit">
          <q-input
            v-model="email"
            label="Correo electrónico"
            type="email"
            required
            class="q-mb-md"
          />

          <q-input
            v-model="password"
            label="Contraseña"
            type="password"
            required
            class="q-mb-md"
          />

          <q-btn
            type="submit"
            label="Ingresar"
            color="primary"
            class="full-width"
          />
        </q-form>
      </q-card-section>

      <q-card-section style="text-align: center">
        <RouterLink to="/auth/register"> Registrate </RouterLink>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.box-img {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
