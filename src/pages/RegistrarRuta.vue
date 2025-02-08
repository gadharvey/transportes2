<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Ruta {
  id?: string;
  origen: string;
  destino: string;
  tiempo: string;
  distancia: string;
}

const $q = useQuasar();

const ruta = reactive<Ruta>({
  origen: "",
  destino: "",
  tiempo: "",
  distancia: "",
});

const rutaList = ref<Ruta[]>([]);
const terminalList = ref<string[]>([]);
let unsubscribe: () => void | null = null;

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
          <q-btn type="submit" label="Registrar Ruta" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Tabla de Rutas Registradas -->
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="rutaList"
      :columns="[ 
        { name: 'acciones', label: 'Acciones', align: 'center' },
        { name: 'origen', label: 'Origen', field: 'origen', align: 'center' },
        { name: 'destino', label: 'Destino', field: 'destino', align: 'center' },
        { name: 'tiempo', label: 'Tiempo (min)', field: 'tiempo', align: 'center' },
        { name: 'distancia', label: 'Distancia (km)', field: 'distancia', align: 'center' },
      ]"
      row-key="id"
    >
      <!-- <template v-slot:body-cell-acciones="props">
        <q-td align="center">
          <q-btn
            flat
            dense
            round
            icon="delete"
            color="red"
            @click="eliminarRuta(props.row.id)"
          />
        </q-td>
      </template> -->
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="red" icon="delete" dense flat @click="eliminarRuta(row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
