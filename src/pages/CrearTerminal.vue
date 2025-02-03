<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Terminal {
  id?: string;
  Ciudad: string;
  Fecha_creacion: string;
}

const $q = useQuasar();

const terminal = reactive<Terminal>({
  Ciudad: "",
  Fecha_creacion: "",
});

const terminalList = ref<Terminal[]>([]);
let unsubscribe: any = null;

const registrarTerminal = async () => {
  try {
    await addDoc(collection(db, "terminal"), terminal);
    $q.notify({ type: "positive", message: "Terminal registrado con éxito" });

    // Limpiar formulario
    Object.assign(terminal, {
      Ciudad: "",
      Fecha_creacion: "",
    });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar terminal" });
  }
};

const escucharTerminales = () => {
  const q = collection(db, "terminal");

  unsubscribe = onSnapshot(q, (snapshot) => {
    terminalList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Terminal[];
  });
};

const eliminarTerminal = async (id: string) => {
  try {
    await deleteDoc(doc(db, "terminal", id));
    $q.notify({ type: "positive", message: "Terminal eliminada correctamente" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar terminal" });
  }
};

onMounted(escucharTerminales);
onUnmounted(() => {
  if (unsubscribe) unsubscribe(); // Detener la escucha cuando el componente se destruye
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit="registrarTerminal">
          <q-input v-model="terminal.Ciudad" label="Ciudad" required />
          <q-input v-model="terminal.Fecha_creacion" type="date" label="Fecha de Creación" required />
          <q-btn type="submit" label="Registrar Terminal" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Tabla de Terminal Registrado -->
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="terminalList"
      :columns="[
        { name: 'Ciudad', label: 'Ciudad', field: 'Ciudad', align: 'left' },
        { name: 'Fecha_creacion', label: 'Fecha de Creación', field: 'Fecha_creacion', align: 'left' },
        // { name: 'acciones', label: 'Acciones', align: 'center' }
        { name: 'acciones', label: 'Acciones', field: 'Acciones', align: 'center' },
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="red" icon="delete" dense flat @click="eliminarTerminal(row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
