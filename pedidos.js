import { db, collection, addDoc, getDocs, updateDoc, doc, query, where } from "./firebase-config.js";

const form = document.getElementById('pedidoForm');
const selectCliente = document.getElementById('idCliente');
const selectEmpleado = document.getElementById('idEmpleado');
const selectPedido = document.getElementById('pedidoSelect');
const inputDistancia = document.getElementById('distancia');
const inputPrecio = document.getElementById('precio');
const selectPago = document.getElementById('pago');

// ACTUALIZACIÓN: Captura de los nuevos elementos del DOM para paquetería condicional
const paquetesGroup = document.getElementById('paquetesGroup');
const inputCantPaquetes = document.getElementById('cantPaquetes');

const tablaPendientes = document.getElementById('tablaPendientes');
const tablaEntregados = document.getElementById('tablaEntregados');
const btnCorteNomina = document.getElementById('btnCorteNomina');
const corteModal = document.getElementById('corteModal');
const cortePassword = document.getElementById('cortePassword');
const btnEjecutarCorte = document.getElementById('btnEjecutarCorte');
const btnCancelarCorte = document.getElementById('btnCancelarCorte');

// Matriz tarifaria base (Se mantiene intacta según rangos solicitados)
function calcularPrecio(dist) {
    if (dist < 0) return 0;
    if (dist <= 5) return 200;
    if (dist <= 8) return 250;
    if (dist <= 11) return 300;
    if (dist <= 16) return 350;
    if (dist <= 19) return 400;
    if (dist <= 29) return 500;
    if (dist <= 35) return 700;
    return -1;
}

// ACTUALIZACIÓN: Función unificada para calcular precio base + el recargo de paquetes extras
function actualizarPrecioEnPantalla() {
    const d = parseFloat(inputDistancia.value);
    if(!isNaN(d)) {
        const precioBase = calcularPrecio(d);
        if (precioBase === -1) { 
            inputPrecio.value = "ÁREA SIN COBERTURA"; 
            inputPrecio.style.color = "red";
            inputPrecio.style.fontWeight = "bold";
        } else { 
            // Evaluar si aplica el recargo de RD$ 170.00 por volumen de bultos
            let cargoAdicional = 0;
            if (selectPedido.value === "Vimen Paq" || selectPedido.value === "Caribe Paq") {
                const cantidad = parseInt(inputCantPaquetes.value) || 1;
                cargoAdicional = cantidad * 170;
            }
            
            const precioFinal = precioBase + cargoAdicional;
            inputPrecio.value = precioFinal.toFixed(2); 
            inputPrecio.style.color = "inherit";
            inputPrecio.style.fontWeight = "normal";
        }
    } else {
        inputPrecio.value = "0.00";
    }
}

// ACTUALIZACIÓN: Escuchar cambios en los selectores y cajas numéricas para recalcular montos
inputDistancia.addEventListener('input', actualizarPrecioEnPantalla);
inputCantPaquetes.addEventListener('input', actualizarPrecioEnPantalla);

// ACTUALIZACIÓN: Evento para ocultar o mostrar la cantidad de bultos según el transportista elegido
selectPedido.addEventListener('change', () => {
    if (selectPedido.value === "Vimen Paq" || selectPedido.value === "Caribe Paq") {
        paquetesGroup.style.display = "block";
        inputCantPaquetes.setAttribute('required', 'true');
    } else {
        paquetesGroup.style.display = "none";
        inputCantPaquetes.removeAttribute('required');
        inputCantPaquetes.value = 1; // Reseteo estándar de seguridad
    }
    actualizarPrecioEnPantalla();
});

async function cargarSelectores() {
    const snapC = await getDocs(query(collection(db, "clientes"), where("activo", "==", true)));
    selectCliente.innerHTML = '';
    snapC.forEach(d => { selectCliente.innerHTML += `<option value="${d.data().id_auto}">${d.data().nombre}</option>`; });

    const snapE = await getDocs(query(collection(db, "empleados"), where("activo", "==", true)));
    selectEmpleado.innerHTML = '';
    snapE.forEach(d => { selectEmpleado.innerHTML += `<option value="${d.data().id_auto}">${d.data().nombre} ${d.data().apellido}</option>`; });
}

