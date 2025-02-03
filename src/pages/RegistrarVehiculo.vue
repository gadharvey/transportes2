<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Conductor {
  label: string;
  value: string;
}

interface Vehiculo {
  id?: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  tipo: string;
  capacidad: string;
  conductorId: string;
}

const $q = useQuasar();
const conductores = ref<Conductor[]>([]);
const vehiculosList = ref<Vehiculo[]>([]);
let unsubscribe: any = null;

const vehiculo = reactive<Vehiculo>({
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

const registrarVehiculo = async () => {
  try {
    await addDoc(collection(db, "vehiculos"), vehiculo);
    $q.notify({ type: "positive", message: "Vehículo registrado" });

    // Limpiar formulario
    Object.assign(vehiculo, {
      placa: "",
      marca: "",
      modelo: "",
      anio: "",
      color: "",
      tipo: "",
      capacidad: "",
      conductorId: "",
    });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar vehículo" });
  }
};

const escucharVehiculos = () => {
  const q = collection(db, "vehiculos");

  unsubscribe = onSnapshot(q, (snapshot) => {
    vehiculosList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vehiculo[];
  });
};

const eliminarVehiculo = async (id: string) => {
  try {
    await deleteDoc(doc(db, "vehiculos", id));
    $q.notify({ type: "positive", message: "Vehículo eliminado" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar vehículo" });
  }
};

onMounted(() => {
  cargarConductores();
  escucharVehiculos();
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit.prevent="registrarVehiculo">
          <q-input v-model="vehiculo.placa" label="Placa" required />
          <q-input v-model="vehiculo.marca" label="Marca" required />
          <q-input v-model="vehiculo.modelo" label="Modelo" required />
          <q-input v-model="vehiculo.anio" label="Año" type="number" required />
          <q-input v-model="vehiculo.color" label="Color" required />
          <q-input v-model="vehiculo.tipo" label="Tipo de Vehículo" required />
          <q-input v-model="vehiculo.capacidad" label="Capacidad" type="number" required />
          <q-select v-model="vehiculo.conductorId" :options="conductores" label="Seleccionar Conductor" required />
          <q-btn type="submit" label="Registrar" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Tabla de Vehículos Registrados -->
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="vehiculosList"
      :columns="[
        { name: 'placa', label: 'Placa', field: 'placa', align: 'left' },
        { name: 'marca', label: 'Marca', field: 'marca', align: 'left' },
        { name: 'modelo', label: 'Modelo', field: 'modelo', align: 'left' },
        { name: 'anio', label: 'Año', field: 'anio', align: 'left' },
        { name: 'color', label: 'Color', field: 'color', align: 'left' },
        { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
        { name: 'capacidad', label: 'Capacidad', field: 'capacidad', align: 'left' },
        // { name: 'acciones', label: 'Acciones', align: 'center' }
        { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="red" icon="delete" dense flat @click="eliminarVehiculo(row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
