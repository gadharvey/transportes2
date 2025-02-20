<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import { collection, addDoc, onSnapshot, query, where, doc, getDoc,getDocs,updateDoc } from "firebase/firestore";
import { db } from "src/boot/firebase";
import { useQuasar } from "quasar";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";


interface Punto {
  nombre: string;
  precio: number;
}

interface Pasaje {
  id: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  celular: string;
  estadoPasaje: string;
  destino: string;
  precio: number;
  asiento: number;
}



interface Viaje {
  id?: string;
  fecha: string;
  hora: string;
  ruta: string;
  rutaNombreOrigen?: string;
  rutaNombreDestino?: string; // Campo adicional para almacenar el nombre de la ruta (destino)
  precioRuta: number;
  capacidad: number;
}



const $q = useQuasar();
const viajesList = ref<Viaje[]>([]);
const viajesFiltrados = ref<Viaje[]>([]);
const fechaSeleccionada = ref<string>(dayjs().format("YYYY-MM-DD")); // Fecha actual en formato YYYY-MM-DD
const viajeSeleccionado = ref<Viaje | null>(null);
const asientoSeleccionado = ref<number | null>(null);
const asientosOcupados = ref<number[]>([]);
const asientosReservados = ref<number[]>([]); // Lista para asientos reservados
const puntosDestino = ref<Punto[]>([]);
const destinoSeleccionado = ref<string>("");
const precioSeleccionado = ref<number>(0);
const pasajeExistenteId = ref<string | null>(null); // Almacena el ID del pasaje existente
const manifiesto = ref<Pasaje[]>([]);          // Lista de pasajes relacionados al viaje
const mostrandoManifiesto = ref(false);
const mostrarEncomienda = ref(false);


interface EncomiendasDBI {
  id: string
  cantidad: string
  producto: string
  precio: string
  destino: string
  viajeId: string
  hora: string
  descripcion: string
  fecha: string
}
const listaencomiendas=ref<EncomiendasDBI[]>([])

async function mostrarEncomiendas() {
  const querySnapshot = await getDocs(collection(db, "encomiendas"));
  const encomiendas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EncomiendasDBI[];
  console.log(encomiendas);
  listaencomiendas.value=encomiendas
}

const encomiendas2 = computed(() => {
  return listaencomiendas.value.filter(e => e.viajeId === viajeSeleccionado.value?.id);
});

const totalPrecioEncomiendas2=computed(() => {
  return encomiendas2.value.reduce((x,y) => x+parseFloat(y.precio),0);
});



onMounted(() => {
  mostrarEncomiendas();
});

async function mostrarManifiesto() {
  if (mostrandoManifiesto.value) {
    // Si ya se está mostrando, oculta la tabla
    mostrandoManifiesto.value = false;
    manifiesto.value = [];
  } else {
    // Si no se está mostrando, carga los datos y muestra la tabla
    if (!viajeSeleccionado.value) return;

    const pasajesRef = collection(db, 'pasajes');
    const q = query(
      pasajesRef,
      where('ruta', '==', viajeSeleccionado.value.ruta),
      where('fecha', '==', viajeSeleccionado.value.fecha),
      where('hora', '==', viajeSeleccionado.value.hora)
    );

    const querySnapshot = await getDocs(q);
    manifiesto.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pasaje));

    mostrandoManifiesto.value = true;
  }
}


const formulario = reactive({
  nombre: "",
  apellido: "",
  tipoDocumento: "DNI",
  documento: "",
  celular:"",
  estadoPasaje: "Pagado",
  destino: "",  // Nuevo campo para el destino
  precio: 0,    // Nuevo campo para el precio
});

const formularioEncomienda = ref({
  producto: "",
  cantidad: null,
  descripcion: "",
  destino: "",
  precio: null
});

