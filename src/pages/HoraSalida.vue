<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "src/boot/firebase";
import jsPDF from "jspdf"; // Import jsPDF

const $q = useQuasar();

interface Viaje {
  id: string;
  fecha: string; // Separate date field
  hora: string;  // Separate time field
  precio: number;
  asientos: number;
}

const fechaSeleccionada = ref(new Date().toISOString().split("T")[0]); // Default to today
const viajes = ref<Viaje[]>([]); // Define the type for viajes
const viajeSeleccionado = ref<Viaje | null>(null); // Track the selected trip

const nombrePasajero = ref("");
const apellidoPasajero = ref("");
const tipoDocumento = ref("DNI");
const dni = ref("");

const cargarViajes = async () => {
  try {
    const viajesSnapshot = await getDocs(collection(db, "viajes"));
    viajes.value = viajesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Viaje[]; // Cast to Viaje type
    console.log("Viajes cargados:", viajes.value); // Debug log
  } catch (error) {
    $q.notify({ type: "negative", message: "Error al cargar viajes" });
  }
};

const seleccionarViaje = (viaje: Viaje) => {
  viajeSeleccionado.value = viajeSeleccionado.value === viaje ? null : viaje;
};

const registrarPasaje = async () => {
  if (!viajeSeleccionado.value) return;

  const pasaje = {
    fecha: viajeSeleccionado.value.fecha,
    hora: viajeSeleccionado.value.hora,
    nombre: nombrePasajero.value,
    apellido: apellidoPasajero.value,
    tipoDocumento: tipoDocumento.value,
    dni: dni.value,
    viajeId: viajeSeleccionado.value.id,
  };

  try {
    await addDoc(collection(db, "pasajes"), pasaje);
    $q.notify({ type: "positive", message: "Pasaje registrado" });

    // Generate PDF voucher
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Voucher de Pago de Pasaje", 10, 50);
    doc.setFontSize(12);
    doc.text(`Fecha: ${pasaje.fecha}`, 10, 60);
    doc.text(`Hora: ${pasaje.hora}`, 10, 70);
    doc.text(`Nombre: ${pasaje.nombre}`, 10, 80);
    doc.text(`Apellido: ${pasaje.apellido}`, 10, 90);
    doc.text(`Tipo de Documento: ${pasaje.tipoDocumento}`, 10, 100);
    doc.text(`DNI: ${pasaje.dni}`, 10, 110);
    doc.save(`voucher_${pasaje.dni}.pdf`);

    // Clear form fields
    nombrePasajero.value = "";
    apellidoPasajero.value = "";
    dni.value = "";
  } catch (error) {
    console.error("Error al generar el PDF:", error); // Debug log
    $q.notify({ type: "negative", message: "Error al registrar pasaje" });
  }
};

onMounted(() => {
  cargarViajes();
});
</script>

<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <h2>Lista de Viajes</h2>
        <q-input v-model="fechaSeleccionada" type="date" label="Seleccionar Fecha" />
      </q-card-section>
    </q-card>

    <div v-for="viaje in viajes" :key="viaje.id" class="q-mt-md">
      <q-card @click="seleccionarViaje(viaje)">
        <q-card-section>
          <h3>{{ new Date(viaje.fecha).toLocaleString('es-PE', { month: 'long', day: 'numeric' }) }}</h3>
          <p>Hora: {{ viaje.hora }}</p>
          <p>Precio: S/. {{ viaje.precio }}</p>
          <p>Asientos: {{ viaje.asientos }}</p>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="viajeSeleccionado" class="q-mt-md">
      <h3>Registrar Pasaje</h3>
      <q-form @submit.prevent="registrarPasaje">
        <q-input v-model="nombrePasajero" label="Nombre de Pasajero" required />
        <q-input v-model="apellidoPasajero" label="Apellido de Pasajero" required />
        <q-select v-model="tipoDocumento" :options="[{ label: 'DNI', value: 'DNI' }, { label: 'Pasaporte', value: 'Pasaporte' }]" label="Tipo de Documento" required />
        <q-input v-model="dni" label="DNI" type="number" required />
        <q-btn type="submit" label="Registrar Pasaje" color="primary" class="q-mt-md" />
      </q-form>
    </div>
  </q-page>
</template>
