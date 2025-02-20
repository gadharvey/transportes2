<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useQuasar } from "quasar";
import { auth, db } from "src/boot/firebase";

interface Personal {
  id?: string;
  uid?: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  telefono: string;
  email: string;
  tipoDocumento: string;
  documento: string;
}

const $q = useQuasar();

const personal = reactive<Personal>({
  nombres: "",
  apellidos: "",
  cargo: "",
  telefono: "",
  email: "",
  tipoDocumento: "",
  documento: "",
});

const personalList = ref<Personal[]>([]);

// Registrar personal
const registrarPersonal = async () => {
  try {
    const newUser = await createUserWithEmailAndPassword(
      auth,
      personal.email,
      personal.documento // Documento como contraseña
    );

    const userUid = newUser.user.uid;

    // Guardar el personal en la colección 'personal' con el UID del usuario
    const docRef = await addDoc(collection(db, "personal"), {
      ...personal,
      uid: userUid,
    });

    personalList.value.push({ id: docRef.id, uid: userUid, ...personal });

    // Guardar el usuario en la colección 'users'
    const userReference = doc(db, "users", userUid);
    await setDoc(userReference, {
      email: personal.email,
      role: personal.cargo,
    });

    $q.notify({ type: "positive", message: "Personal registrado con éxito" });

    // Limpiar formulario
    Object.assign(personal, {
      nombres: "",
      apellidos: "",
      cargo: "",
      telefono: "",
      email: "",
      tipoDocumento: "",
      documento: "",
    });
  } catch (error) {
    console.error("Error al registrar personal:", error);
    $q.notify({ type: "negative", message: "Error al registrar personal" });
  }
};

// Cargar lista de personal
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

// Eliminar personal
const eliminarPersonal = async (id: string) => {
  try {
    await deleteDoc(doc(db, "personal", id));
    personalList.value = personalList.value.filter((p) => p.id !== id);

    $q.notify({
      type: "positive",
      message: "Personal eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar personal:", error);
    $q.notify({ type: "negative", message: "Error al eliminar personal" });
  }
};

// Editar cargo del personal
const editarPersonal = reactive<Personal>({
  id: "",
  uid: "",
  nombres: "",
  apellidos: "",
  cargo: "",
  telefono: "",
  email: "",
  tipoDocumento: "",
  documento: "",
});

const dialogVisible = ref(false);

const abrirEditarPersonal = (row: Personal) => {
  Object.assign(editarPersonal, row);
  dialogVisible.value = true;
};

const actualizarPersonal = async () => {
  try {
    if (editarPersonal.id && editarPersonal.uid) {
      // Actualizar el cargo en la colección 'personal'
      const personalRef = doc(db, "personal", editarPersonal.id);
      await updateDoc(personalRef, { cargo: editarPersonal.cargo });

      // Actualizar el rol en la colección 'users' usando el UID
      const userRef = doc(db, "users", editarPersonal.uid);
      await updateDoc(userRef, { role: editarPersonal.cargo });

      $q.notify({
        type: "positive",
        message: "Cargo actualizado correctamente",
      });

      dialogVisible.value = false;
      await cargarPersonal();
    }
  } catch (error) {
    console.error("Error al actualizar el cargo:", error);
    $q.notify({
      type: "negative",
      message: "Error al actualizar el cargo",
    });
  }
};

onMounted(cargarPersonal);
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <q-form @submit.prevent="registrarPersonal">
          <q-input v-model="personal.nombres" label="Nombres" required />
          <q-input v-model="personal.apellidos" label="Apellidos" required />
          <q-input v-model="personal.telefono" label="Teléfono" required />
          <q-input v-model="personal.email" label="Email" type="email" required />
          <q-select
            v-model="personal.tipoDocumento"
            label="Tipo de Documento"
            :options="['DNI', 'Pasaporte']"
            required
          />
          <q-input v-model="personal.documento" label="Número de Documento" required />
          <q-select
            v-model="personal.cargo"
            label="Cargo"
            :options="['admin', 'gerente']"
            required
          />
          <q-btn type="submit" label="Registrar Personal" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>

    <q-table
      class="q-mt-lg"
      flat
      bordered
      :rows="personalList"
      :columns="[
        { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
        { name: 'nombres', label: 'Nombres', field: 'nombres', align: 'center' },
        { name: 'apellidos', label: 'Apellidos', field: 'apellidos', align: 'center' },
        { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'center' },
        { name: 'email', label: 'Email', field: 'email', align: 'center' },
        { name: 'tipoDocumento', label: 'Tipo de Documento', field: 'tipoDocumento', align: 'center' },
        { name: 'documento', label: 'Documento', field: 'documento', align: 'center' },
        { name: 'cargo', label: 'Cargo', field: 'cargo', align: 'center' },
      ]"
      row-key="id"
    >
      <template v-slot:body-cell-acciones="{ row }">
        <q-td align="center">
          <q-btn color="blue" icon="edit" dense flat @click="abrirEditarPersonal(row)" />
          <q-btn color="red" icon="delete" dense flat @click="eliminarPersonal(row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogVisible">
      <q-card>
        <q-card-section>
          <div class="text-h6">Editar Cargo</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="editarPersonal.nombres" label="Nombres" readonly />
          <q-input v-model="editarPersonal.apellidos" label="Apellidos" readonly />
          <q-select
            v-model="editarPersonal.cargo"
            label="Cargo"
            :options="['admin', 'gerente']"
            required
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="dialogVisible = false" />
          <q-btn flat label="Guardar" color="primary" @click="actualizarPersonal" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
