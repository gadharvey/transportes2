<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { collection, addDoc, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Viaje {
  id?: string;
  fecha: string;
  hora: string;
  ruta: string;
  vehiculo: string;
  conductor: string;
  capacidad?: number;
}

interface Ruta {
  id: string;
  origen: string;
  destino: string;
  precio: number;
}

interface Vehiculo {
  id: string;
  marca: string;
  capacidad: number;
}

interface Conductor {
  id: string;
  nombres: string;
}

const $q = useQuasar();

const viaje = reactive<Viaje>({
  fecha: "",
  hora: "",
  ruta: "",
  vehiculo: "",
  conductor: "",
});

const rutaList = ref<Ruta[]>([]);
const vehiculoList = ref<Vehiculo[]>([]);
const conductorList = ref<Conductor[]>([]);
const viajeList = ref<Viaje[]>([]);
let unsubscribeViajes: (() => void) | null = null;


const registrarViaje = async (event: Event) => {
  event.preventDefault();
  if (!viaje.fecha || !viaje.hora || !viaje.ruta || !viaje.vehiculo || !viaje.conductor) {
    $q.notify({ type: "warning", message: "Completa todos los campos correctamente" });
    return;
  }

  try {
    const vehiculoSeleccionado = vehiculoList.value.find(v => v.id === viaje.vehiculo);
    const rutaSeleccionada = rutaList.value.find(r => r.id === viaje.ruta);

    if (!rutaSeleccionada) {
      $q.notify({ type: "warning", message: "Ruta seleccionada no encontrada" });
      return;
    }

    await addDoc(collection(db, "viajes"), {
      ...viaje,
      capacidad: vehiculoSeleccionado?.capacidad,
      precioRuta: rutaSeleccionada.precio  // Agregamos el precio de la ruta
    });

    $q.notify({ type: "positive", message: "Viaje registrado con éxito" });
    limpiarFormulario();
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar viaje" });
  }
};


const limpiarFormulario = () => {
  viaje.fecha = "";
  viaje.hora = "";
  viaje.ruta = "";
  viaje.vehiculo = "";
  viaje.conductor = "";
};

const cargarRutas = () => {
  const q = collection(db, "ruta");
  onSnapshot(q, (snapshot) => {
    rutaList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ruta[];
  });
};

const cargarVehiculos = () => {
  const q = collection(db, "vehiculos");
  onSnapshot(q, (snapshot) => {
    vehiculoList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vehiculo[];
  });
};

const cargarConductores = () => {
  const q = collection(db, "conductores");
  onSnapshot(q, (snapshot) => {
    conductorList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conductor[];
  });
};

const escucharViajes = () => {
  const q = collection(db, "viajes");
  unsubscribeViajes = onSnapshot(q, (snapshot) => {
    viajeList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Viaje[];
  });
};

const getRutaNombre = (id: string) => {
  const ruta = rutaList.value.find(r => r.id === id);
  return ruta ? `${ruta.origen} - ${ruta.destino}` : "Ruta no encontrada";
};

const getRutaPrecio = (id: string) => {
  const ruta = rutaList.value.find(r => r.id === id);
  return ruta ? ruta.precio : 0;
};

const getVehiculoNombre = (id: string) => {
  const vehiculo = vehiculoList.value.find(v => v.id === id);
  return vehiculo ? vehiculo.marca : "Vehículo no encontrado";
};

const getConductorNombre = (id: string) => {
  const conductor = conductorList.value.find(c => c.id === id);
  return conductor ? conductor.nombres : "Conductor no encontrado";
};

const eliminarViaje = async (id: string) => {
  try {
    await deleteDoc(doc(db, "viajes", id));
    $q.notify({ type: "positive", message: "Viaje eliminado con éxito" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar el viaje" });
  }
};

onMounted(() => {
  cargarRutas();
  cargarVehiculos();
  cargarConductores();
  escucharViajes();
});

onUnmounted(() => {
  if (unsubscribeViajes) unsubscribeViajes();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit="registrarViaje">
          <q-input v-model="viaje.fecha" label="Fecha del Viaje" type="date" required />
          <q-input v-model="viaje.hora" label="Hora del Viaje" type="time" required />
          <q-select
            v-model="viaje.ruta"
            :options="rutaList.map(ruta => ({ label: `${ruta.origen} - ${ruta.destino}`, value: ruta.id }))"
            label="Ruta"
            emit-value
            map-options
            required
          />
          <q-select
            v-model="viaje.vehiculo"
            :options="vehiculoList.map(vehiculo => ({ label: vehiculo.marca, value: vehiculo.id }))"
            label="Vehículo"
            emit-value
            map-options
            required
          />
          <q-select
            v-model="viaje.conductor"
            :options="conductorList.map(conductor => ({ label: conductor.nombres, value: conductor.id }))"
            label="Conductor"
            emit-value
            map-options
            required
          />
          <q-btn type="submit" label="Registrar Viaje" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Tabla de Viajes Registrados -->
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="viajeList"
      :columns="[ 
        { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
        { name: 'fecha', label: 'Fecha', field: 'fecha', align: 'center' },
        { name: 'hora', label: 'Hora', field: 'hora', align: 'center' },
        { name: 'ruta', label: 'Ruta', field: row => getRutaNombre(row.ruta), align: 'center' },
        { name: 'precioRuta', label: 'Precio de la Ruta', field: row => getRutaPrecio(row.ruta), align: 'center' },
        { name: 'vehiculo', label: 'Vehículo', field: row => getVehiculoNombre(row.vehiculo), align: 'center' },
        { name: 'conductor', label: 'Conductor', field: row => getConductorNombre(row.conductor), align: 'center' },
        { name: 'capacidad', label: 'Capacidad', field: 'capacidad', align: 'center' },
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="red" icon="delete" dense flat @click="eliminarViaje(row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