const registrarEncomienda = async () => {
  if (!formularioEncomienda.value.producto || 
      !formularioEncomienda.value.cantidad || 
      !formularioEncomienda.value.destino || 
      !formularioEncomienda.value.precio) {
    $q.notify({
      type: "warning",
      message: "Por favor, complete todos los campos",
      position: "bottom"
    });
    return;
  }

  if (!viajeSeleccionado.value || !viajeSeleccionado.value.id) {
    $q.notify({
      type: "warning",
      message: "Debe seleccionar un viaje antes de registrar la encomienda.",
      position: "bottom"
    });
    return;
  }

  const nuevaEncomienda = {
    viajeId: viajeSeleccionado.value.id,
    fecha: viajeSeleccionado.value.fecha,
    hora: viajeSeleccionado.value.hora,
    producto: formularioEncomienda.value.producto,
    cantidad: formularioEncomienda.value.cantidad,
    descripcion: formularioEncomienda.value.descripcion,
    destino: formularioEncomienda.value.destino,
    precio: formularioEncomienda.value.precio
  };

  try {
    const docRef = await addDoc(collection(db, "encomiendas"), nuevaEncomienda);
    console.log("Encomienda registrada con ID:", docRef.id);

    // Mostrar notificación de éxito
    $q.notify({
      type: "positive",
      message: "Encomienda registrada exitosamente",
      position: "bottom"
    });

    // Reset del formulario
    formularioEncomienda.value = { 
      producto: "", 
      cantidad: null, 
      descripcion: "", 
      destino: "", 
      precio: null 
    };
  } catch (error) {
    console.error("Error al registrar la encomienda:", error);

    $q.notify({
      type: "negative",
      message: "Hubo un error al registrar la encomienda.",
      position: "bottom"
    });
  }
};






const cargarViajes = async () => {
  const q = collection(db, "viajes");
  onSnapshot(q, async (snapshot) => {
    const viajesConRuta = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const viaje = docSnap.data() as Viaje;
        viaje.id = docSnap.id;

        const rutaDoc = await getDoc(doc(db, "ruta", viaje.ruta));
        if (rutaDoc.exists()) {
          const data = rutaDoc.data();
          viaje.rutaNombreOrigen = data.origen;
          viaje.rutaNombreDestino = data.destino;
        }
        return viaje;
      })
    );
    viajesList.value = viajesConRuta;
    filtrarViajes();
  });
};

const cargarPuntosDestino = async (rutaId: string) => {
  const rutaDoc = await getDoc(doc(db, "ruta", rutaId));
  if (rutaDoc.exists()) {
    const data = rutaDoc.data();
    puntosDestino.value = [
      { nombre: data.destino, precio: data.precio },
      ...data.puntos.map((p: any) => ({ nombre: p.nombre, precio: p.precio })),
    ];
    destinoSeleccionado.value = data.destino;
    precioSeleccionado.value = data.precio;
  }
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
      asientosOcupados.value = [];
      asientosReservados.value = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.estadoPasaje === "Pagado" || data.estadoPasaje === "Yape") {
          asientosOcupados.value.push(data.asiento);
        } else if (data.estadoPasaje === "Reservado") {
          asientosReservados.value.push(data.asiento);
        }
      });
    });
  }
};

const seleccionarViaje = (viaje: Viaje) => {
  if (viajeSeleccionado.value?.id === viaje.id) {
    viajeSeleccionado.value = null;
    asientoSeleccionado.value = null;
    asientosOcupados.value = [];
    cargarPuntosDestino(viaje.ruta);
    limpiarFormulario(); // Limpiar el formulario si se deselecciona el viaje
  } else {
    viajeSeleccionado.value = viaje;
    asientoSeleccionado.value = null;
    cargarAsientosOcupados();
    formulario.destino = viaje.rutaNombreDestino || "Destino no disponible";  // Asignar destino
    formulario.precio = viaje.precioRuta || 0;  // Asignar precio
  }
};


