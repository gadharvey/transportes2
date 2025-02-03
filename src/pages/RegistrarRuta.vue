<script setup lang="ts">
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";
import { reactive, ref, onMounted, computed } from "vue";

interface Terminal {
  label: string;
  value: string;
}

interface Ruta {
  origen: string;
  destino: string;
  duracion: number;
  distancia: number;
}

export interface Root {
  origen: Origen
  duracion: number
  destino: Destino
  distancia: number
}

export interface Origen {
  value: string
  label: string
}

export interface Destino {
  value: string
  label: string
}


const $q = useQuasar();
const terminales = ref<Terminal[]>([]);
const terminalMap = ref<Record<string, string>>({});
const rutas = ref<Root[]>([]);
const filtro = ref<string>('');

const ruta = reactive({
  origen: "",
  destino: "",
  duracion: "",
  distancia: "",
});

const cargarTerminales = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "terminal"));
    terminales.value = querySnapshot.docs.map((doc) => ({
      label: doc.data().Ciudad,
      value: doc.id,
    }));
    terminalMap.value = Object.fromEntries(terminales.value.map(t => [t.value, t.label]));
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar terminales" });
  }
};

const cargarRutas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "rutas"));
    rutas.value = querySnapshot.docs.map((doc) => {
      return doc.data() as Root;
      // return {
      //   ...data,
      //   origen: terminalMap.value[data.origen] || data.origen,
      //   destino: terminalMap.value[data.destino] || data.destino,
      // };
    });
    console.log(rutas.value)
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar rutas" });
  }
};

const registrarRuta = async () => {
  try {
    const nuevaRuta: Ruta = {
      origen: ruta.origen,
      destino: ruta.destino,
      duracion: Number(ruta.duracion),
      distancia: Number(ruta.distancia),
    };

    await addDoc(collection(db, "rutas"), nuevaRuta);
    // rutas.value.push({
    //   // ...nuevaRuta,
    //   // origen: terminalMap.value[nuevaRuta.origen],
    //   // destino: terminalMap.value[nuevaRuta.destino],
    //   // origen: terminalMap.value[]
    // });

    // Limpiar formulario
    Object.assign(ruta, { origen: "", destino: "", duracion: "", distancia: "" });

    $q.notify({ type: "positive", message: "Ruta registrada" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar ruta" });
  }
};

onMounted(() => {
  cargarTerminales().then(() => cargarRutas());
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit.prevent="registrarRuta">
          <q-select v-model="ruta.origen" :options="terminales" label="Origen" required />
          <q-select v-model="ruta.destino" :options="terminales" label="Destino" required />
          <q-input v-model.number="ruta.duracion" label="Duración del viaje (MIN)" type="number" required />
          <q-input v-model.number="ruta.distancia" label="Distancia del viaje (KM)" type="number" required />
          <q-btn type="submit" label="Registrar Ruta" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-lg">
      <q-card-section>
        <q-input v-model="filtro" dense filled debounce="300" placeholder="Buscar por origen o destino..." />
      </q-card-section>

      <!-- <q-table
        :rows="rutas"
        :columns="[
          { name: 'origen', label: 'Origen', field: 'origen', align: 'left' },
          { name: 'destino', label: 'Destino', field: 'destino', align: 'left' },
          { name: 'duracion', label: 'Duración (min)', field: 'duracion', align: 'left' },
          { name: 'distancia', label: 'Distancia (km)', field: 'distancia', align: 'left' }
        ]"
        row-key="origen"
      /> -->
      ["rutas"]
    </q-card>
  </q-page>
</template>
