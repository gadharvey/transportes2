<script setup lang="ts">
import { collection, addDoc } from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";
import { reactive } from "vue";

const $q = useQuasar();

const conductor = reactive({
  nombres: "",
  apellidos: "",
  tipo_documento: "",
  n_documento: "",
  genero: "",
  fecha_nacimiento: "",
  celular: "",
  email: "",
  direccion_domicilio: "",
  licencia: "",
});

const registrarConductor = async () => {
  try {
    await addDoc(collection(db, "conductores"), conductor);
    $q.notify({ type: "positive", message: "Conductor registrado" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar" });
  }
};
</script>
<template>
  <q-page padding>
    <q-form @submit="registrarConductor">
      <q-input v-model="conductor.nombres" label="Nombres" required />
      <q-input v-model="conductor.apellidos" label="Apellidos" required />
      <q-input
        v-model="conductor.tipo_documento"
        label="Tipo Documento"
        required
      />
      <q-input
        v-model="conductor.n_documento"
        label="Número Documento"
        required
      />
      <q-input v-model="conductor.genero" label="Género" required />
      <q-input
        v-model="conductor.fecha_nacimiento"
        label="Fecha Nacimiento"
        type="date"
        required
      />
      <q-input v-model="conductor.celular" label="Celular" />
      <q-input v-model="conductor.email" label="Email" type="email" required />
      <q-input v-model="conductor.direccion_domicilio" label="Dirección" />
      <q-input v-model="conductor.licencia" label="Licencia" required />
      <q-btn type="submit" label="Registrar" color="primary" />
    </q-form>
  </q-page>
</template>