const seleccionarAsiento = async (asiento: number) => {
  if (asientoSeleccionado.value === asiento) {
    // Si el asiento ya está seleccionado, cerrar el formulario y limpiar
    asientoSeleccionado.value = null;
    limpiarFormulario();
    return;
  }

  asientoSeleccionado.value = asiento;
  pasajeExistenteId.value = null; // Reiniciar el ID del pasaje existente

  const q = query(
    collection(db, "pasajes"),
    where("fecha", "==", viajeSeleccionado.value?.fecha),
    where("hora", "==", viajeSeleccionado.value?.hora),
    where("asiento", "==", asiento)
  );

  const snapshot = await getDocs(q);
  const docSnap = snapshot.docs[0];
  if (docSnap) {
    const data = docSnap.data();
    pasajeExistenteId.value = docSnap.id;

    formulario.nombre = data.nombre;
    formulario.apellido = data.apellido;
    formulario.tipoDocumento = data.tipoDocumento;
    formulario.documento = data.documento;
    formulario.celular = data.celular;
    formulario.estadoPasaje = data.estadoPasaje;
    destinoSeleccionado.value = data.destino;
    precioSeleccionado.value = data.precio;
  } else {
    limpiarFormulario();
  }
};




const registrarPasaje = async () => {
  if (formulario.nombre && formulario.apellido && formulario.documento) {
    try {
      const pasaje = {
        ruta: viajeSeleccionado.value?.ruta,
        fecha: viajeSeleccionado.value?.fecha,
        hora: viajeSeleccionado.value?.hora,
        asiento: asientoSeleccionado.value,
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        tipoDocumento: formulario.tipoDocumento,
        documento: formulario.documento,
        celular: formulario.celular,
        estadoPasaje: formulario.estadoPasaje,
        destino: destinoSeleccionado.value,
        precio: precioSeleccionado.value,
      };

      if (pasajeExistenteId.value) {
        await updateDoc(doc(db, "pasajes", pasajeExistenteId.value), pasaje);  // Actualiza el pasaje existente

        if(formulario.estadoPasaje === "Pagado" || formulario.estadoPasaje==="Yape"){
          generarPDF(pasaje);
        }

      } else {
        await addDoc(collection(db, "pasajes"), pasaje);  // Crea uno nuevo

        if(formulario.estadoPasaje === "Pagado" || formulario.estadoPasaje==="Yape"){
          generarPDF(pasaje);

        }
      }

      $q.notify({
        type: "positive",
        message: "¡Pasaje registrado con éxito!",
        position: "bottom",
        timeout: 3000,
      });

      limpiarFormulario();
      cargarAsientosOcupados();
    } catch (error) {
      console.error("Error al registrar el pasaje:", error);
      $q.notify({
        type: "negative",
        message: "Error al registrar el pasaje. Intente nuevamente.",
        position: "bottom",
      });
    }
  } else {
    $q.notify({
      type: "warning",
      message: "Por favor, complete todos los campos.",
      position: "bottom",
    });
  }
};
const totalPrecio = computed(() => {
  return manifiesto.value?.reduce((sum, pasaje) => sum + (Number(pasaje.precio) || 0), 0) ?? 0;
});

const desclocal=5;

const descuentoDiezPorciento = computed(() => totalPrecio.value > 100 ? totalPrecio.value * 0.10 : 0);


const liquidacion = computed(() => totalPrecio.value - descuentoDiezPorciento.value - desclocal);

// Definir encomiendas como una lista vacía inicialmente
// const encomiendas = ref<{ id: string; producto: string; cantidad: number; descripcion: string; destino: string; precio: number; viajeId: string }[]>([]);

// const encomiendasFiltradas = computed(() => {
//   return encomiendas.value.filter((e: { viajeId: string }) => e.viajeId === viajeSeleccionado.value?.id);
// });


// const totalPrecioEncomiendas = computed(() => {
//   return encomiendasFiltradas.value.reduce((acc, encomienda) => acc + encomienda.precio, 0);
// });

const liqTotal=computed(() => liquidacion.value + totalPrecioEncomiendas2.value);

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
  formulario.celular = "";
  formulario.estadoPasaje = "Disponible";
  destinoSeleccionado.value = "";
  precioSeleccionado.value = 0;
};


onMounted(() => {
  cargarViajes();
});

