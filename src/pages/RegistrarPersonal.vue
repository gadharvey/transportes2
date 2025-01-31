<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useQuasar } from "quasar";
import { db } from "src/boot/firebase";

interface Personal {
  id?: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  telefono: string;
  email: string;
}

const $q = useQuasar();

const personal = reactive<Personal>({
  nombres: "",
  apellidos: "",
  cargo: "",
  telefono: "",
  email: "",
});

const personalList = ref<Personal[]>([]);

const registrarPersonal = async () => {
  try {
    const docRef = await addDoc(collection(db, "personal"), personal);
    personalList.value.push({ id: docRef.id, ...personal });

    // Notificación de éxito
    $q.notify({ type: "positive", message: "Personal registrado con éxito" });

    // Limpiar formulario
    Object.assign(personal, {
      nombres: "",
      apellidos: "",
      cargo: "",
      telefono: "",
      email: "",
    });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al registrar personal" });
  }
};

const cargarPersonal = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "personal"));
    personalList.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Personal[];
  } catch (error) {
    console.error("Error al cargar personal:", error);
  }
};

const eliminarPersonal = async (id: string) => {
  try {
    await deleteDoc(doc(db, "personal", id));
    personalList.value = personalList.value.filter((p) => p.id !== id);

    $q.notify({
      type: "positive",
      message: "Personal eliminado correctamente",
    });
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al eliminar personal" });
  }
};

onMounted(cargarPersonal);
</script>
<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit="registrarPersonal">
          <q-input v-model="personal.nombres" label="Nombres" required />
          <q-input v-model="personal.apellidos" label="Apellidos" required />
          <q-input v-model="personal.cargo" label="Cargo" required />
          <q-input v-model="personal.telefono" label="Teléfono" required />
          <q-input
            v-model="personal.email"
            label="Email"
            type="email"
            required
          />
          <q-btn
            type="submit"
            label="Registrar Personal"
            color="primary"
            class="q-mt-md"
          />
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Tabla de Personal Registrado -->
    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="personalList"
      :columns="[
        { name: 'nombres', label: 'Nombres', field: 'nombres', align: 'left' },
        {
          name: 'apellidos',
          label: 'Apellidos',
          field: 'apellidos',
          align: 'left',
        },
        { name: 'cargo', label: 'Cargo', field: 'cargo', align: 'left' },
        {
          name: 'telefono',
          label: 'Teléfono',
          field: 'telefono',
          align: 'left',
        },
        { name: 'email', label: 'Email', field: 'email', align: 'left' },
        {
          name: 'acciones',
          label: 'Acciones',
          field: 'acciones',
          align: 'left',
        },
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn
            color="red"
            icon="delete"
            dense
            flat
            @click="eliminarPersonal(row.id)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