async function cargarTablas() {
    tablaPendientes.innerHTML = ''; tablaEntregados.innerHTML = '';
    const snap = await getDocs(query(collection(db, "pedidos"), where("valido", "==", true)));
    
    snap.forEach(docSnap => {
        const d = docSnap.data();
        const tr = document.createElement('tr');
        const clienteMuestra = d.nombre_cliente || d.id_cliente;
        const empleadoMuestra = d.nombre_empleado || d.id_empleado;

        if(d.estatus === "Pendiente") {
            tr.innerHTML = `
                <td><strong>${d.id_pedido}</strong></td>
                <td>${clienteMuestra}</td>
                <td>${empleadoMuestra}</td>
                <td>${d.detalle_pedido}</td>
                <td>RD$ ${parseFloat(d.precio).toFixed(2)}</td>
                <td>
                    <select class="form-control change-status" data-id="${docSnap.id}">
                        <option value="Pendiente" selected>Pendiente</option>
                        <option value="Entregado">Entregado</option>
                    </select>
                </td>
                <td><button class="action-btn btn-delete btn-soft-del" data-id="${docSnap.id}">Invalidar</button></td>
            `;
            tablaPendientes.appendChild(tr);
        } else {
            tr.innerHTML = `
                <td><strong>${d.id_pedido}</strong></td>
                <td>${clienteMuestra}</td>
                <td>${empleadoMuestra}</td>
                <td>${d.detalle_pedido}</td>
                <td>RD$ ${parseFloat(d.precio).toFixed(2)}</td>
                <td><span class="badge badge-entregado">${d.estatus}</span></td>
                <td><button class="action-btn btn-delete btn-soft-del" data-id="${docSnap.id}">Invalidar</button></td>
            `;
            tablaEntregados.appendChild(tr);
        }
    });

    document.querySelectorAll('.change-status').forEach(select => {
        select.addEventListener('change', async (e) => {
            await updateDoc(doc(db, "pedidos", e.target.getAttribute('data-id')), { estatus: e.target.value });
            cargarTablas();
        });
    });

    document.querySelectorAll('.btn-soft-del').forEach(b => {
        b.addEventListener('click', async (e) => {
            if(confirm("¿Desea marcar este pedido como Inválido?")) {
                await updateDoc(doc(db, "pedidos", e.target.getAttribute('data-id')), { valido: false });
                cargarTablas();
            }
        });
    });
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dist = parseFloat(inputDistancia.value);
    const precioBase = calcularPrecio(dist);
    if(precioBase === -1) { alert("Área sin cobertura."); return; }

    // ACTUALIZACIÓN: Modificación del texto descriptivo final de la carga para reflejar bultos
    let detalleFinal = selectPedido.value;
    let costoAdicional = 0;
    if(selectPedido.value === "Vimen Paq" || selectPedido.value === "Caribe Paq") {
        const cantidad = parseInt(inputCantPaquetes.value) || 1;
        costoAdicional = cantidad * 170;
        detalleFinal = `${selectPedido.value} (${cantidad} Paq.)`;
    }

    const precioTotalFinal = precioBase + costoAdicional;

    // ACTUALIZACIÓN: Captura del string con el formato exacto de fecha y hora local de operación
    const opcionesFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const ahora = new Date();
    const fechaTexto = ahora.toLocaleDateString('es-DO', opcionesFecha);
    const horaTexto = ahora.toLocaleTimeString('es-DO', opcionesHora);
    const timestampCompleto = `${fechaTexto} ${horaTexto}`; // Formato: DD/MM/AAAA HH:MM:SS AM/PM

    await addDoc(collection(db, "pedidos"), {
        id_pedido: 'PED-' + Math.floor(100000 + Math.random() * 900000),
        id_cliente: selectCliente.value,
        nombre_cliente: selectCliente.options[selectCliente.selectedIndex].text,
        id_empleado: selectEmpleado.value,
        nombre_empleado: selectEmpleado.options[selectEmpleado.selectedIndex].text,
        detalle_pedido: detalleFinal,
        distancia: dist,
        precio: precioTotalFinal,
        estatus: "Pendiente",
        pago: selectPago.value,
        valido: true,
        fecha: ahora.toISOString(),
        // ACTUALIZACIÓN: Guardamos la propiedad de tiempo explícita requerida para el reporte
        fecha_hora_pedido: timestampCompleto 
    });

    form.reset(); paquetesGroup.style.display="none"; cargarTablas();
});

btnCorteNomina.addEventListener('click', () => { corteModal.style.display = 'flex'; cortePassword.value = ''; });
btnCancelarCorte.addEventListener('click', () => corteModal.style.display = 'none');

btnEjecutarCorte.addEventListener('click', async () => {
    if(cortePassword.value !== "te_lo_llevo_2026") { alert("Contraseña Maestra Inválida."); return; }

    const snap = await getDocs(query(collection(db, "pedidos"), where("valido", "==", true), where("estatus", "==", "Entregado")));
    const entregados = [];
    
    snap.forEach(d => { entregados.push({ id_firestore: d.id, ...d.data() }); });
    if(entregados.length === 0) { alert("No hay pedidos 'Entregado' para archivar."); corteModal.style.display = 'none'; return; }

    entregados.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    const primerPedido = entregados[0].fecha.substring(0, 10);
    const ultimoPedido = entregados[entregados.length - 1].fecha.substring(0, 10);
    const periodoStr = `${primerPedido} al ${ultimoPedido}`;

    // ACTUALIZACIÓN: Registro del cierre con marca de tiempo precisa del procesamiento de corte
    const timestampCorte = new Date().toLocaleString('es-DO', { hour12: true });

    await addDoc(collection(db, "cortes_semanales"), {
        periodo: periodoStr,
        pedidos: entregados,
        fecha_corte: timestampCorte // Guarda fecha y hora del procesamiento de nómina
    });

    for(let p of entregados) { await updateDoc(doc(db, "pedidos", p.id_firestore), { valido: false, archivado: true }); }

    alert(`¡Corte procesado con éxito!`);
    corteModal.style.display = 'none'; cargarTablas();
});

document.addEventListener('DOMContentLoaded', () => { cargarSelectores(); cargarTablas(); });