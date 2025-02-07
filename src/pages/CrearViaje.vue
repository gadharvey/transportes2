<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "src/boot/firebase";

const $q = useQuasar();

const viaje = ref({
  fechaHora: "",
  precio: "",
  rutaId: "",
  vehiculoId: "",
  conductorId: "",
});

const rutas = ref<{ label: string; value: string }[]>([]);
const vehiculos = ref<{ label: string; value: string }[]>([]);
const conductores = ref<{ label: string; value: string }[]>([]);

const cargarDatos = async () => {
  try {
    const rutasSnapshot = await getDocs(collection(db, "ruta"));
    rutas.value = rutasSnapshot.docs.map(doc => ({
      label: doc.data().nombre || "Desconocido",
      value: doc.id,
    }));
    console.log("Rutas cargadas:", rutas.value); // Debug log

    const vehiculosSnapshot = await getDocs(collection(db, "vehiculo"));
    vehiculos.value = vehiculosSnapshot.docs.map(doc => ({
      label: doc.data().nombre || "Desconocido",
      value: doc.id,
    }));
    console.log("Vehículos cargados:", vehiculos.value); // Debug log

    const conductoresSnapshot = await getDocs(collection(db, "conductor"));
    conductores.value = conductoresSnapshot.docs.map(doc => ({
      label: doc.data().nombre || "Desconocido",
      value: doc.id,
    }));
    console.log("Conductores cargados:", conductores.value); // Debug log
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar datos" });
  }
};

const registrarViaje = async () => {
  try {
    await addDoc(collection(db, "viaje"), viaje.value);
    $q.notify({ type: "positive", message: "Viaje registrado" });
    Object.assign(viaje.value, {
      fechaHora: "",
      precio: "",
      rutaId: "",
      vehiculoId: "",
      conductorId: "",
    });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar viaje" });
  }
};

onMounted(() => {
  cargarDatos();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit.prevent="registrarViaje">
          <q-input v-model="viaje.fechaHora" label="Fecha y Hora" type="datetime-local" required />
          <q-input v-model="viaje.precio" label="Precio" type="number" required />
          <q-select v-model="viaje.rutaId" :options="rutas" label="Seleccionar Ruta" required />
          <q-select v-model="viaje.vehiculoId" :options="vehiculos" label="Seleccionar Vehículo" required />
          <q-select v-model="viaje.conductorId" :options="conductores" label="Seleccionar Conductor" required />
          <q-btn type="submit" label="Registrar" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>