watch(fechaSeleccionada, filtrarViajes);
watch(destinoSeleccionado, (nuevoDestino) => {
  const punto = puntosDestino.value.find((p) => p.nombre === nuevoDestino);
  precioSeleccionado.value = punto ? punto.precio : 0;
});
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
      <!-- <div 
        v-for="viaje in viajesFiltrados" 
        :key="viaje.id" 
        class="col-xs-12 col-sm-4 col-md-2"
        @click="seleccionarViaje(viaje)"
      > -->
        <div 
          v-for="viaje in viajesFiltrados" 
          :key="viaje.id || 'sin-id'"  
          class="col-xs-12 col-sm-4 col-md-2"
          @click="seleccionarViaje(viaje)"
        >

        <q-card class="q-pa-md text-center">
          <q-card-section>  
            <div class="text-h7">{{ viaje.rutaNombreOrigen }} - {{ viaje.rutaNombreDestino }}</div>
            <div class="text-h6">{{ formatFecha(viaje.fecha).mes }}</div>
            <div class="text-h5">{{ formatFecha(viaje.fecha).dia }}</div>
            <div>Hora: {{ viaje.hora }}</div>
            <div>Precio: S/. {{ viaje.precioRuta }}</div>
            <div>Capacidad: {{ viaje.capacidad }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="viajeSeleccionado" class="q-mt-lg text-center">
      <h5>Asientos del viaje seleccionado: {{ viajeSeleccionado.rutaNombreOrigen }} - {{ viajeSeleccionado.rutaNombreDestino }}</h5>
      
      <div class="row q-gutter-sm justify-center">
        <div 
        v-for="n in Array.from({ length: viajeSeleccionado.capacidad }, (_, i) => i + 1)" 
        :key="n" 
        class="col-auto"
        style="width: 50px;"
        >
        <q-btn 
        :label="n" 
        :class="{
          'bg-red-7 text-white': asientosOcupados.includes(n),
          'bg-yellow-7 text-black': asientosReservados.includes(n),
          'bg-primary text-white': !asientosOcupados.includes(n) && !asientosReservados.includes(n)
        }"
            flat 
            class="q-ma-xs" 
            @click="seleccionarAsiento(n)"
            :disable="asientosOcupados.includes(n)"
            />
            
          </div>
        </div>

        <q-card-section>
          <q-btn 
            label="Mostrar Manifiesto de Pasajeros" 
            color="primary" 
            @click="mostrarManifiesto" 
            :disable="!viajeSeleccionado"
          />
          <q-btn 
            label="Encomiendas" 
            color="secondary" 
            @click="mostrarEncomienda = !mostrarEncomienda" 
            class="q-ml-md"
          />
        </q-card-section>
        <q-card>
          <q-card-section v-if="mostrandoManifiesto">
            <q-table
              :rows="manifiesto"
              :columns="[
                { name: 'nombre', label: 'Nombres', field: 'nombre' },
                { name: 'apellido', label: 'Apellido', field: 'apellido' },
                { name: 'celular', label: 'Celular', field: 'celular' },
                { name: 'tipoDocumento', label: 'Tipo de Documento', field: 'tipoDocumento' },
                { name: 'documento', label: 'Documento', field: 'documento' },
                { name: 'asiento', label: 'Asiento', field: 'asiento' },
                { name: 'destino', label: 'Destino', field: 'destino' },
                { name: 'estadoPasaje', label: 'Estado', field: 'estadoPasaje' },
                { name: 'precio', label: 'Precio', field: 'precio', align: 'right' }
              ]"
              row-key="id"
            >
              <template v-slot:bottom-row>
                <q-tr>
                  <q-td colspan="8" class="text-right text-h5">
                    <strong>Total:</strong> 
                  </q-td>
                  <q-td colspan="9" class="text-right text-h5">
                    <strong>S/. {{ totalPrecio.toFixed(2) }}</strong>
                  </q-td>
                </q-tr>
                <q-tr>
                  <q-td colspan="8" class="text-right text-h5">
                    <q-h1>Descuento 10%:</q-h1>
                  </q-td>
                  <q-td colspan="9" class="text-right text-h5">
                    <q-h1>S/. {{ descuentoDiezPorciento.toFixed(2) }}</q-h1>
                  </q-td>
                </q-tr>
                <q-tr>
                  <q-td colspan="8" class="text-right text-h5">
                    <q-h1>Descuento Local:</q-h1>
                  </q-td>
                  <q-td colspan="9" class="text-right text-h5">
                    <q-h1>S/. {{ desclocal.toFixed(2) }}</q-h1>
                  </q-td>
                </q-tr>
                <q-tr>
                  <q-td colspan="8" class="text-right text-h5">
                    <strong>Liquidación:</strong>
                  </q-td>
                  <q-td colspan="9" class="text-right text-h5">
                    <strong>S/. {{ liquidacion.toFixed(2) }}</strong>
                  </q-td>
                </q-tr>
                <q-tr>
                  <q-td colspan="8" class="text-right text-h5">
                    <q-h1>Encomiendas:</q-h1>
                  </q-td>
                  <q-td colspan="9" class="text-right text-h5">
                    <q-h1>S/. {{ totalPrecioEncomiendas2.toFixed(2) }}</q-h1>
                  </q-td>
                </q-tr>
                <q-tr>
                  <q-td colspan="4" class="text-right text-h5">
                    <strong>Liq. Total:</strong>
                  </q-td>
                  <q-td colspan="1" class="text-right text-h5">
                    <strong>S/. {{ liqTotal.toFixed(2) }}</strong>
                  </q-td>
                </q-tr>


              </template>
            </q-table>
            <!-- Tabla de encomiendas -->
            <q-card-section>
              <h5 class="q-mb-md">Encomiendas del Viaje</h5>
              <q-table
                :rows="encomiendas2"
                :columns="[
                  { name: 'producto', label: 'Producto', field: 'producto' },
                  { name: 'cantidad', label: 'Cantidad', field: 'cantidad', align: 'center' },
                  { name: 'descripcion', label: 'Descripción', field: 'descripcion' },
                  { name: 'destino', label: 'Destino', field: 'destino' },
                  { name: 'precio', label: 'Precio', field: 'precio', align: 'right' }
                ]"
                row-key="id"
              >
                <template v-slot:bottom-row>
                  <q-tr>
                    <q-td colspan="4" class="text-right text-h5"><strong>Total Encomiendas:</strong></q-td>
                    <q-td class="text-right text-h5"><strong>S/. {{ totalPrecioEncomiendas2.toFixed(2) }}</strong></q-td>
                  </q-tr>
                </template>
              </q-table>
            </q-card-section>

            
          </q-card-section>
          
          
        </q-card>

      </div>
      

    <q-form v-show="asientoSeleccionado !== null" class="q-mt-lg">
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

      <q-input v-model="formulario.celular" label="Celular" filled class="q-mb-md" type="tel" />

      <q-select
        v-model="formulario.estadoPasaje"
        :options="['Pagado', 'Yape', 'Reservado']"
        label="Estado del pasaje"
        filled
        class="q-mb-md"
      />

      <q-select
        v-model="destinoSeleccionado"
        :options="puntosDestino.map(p => p.nombre)"
        label="Seleccionar destino"
        filled
        class="q-mb-md"
      />
      <q-input v-model="precioSeleccionado" label="Precio" filled class="q-mb-md" type="number" />
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

    <q-form v-if="mostrarEncomienda" class="q-mt-lg">
      <h5 class="text-center">Formulario de Encomienda</h5>

      <q-input v-model="formularioEncomienda.producto" label="Producto" filled class="q-mb-md" />
      <q-input v-model="formularioEncomienda.cantidad" label="Cantidad" filled class="q-mb-md" type="number" />
      <q-input v-model="formularioEncomienda.descripcion" label="Descripción" filled class="q-mb-md" />
      
      <q-select
        v-model="formularioEncomienda.destino"
        :options="puntosDestino.map(p => p.nombre)"
        label="Seleccionar destino"
        filled
        class="q-mb-md"
      />
      
      <q-input v-model="formularioEncomienda.precio" label="Precio" filled class="q-mb-md" type="number" />

      <div class="text-center">
        <q-btn 
          label="Agregar Encomienda" 
          color="positive" 
          class="q-pa-md q-mt-md" 
          @click="registrarEncomienda"
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
