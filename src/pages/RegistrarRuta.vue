<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Punto {
  nombre: string;
  precio: number;
}

interface Ruta {
  id?: string;
  origen: string;
  destino: string;
  tiempo: string;
  distancia: string;
  precio: number;  // Precio del viaje de Origen a Destino
  puntos: Punto[]; // Lista de puntos intermedios con precios
}

const $q = useQuasar();

const ruta = reactive<Ruta>({
  origen: "",
  destino: "",
  tiempo: "",
  distancia: "",
  precio: 0,
  puntos: [],
});

const nuevoPunto = reactive<Punto>({
  nombre: "",
  precio: 0,
});

const rutaList = ref<Ruta[]>([]);
const terminalList = ref<string[]>([]);
let unsubscribe: (() => void) | null = null;

const registrarRuta = async (event: Event) => {
  event.preventDefault();
  if (ruta.origen === ruta.destino) {
    $q.notify({ type: "warning", message: "El origen y el destino no pueden ser iguales" });
    return;
  }

  try {
    await addDoc(collection(db, "ruta"), { ...ruta });
    $q.notify({ type: "positive", message: "Ruta registrada con éxito" });
    limpiarFormulario();
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar ruta" });
  }
};

const limpiarFormulario = () => {
  ruta.origen = "";
  ruta.destino = "";
  ruta.tiempo = "";
  ruta.distancia = "";
  ruta.precio = 0;
  ruta.puntos = [];
  nuevoPunto.nombre = "";
  nuevoPunto.precio = 0;
};

const escucharRutas = () => {
  const q = collection(db, "ruta");

  unsubscribe = onSnapshot(q, (snapshot) => {
    rutaList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ruta[];
  });
};

const cargarTerminales = () => {
  const q = collection(db, "terminal");

  onSnapshot(q, (snapshot) => {
    terminalList.value = snapshot.docs.map((doc) => doc.data().Ciudad);
  });
};

const eliminarRuta = async (id: string) => {
  try {
    await deleteDoc(doc(db, "ruta", id));
    $q.notify({ type: "positive", message: "Ruta eliminada con éxito" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar la ruta" });
  }
};

const agregarPunto = () => {
  if (!nuevoPunto.nombre || nuevoPunto.precio <= 0) {
    $q.notify({ type: "warning", message: "Ingrese un punto válido con precio mayor a 0" });
    return;
  }

  ruta.puntos.push({ ...nuevoPunto });
  nuevoPunto.nombre = "";
  nuevoPunto.precio = 0;
};

const eliminarPunto = (index: number) => {
  ruta.puntos.splice(index, 1);
  $q.notify({ type: "info", message: "Punto intermedio eliminado" });
};

onMounted(() => {
  escucharRutas();
  cargarTerminales();
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit="registrarRuta">
          <q-select
            v-model="ruta.origen"
            :options="terminalList"
            label="Origen"
            map-options
            emit-value
            required
          />
          <q-select
            v-model="ruta.destino"
            :options="terminalList"
            label="Destino"
            map-options
            emit-value
            required
          />
          <q-input v-model="ruta.tiempo" label="Tiempo (minutos)" type="number" required />
          <q-input v-model="ruta.distancia" label="Distancia (km)" type="number" required />
          <q-input v-model="ruta.precio" label="Precio (S/.) del viaje" type="number" required />

          <q-card-section class="q-mt-lg">
            <h6>Puntos Intermedios</h6>
            <div class="q-gutter-md row items-center">
              <q-input v-model="nuevoPunto.nombre" label="Nombre del Punto" />
              <q-input v-model.number="nuevoPunto.precio" label="Precio (S/.)" type="number" />
              <q-btn label="Agregar Punto" @click="agregarPunto" color="primary" />
            </div>
            <ul v-if="ruta.puntos.length">
              <li v-for="(punto, index) in ruta.puntos" :key="index">
                {{ punto.nombre }} - S/. {{ punto.precio.toFixed(2) }}
                <q-btn dense flat icon="delete" color="red" @click="eliminarPunto(index)" />
              </li>
            </ul>
          </q-card-section>

          <q-btn type="submit" label="Registrar Ruta" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="rutaList"
      :columns="[ 
        { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
        { name: 'origen', label: 'Origen', field: 'origen', align: 'center' },
        { name: 'destino', label: 'Destino', field: 'destino', align: 'center' },
        { name: 'tiempo', label: 'Tiempo (min)', field: 'tiempo', align: 'center' },
        { name: 'distancia', label: 'Distancia (km)', field: 'distancia', align: 'center' },
        { name: 'precio', label: 'Precio (S/.)', field: 'precio', align: 'center' }
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="red" icon="delete" dense flat @click="eliminarRuta(row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
