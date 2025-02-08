<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "src/boot/firebase";
import { useQuasar } from "quasar";
import { jsPDF } from "jspdf";

interface Viaje {
  id?: string;
  fecha: string;
  hora: string;
  precio: number;
  capacidad: number;
}

const $q = useQuasar();
const viajesList = ref<Viaje[]>([]);
const viajesFiltrados = ref<Viaje[]>([]);
const fechaSeleccionada = ref<string>(new Date().toISOString().substr(0, 10)); // Fecha actual en formato YYYY-MM-DD
const viajeSeleccionado = ref<Viaje | null>(null);
const asientoSeleccionado = ref<number | null>(null);
const asientosOcupados = ref<number[]>([]);
const formulario = reactive({
  nombre: "",
  apellido: "",
  tipoDocumento: "DNI",
  documento: "",
});

const cargarViajes = () => {
  const q = collection(db, "viajes");
  onSnapshot(q, (snapshot) => {
    viajesList.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Viaje[];
    filtrarViajes();
  });
};

const filtrarViajes = () => {
  if (fechaSeleccionada.value) {
    viajesFiltrados.value = viajesList.value.filter((viaje) => viaje.fecha === fechaSeleccionada.value);
  }
};

const cargarAsientosOcupados = () => {
  if (viajeSeleccionado.value) {
    const q = query(
      collection(db, "pasajes"),
      where("fecha", "==", viajeSeleccionado.value.fecha),
      where("hora", "==", viajeSeleccionado.value.hora)
    );

    onSnapshot(q, (snapshot) => {
      asientosOcupados.value = snapshot.docs.map((doc) => doc.data().asiento);
    });
  }
};

const seleccionarViaje = (viaje: Viaje) => {
  if (viajeSeleccionado.value?.id === viaje.id) {
    viajeSeleccionado.value = null;
    asientoSeleccionado.value = null;
    asientosOcupados.value = [];
  } else {
    viajeSeleccionado.value = viaje;
    asientoSeleccionado.value = null;
    cargarAsientosOcupados();
  }
};

const seleccionarAsiento = (asiento: number) => {
  if (!asientosOcupados.value.includes(asiento)) {
    asientoSeleccionado.value = asiento;
  }
};

const registrarPasaje = async () => {
  if (formulario.nombre && formulario.apellido && formulario.documento) {
    try {
      const pasaje = {
        fecha: viajeSeleccionado.value?.fecha,
        hora: viajeSeleccionado.value?.hora,
        asiento: asientoSeleccionado.value,
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        tipoDocumento: formulario.tipoDocumento,
        documento: formulario.documento,
        precio: viajeSeleccionado.value?.precio,
      };

      // Guardar el pasaje en Firestore
      await addDoc(collection(db, "pasajes"), pasaje);

      // Generar el PDF del pasaje
      generarPDF(pasaje);

      limpiarFormulario();
      cargarAsientosOcupados();

      $q.notify({
        type: "positive",
        message: "¡Pasaje registrado con éxito!",
        position: "bottom",
        timeout: 3000,
        actions: [{ icon: "close", color: "white" }],
      });
    } catch (error) {
      console.error("Error al registrar el pasaje:", error);
      $q.notify({
        type: "negative",
        message: "Error al registrar el pasaje. Intente nuevamente.",
        position: "bottom",
        timeout: 3000,
      });
    }
  } else {
    $q.notify({
      type: "warning",
      message: "Por favor, complete todos los campos.",
      position: "bottom",
      timeout: 3000,
    });
  }
};

const generarPDF = (pasaje: any) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Detalle del Pasaje", 10, 10);

  doc.setFontSize(12);
  doc.text(`Número de Asiento: ${pasaje.asiento}`, 10, 30);
  doc.text(`Nombre: ${pasaje.nombre} ${pasaje.apellido}`, 10, 40);
  doc.text(`Tipo de Documento: ${pasaje.tipoDocumento}`, 10, 50);
  doc.text(`Documento: ${pasaje.documento}`, 10, 60);
  doc.text(`Fecha: ${pasaje.fecha}`, 10, 70);
  doc.text(`Hora: ${pasaje.hora}`, 10, 80);
  doc.text(`Precio: S/. ${pasaje.precio}`, 10, 90);

  // Descargar el archivo PDF
  doc.save(`Pasaje_${pasaje.nombre}_${pasaje.fecha}.pdf`);
};

const limpiarFormulario = () => {
  formulario.nombre = "";
  formulario.apellido = "";
  formulario.tipoDocumento = "DNI";
  formulario.documento = "";
  asientoSeleccionado.value = null;
};

onMounted(() => {
  cargarViajes();
});

watch(fechaSeleccionada, filtrarViajes);
</script>

<template>
  <q-page padding>
    <!-- Input para seleccionar la fecha -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input v-model="fechaSeleccionada" type="date" label="Seleccionar fecha" filled />
      </div>
    </div>

    <!-- Lista de viajes filtrados -->
    <div class="row q-col-gutter-md">
      <div 
        v-for="viaje in viajesFiltrados" 
        :key="viaje.id" 
        class="col-xs-12 col-sm-4 col-md-2"
        @click="seleccionarViaje(viaje)"
      >
        <q-card class="q-pa-md text-center">
          <q-card-section>
            <div class="text-h6">{{ formatFecha(viaje.fecha).mes }}</div>
            <div class="text-h5">{{ formatFecha(viaje.fecha).dia }}</div>
            <div>Hora: {{ viaje.hora }}</div>
            <div>Precio: S/. {{ viaje.precio }}</div>
            <div>Capacidad: {{ viaje.capacidad }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="viajeSeleccionado" class="q-mt-lg text-center">
      <h5>Asientos del viaje seleccionado</h5>
      <div class="row q-gutter-sm justify-center">
        <div 
          v-for="n in Array.from({ length: viajeSeleccionado.capacidad }, (_, i) => i + 1)" 
          :key="n" 
          class="col-auto"
          style="width: 50px;"
        >
          <q-btn 
            :label="n" 
            :class="asientosOcupados.includes(n) ? 'bg-red-7 text-white' : 'bg-primary text-white'"
            flat 
            class="q-ma-xs" 
            @click="seleccionarAsiento(n)"
            :disable="asientosOcupados.includes(n)"
          />
        </div>
      </div>
    </div>

    <q-form v-if="asientoSeleccionado" class="q-mt-lg">
      <h5 class="text-center">Formulario de venta de pasaje - Asiento {{ asientoSeleccionado }}</h5>
      <q-input v-model="formulario.nombre" label="Nombre" filled class="q-mb-md" />
      <q-input v-model="formulario.apellido" label="Apellido" filled class="q-mb-md" />
      <q-select
        v-model="formulario.tipoDocumento"
        :options="['DNI', 'Pasaporte']"
        label="Tipo de documento"
        filled
        class="q-mb-md"
      />
      <q-input v-model="formulario.documento" label="Documento" filled class="q-mb-md" />
      <div class="text-center">
        <q-btn 
          label="Registrar Pasaje" 
          color="positive" 
          class="q-pa-md q-mt-md" 
          @click="registrarPasaje" 
          style="width: 200px; font-size: 16px;"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
function formatFecha(fecha: string) {
  const date = new Date(fecha + "T00:00:00");
  const options = { month: "long" } as const;
  const mes = date.toLocaleDateString("es-ES", options).toUpperCase();
  const dia = date.getDate();
  return { mes, dia };
}
</script>
