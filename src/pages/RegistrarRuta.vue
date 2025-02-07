<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Terminal {
  label: string;
  value: string;
}

interface Ruta {
  id?: string;
  origenId: string;
  destinoId: string;
  duracion: string;
  distancia: string;
}

const $q = useQuasar();
const terminales = ref<Terminal[]>([]);
const rutasList = ref<Ruta[]>([]);
let unsubscribe: any = null;

const ruta = reactive<Ruta>({
  origenId: "",
  destinoId: "",
  duracion: "",
  distancia: "",
});

const cargarTerminales = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "terminal"));
    terminales.value = querySnapshot.docs.map((doc) => ({
      label: doc.data().Ciudad || "Desconocido",
      value: doc.id,
    }));
    console.log("Terminales cargados:", terminales.value); // Debug log
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar terminales" });
  }
};

const registrarRuta = async () => {
  try {
    console.log("Registrando ruta con:", ruta); // Debug log
    await addDoc(collection(db, "ruta"), { 
      ...ruta,
      origenId: ruta.origenId || "Desconocido",
      destinoId: ruta.destinoId || "Desconocido"
    });

    $q.notify({ type: "positive", message: "Ruta registrada" });

    Object.assign(ruta, {
      origenId: "",
      destinoId: "",
      duracion: "",
      distancia: "",
    });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar ruta" });
  }
};

const obtenerNombreTerminal = async (id: string): Promise<string> => {
  if (!id) return "Desconocido";
  try {
    console.log(`Buscando terminal con ID: ${id}`); // Debug log
    const terminalDoc = await getDoc(doc(db, "terminal", id));
    if (terminalDoc.exists()) {
      console.log("Terminal encontrada:", terminalDoc.data()); // Debug log
      return terminalDoc.data()?.Ciudad || "Desconocido";
    } else {
      console.log("No se encontró la terminal");
      return "Desconocido";
    }
  } catch (error) {
    console.error("Error al obtener la terminal:", error);
    return "Desconocido";
  }
};

const escucharRutas = () => {
  const q = collection(db, "ruta");

  unsubscribe = onSnapshot(q, async (snapshot) => {
    console.log("Actualizando rutas...");
    const rutas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ruta[];

    rutasList.value = await Promise.all(
      rutas.map(async (ruta) => ({
        ...ruta,
        origen: await obtenerNombreTerminal(ruta.origenId as string || "Desconocido"),
        destino: await obtenerNombreTerminal(ruta.destinoId as string || "Desconocido"),
      }))
    );
  });
};

const eliminarRuta = async (id: string) => {
  try {
    await deleteDoc(doc(db, "ruta", id));
    $q.notify({ type: "positive", message: "Ruta eliminada" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar ruta" });
  }
};

onMounted(() => {
  cargarTerminales();
  escucharRutas();
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit.prevent="registrarRuta">
          <q-select v-model="ruta.origenId" :options="terminales" label="Seleccionar Origen" required />
          <q-select v-model="ruta.destinoId" :options="terminales" label="Seleccionar Destino" required />
          <q-input v-model="ruta.duracion" label="Duracion (MIN)" type="number" required />
          <q-input v-model="ruta.distancia" label="Distancia (KM)" type="number" required />
          <q-btn type="submit" label="Registrar" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="rutasList"
      :columns="[ 
        { name: 'origenId', label: 'Origen', field: 'origenId', align: 'left' },
        { name: 'destinoId', label: 'Destino', field: 'destinoId', align: 'left' },
        { name: 'duracion', label: 'Duracion (min)', field: 'duracion', align: 'left' },
        { name: 'distancia', label: 'Distancia', field: 'distancia', align: 'left' },
        { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'left' },
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
