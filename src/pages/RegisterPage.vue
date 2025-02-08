<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "src/boot/firebase";
import { RouterLink } from "vue-router";
import { doc, setDoc } from "firebase/firestore";

const $q = useQuasar();

const email = ref("");
const password = ref("");

const onSubmit = async () => {
  if (email.value && password.value) {
    try {
      console.log(email.value, password.value);

      const newUSer = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value,
      );

      const userReference = doc(db, "users", newUSer.user.uid);
      await setDoc(userReference, {
        role: "administrador",
        email: email.value,
      });

      $q.notify({
        type: "positive",
        message: `¡Registro exitoso ${newUSer.user.email}`,
      });

      console.log("Usuario registrado.", newUSer.user);
    } catch (error) {
      $q.notify({
        type: "negative",
        message: `Error al registrarse`,
      });
      console.error("Error al registrarse", error);
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
        <h5 class="text-h5 text-center">Registrate</h5>
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
            label="Registrar"
            color="primary"
            class="full-width"
          />
        </q-form>
      </q-card-section>

      <q-card-section style="text-align: center">
        <RouterLink to="/auth/login"> Inicia sesión </RouterLink>
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
