<script setup lang="ts">
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";
import { reactive, ref, onMounted } from "vue";

interface Conductor {
  label: string;
  value: string;
}

const $q = useQuasar();
const conductores = ref<Conductor[]>([]);

const vehiculo = reactive({
  placa: "",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  tipo: "",
  capacidad: "",
  conductorId: "",
});

const cargarConductores = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "conductores"));

    conductores.value = querySnapshot.docs.map((doc) => ({
      label: `${doc.data().nombres} ${doc.data().apellidos}`,
      value: doc.id,
    }));
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar conductores" });
  }
};

onMounted(cargarConductores);

const registrarVehiculo = async () => {
  try {
    await addDoc(collection(db, "vehiculos"), vehiculo);
    $q.notify({ type: "positive", message: "Vehículo registrado" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar vehículo" });
  }
};
</script>
<template>
  <q-page padding>
    <q-form @submit.prevent="registrarVehiculo">
      <q-input v-model="vehiculo.placa" label="Placa" required />
      <q-input v-model="vehiculo.marca" label="Marca" required />
      <q-input v-model="vehiculo.modelo" label="Modelo" required />
      <q-input v-model="vehiculo.anio" label="Año" type="number" required />
      <q-input v-model="vehiculo.color" label="Color" required />
      <q-input v-model="vehiculo.tipo" label="Tipo de Vehículo" required />
      <q-input
        v-model="vehiculo.capacidad"
        label="Capacidad"
        type="number"
        required
      />
      <q-select
        v-model="vehiculo.conductorId"
        :options="conductores"
        label="Seleccionar Conductor"
        required
      />
      <q-btn type="submit" label="Registrar" color="primary" />
    </q-form>
  </q-page>
</template>
