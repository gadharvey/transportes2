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

interface Conductor {
  id?: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  n_documento: string;
  genero: string;
  fecha_nacimiento: string;
  celular: string;
  email: string;
  direccion_domicilio: string;
  licencia: string;
}

const $q = useQuasar();

const conductor = reactive<Conductor>({
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

const conductoresList = ref<Conductor[]>([]);
let unsubscribe: any = null;

const registrarConductor = async () => {
  try {
    await addDoc(collection(db, "conductores"), conductor);
    $q.notify({ type: "positive", message: "Conductor registrado" });

    // Limpiar formulario
    Object.assign(conductor, {
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
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar" });
  }
};

const escucharConductores = () => {
  const q = collection(db, "conductores");

  unsubscribe = onSnapshot(q, (snapshot) => {
    conductoresList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conductor[];
  });
};

const eliminarConductor = async (id: string) => {
  try {
    await deleteDoc(doc(db, "conductores", id));
    $q.notify({ type: "positive", message: "Conductor eliminado" });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar" });
  }
};

onMounted(escucharConductores);
onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit="registrarConductor">
          <q-input v-model="conductor.nombres" label="Nombres" required />
          <q-input v-model="conductor.apellidos" label="Apellidos" required />
          <q-input v-model="conductor.tipo_documento" label="Tipo Documento" required />
          <q-input v-model="conductor.n_documento" label="Número Documento" required />
          <q-input v-model="conductor.genero" label="Género" required />
          <q-input v-model="conductor.fecha_nacimiento" label="Fecha Nacimiento" type="date" required />
          <q-input v-model="conductor.celular" label="Celular" />
          <q-input v-model="conductor.email" label="Email" type="email" required />
          <q-input v-model="conductor.direccion_domicilio" label="Dirección" />
          <q-input v-model="conductor.licencia" label="Licencia" required />
          <q-btn type="submit" label="Registrar" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Tabla de Conductores Registrados -->
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="conductoresList"
      :columns="[
        { name: 'nombres', label: 'Nombres', field: 'nombres', align: 'left' },
        { name: 'apellidos', label: 'Apellidos', field: 'apellidos', align: 'left' },
        { name: 'tipo_documento', label: 'Tipo Documento', field: 'tipo_documento', align: 'left' },
        { name: 'n_documento', label: 'Número Documento', field: 'n_documento', align: 'left' },
        { name: 'genero', label: 'Género', field: 'genero', align: 'left' },
        { name: 'fecha_nacimiento', label: 'Fecha de Nacimiento', field: 'fecha_nacimiento', align: 'left' },
        { name: 'celular', label: 'Celular', field: 'celular', align: 'left' },
        { name: 'email', label: 'Email', field: 'email', align: 'left' },
        { name: 'direccion_domicilio', label: 'Dirección', field: 'direccion_domicilio', align: 'left' },
        { name: 'licencia', label: 'Licencia', field: 'licencia', align: 'left' },
        // { name: 'acciones', label: 'Acciones', align: 'center' }
        { name: 'acciones', label: 'Acciones', field: 'Acciones', align: 'center' },
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="red" icon="delete" dense flat @click="eliminarConductor(row.id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
