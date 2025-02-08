<script setup lang="ts">
import { ref, onMounted } from "vue";
import { collection, getDocs } from "firebase/firestore";
import { db } from "src/boot/firebase";

const cantidadVehiculos = ref(0);
const cantidadPasajeros = ref(0);
const ingresoTotal = ref(0);
const cantidadEmpleados = ref(0); // Nueva variable

const cargarCantidadVehiculos = async () => {
  const vehiculosSnapshot = await getDocs(collection(db, "vehiculos"));
  cantidadVehiculos.value = vehiculosSnapshot.size;
};

const cargarCantidadPasajeros = async () => {
  const pasajesSnapshot = await getDocs(collection(db, "pasajes"));
  cantidadPasajeros.value = pasajesSnapshot.size;
};

const calcularIngresoTotal = async () => {
  const pasajesSnapshot = await getDocs(collection(db, "pasajes"));
  ingresoTotal.value = pasajesSnapshot.docs.reduce((total, doc) => {
    const data = doc.data();
    const precio = parseFloat(data.precio) || 0;
    return total + precio;
  }, 0);
};

const cargarCantidadEmpleados = async () => {
  const empleadosSnapshot = await getDocs(collection(db, "personal"));
  cantidadEmpleados.value = empleadosSnapshot.size;
};

onMounted(() => {
  cargarCantidadVehiculos();
  cargarCantidadPasajeros();
  calcularIngresoTotal();
  cargarCantidadEmpleados(); // Llamada para cargar empleados
});
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-md-3">
        <q-card class="bg-dark text-white q-pa-md text-center">
          <q-card-section>
            <div class="text-subtitle1">Cantidad de vehículos</div>
            <q-icon name="directions_bus" size="32px" class="q-mt-sm" />
            <div class="text-h4 q-mt-md">{{ cantidadVehiculos }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="bg-dark text-white q-pa-md text-center">
          <q-card-section>
            <div class="text-subtitle1">Cantidad de pasajeros</div>
            <q-icon name="people" size="32px" class="q-mt-sm" />
            <div class="text-h4 q-mt-md">{{ cantidadPasajeros }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="bg-dark text-white q-pa-md text-center">
          <q-card-section>
            <div class="text-subtitle1">Ingreso total por viajes</div>
            <q-icon name="attach_money" size="32px" class="q-mt-sm" />
            <div class="text-h4 q-mt-md">S/. {{ ingresoTotal.toFixed(2) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card class="bg-dark text-white q-pa-md text-center">
          <q-card-section>
            <div class="text-subtitle1">Cantidad de empleados</div>
            <q-icon name="badge" size="32px" class="q-mt-sm" />
            <div class="text-h4 q-mt-md">{{ cantidadEmpleados }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
