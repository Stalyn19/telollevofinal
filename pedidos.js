import { db, collection, addDoc, getDocs, updateDoc, doc, query, where } from "./firebase-config.js";

const form = document.getElementById('pedidoForm');
const selectCliente = document.getElementById('idCliente');
const inputDestinatario = document.getElementById('destinatario'); // NUEVA CAPTURA
const selectEmpleado = document.getElementById('idEmpleado');
const selectPedido = document.getElementById('pedidoSelect');
const inputDistancia = document.getElementById('distancia');
const inputPrecio = document.getElementById('precio');
const selectPago = document.getElementById('pago');

const customDetalleGroup = document.getElementById('customDetalleGroup');
const customDetalleInput = document.getElementById('customDetalle');
const cantPaquetesGroup = document.getElementById('cantPaquetesGroup');
const inputCantPaquetes = document.getElementById('cantPaquetes');
const montoAdicionalGroup = document.getElementById('montoAdicionalGroup');
const inputMontoAdicional = document.getElementById('montoAdicional');

const tablaPendientes = document.getElementById('tablaPendientes');
const tablaEntregados = document.getElementById('tablaEntregados');
const buscadorPedidos = document.getElementById('buscadorPedidos');

const btnCorteNomina = document.getElementById('btnCorteNomina');
const corteModal = document.getElementById('corteModal');
const cortePassword = document.getElementById('cortePassword');
const btnEjecutarCorte = document.getElementById('btnEjecutarCorte');
const btnCancelarCorte = document.getElementById('btnCancelarCorte');

// Matriz tarifaria con soporte para tramos cortos
function calcularPrecio(dist) {
    if (dist < 0) return 0;
    if (dist <= 1) return 100; 
    if (dist <= 2) return 150; 
    if (dist <= 5) return 200;
    if (dist <= 8) return 250;
    if (dist <= 11) return 300;
    if (dist <= 16) return 350;
    if (dist <= 19) return 400;
    if (dist <= 29) return 500;
    if (dist <= 35) return 700;
    return -1;
}

function actualizarPrecioEnPantalla() {
    const d = parseFloat(inputDistancia.value);
    if(!isNaN(d)) {
        const precioBase = calcularPrecio(d);
        if (precioBase === -1) { 
            inputPrecio.value = "FUERA DE COBERTURA"; 
            inputPrecio.style.color = "red";
            inputPrecio.style.fontWeight = "bold";
        } else { 
            let cargoAdicional = 0;
            if (selectPedido.value !== "") {
                cargoAdicional = parseFloat(inputMontoAdicional.value) || 0;
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

if(inputDistancia) inputDistancia.addEventListener('input', actualizarPrecioEnPantalla);
if(inputMontoAdicional) inputMontoAdicional.addEventListener('input', actualizarPrecioEnPantalla);

if(selectPedido) {
    selectPedido.addEventListener('change', () => {
        const val = selectPedido.value;

        if (val === "Personalizado") {
            customDetalleGroup.style.display = "block";
            customDetalleInput.setAttribute('required', 'true');
        } else {
            customDetalleGroup.style.display = "none";
            customDetalleInput.removeAttribute('required');
            customDetalleInput.value = "";
        }

        if (val === "Vimen Paq" || val === "Caribe Paq") {
            cantPaquetesGroup.style.display = "block";
            inputCantPaquetes.setAttribute('required', 'true');
        } else {
            cantPaquetesGroup.style.display = "none";
            inputCantPaquetes.removeAttribute('required');
            inputCantPaquetes.value = 1;
        }

        if (val !== "") {
            montoAdicionalGroup.style.display = "block";
            inputMontoAdicional.setAttribute('required', 'true');
        } else {
            montoAdicionalGroup.style.display = "none";
            inputMontoAdicional.removeAttribute('required');
            inputMontoAdicional.value = 0;
        }
        
        actualizarPrecioEnPantalla();
    });
}

async function cargarSelectores() {
    try {
        const snapC = await getDocs(query(collection(db, "clientes"), where("activo", "==", true)));
        selectCliente.innerHTML = '<option value="">-- Seleccione Cliente --</option>';
        snapC.forEach(d => { selectCliente.innerHTML += `<option value="${d.data().id_auto}">${d.data().nombre}</option>`; });

        const snapE = await getDocs(query(collection(db, "empleados"), where("activo", "==", true)));
        selectEmpleado.innerHTML = '<option value="">-- Seleccione Mensajero --</option>';
        snapE.forEach(d => { selectEmpleado.innerHTML += `<option value="${d.data().id_auto}">${d.data().nombre} ${d.data().apellido}</option>`; });
    } catch (error) { console.error("Error cargando listas: ", error); }
}

async function cargarTablas() {
    tablaPendientes.innerHTML = ''; tablaEntregados.innerHTML = '';
    try {
        const snap = await getDocs(query(collection(db, "pedidos"), where("valido", "==", true)));
        
        let listaPedidos = [];
        snap.forEach(docSnap => {
            listaPedidos.push({ id_firestore: docSnap.id, ...docSnap.data() });
        });

        listaPedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        listaPedidos.forEach(d => {
            const tr = document.createElement('tr');
            const clienteMuestra = d.nombre_cliente || d.id_cliente;
            const destinatarioMuestra = d.nombre_destinatario || '---'; // Se inyecta el destinatario
            const empleadoMuestra = d.nombre_empleado || d.id_empleado;
            const tiempoMuestra = d.fecha_hora_pedido || '---';

            if(d.estatus === "Pendiente") {
                tr.innerHTML = `
                    <td><strong>${d.id_pedido}</strong></td>
                    <td style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${tiempoMuestra}</td>
                    <td>${clienteMuestra}</td>
                    <td><strong>${destinatarioMuestra}</strong></td>
                    <td>${empleadoMuestra}</td>
                    <td>${d.detalle_pedido}</td>
                    <td>RD$ ${parseFloat(d.precio).toFixed(2)}</td>
                    <td>
                        <select class="form-control change-status" data-id="${d.id_firestore}">
                            <option value="Pendiente" selected>Pendiente</option>
                            <option value="Entregado">Entregado</option>
                        </select>
                    </td>
                    <td><button class="action-btn btn-delete btn-soft-del" data-id="${d.id_firestore}">Invalidar</button></td>
                `;
                tablaPendientes.appendChild(tr);
            } else {
                tr.innerHTML = `
                    <td><strong>${d.id_pedido}</strong></td>
                    <td style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${tiempoMuestra}</td>
                    <td>${clienteMuestra}</td>
                    <td><strong>${destinatarioMuestra}</strong></td>
                    <td>${empleadoMuestra}</td>
                    <td>${d.detalle_pedido}</td>
                    <td>RD$ ${parseFloat(d.precio).toFixed(2)}</td>
                    <td><span class="badge badge-entregado">${d.estatus}</span></td>
                    <td><button class="action-btn btn-delete btn-soft-del" data-id="${d.id_firestore}">Invalidar</button></td>
                `;
                tablaEntregados.appendChild(tr);
            }
        });

        document.querySelectorAll('.change-status').forEach(select => {
            select.addEventListener('change', async (e) => {
                await updateDoc(doc(db, "pedidos", e.target.getAttribute('data-id')), { estatus: e.target.value });
                cargarTablas();
                if(buscadorPedidos) buscadorPedidos.value = '';
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
    } catch (error) { console.error("Error al renderizar paneles: ", error); }
}

if (buscadorPedidos) {
    buscadorPedidos.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const filas = document.querySelectorAll('#tablaPendientes tr, #tablaEntregados tr');
        
        filas.forEach(fila => {
            const textoFila = fila.innerText.toLowerCase();
            if (textoFila.includes(termino)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    });
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectCliente.selectedIndex <= 0 || selectEmpleado.selectedIndex <= 0) {
        alert("⚠️ Por favor, seleccione un Cliente y un Mensajero válidos de la lista.");
        return;
    }

    const dist = parseFloat(inputDistancia.value);
    const precioBase = calcularPrecio(dist);
    if(precioBase === -1) { alert("🚨 Operación Bloqueada: Destino fuera de la cobertura geográfica."); return; }

    let detalleFinal = selectPedido.value;
    let costoAdicional = parseFloat(inputMontoAdicional.value) || 0;
    let totalPaquetes = 0;

    if (selectPedido.value === "Personalizado") {
        detalleFinal = customDetalleInput.value.trim();
    } else if (selectPedido.value === "Vimen Paq" || selectPedido.value === "Caribe Paq") {
        totalPaquetes = parseInt(inputCantPaquetes.value) || 1;
        detalleFinal = `${selectPedido.value} (${totalPaquetes} Paq.)`;
    }

    if (costoAdicional > 0) {
        detalleFinal += ` (Ext: RD$ ${costoAdicional})`;
    }

    const precioTotalFinal = precioBase + costoAdicional;
    
    const ahora = new Date();
    const timestampCompleto = ahora.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + 
                            ahora.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    try {
        await addDoc(collection(db, "pedidos"), {
            id_pedido: 'PED-' + Math.floor(100000 + Math.random() * 900000),
            id_cliente: selectCliente.value,
            nombre_cliente: selectCliente.options[selectCliente.selectedIndex].text,
            nombre_destinatario: inputDestinatario.value.trim(), // SE GUARDA EN FIREBASE
            id_empleado: selectEmpleado.value,
            nombre_empleado: selectEmpleado.options[selectEmpleado.selectedIndex].text,
            detalle_pedido: detalleFinal,
            cantidad_paquetes: totalPaquetes,
            distancia: dist,
            precio: precioTotalFinal,
            estatus: "Pendiente",
            pago: selectPago.value,
            valido: true,
            fecha: ahora.toISOString(),
            fecha_hora_pedido: timestampCompleto 
        });

        form.reset(); 
        customDetalleGroup.style.display = "none";
        cantPaquetesGroup.style.display = "none";
        montoAdicionalGroup.style.display = "none";
        
        await cargarTablas();
        if(buscadorPedidos) buscadorPedidos.value = '';
        
        alert("📦 ¡Pedido procesado y registrado con éxito!");
    } catch (error) {
        alert("🚨 Falla de Red/Permisos en Firebase: " + error.message);
    }
});

btnEjecutarCorte.addEventListener('click', async () => {
    if(cortePassword.value !== "Luismanuel2709") { alert("Contraseña Maestra Inválida."); return; }

    btnEjecutarCorte.disabled = true;
    btnEjecutarCorte.innerText = "Procesando... ⏳";
    btnCancelarCorte.style.display = "none";

    try {
        const snap = await getDocs(query(collection(db, "pedidos"), where("valido", "==", true), where("estatus", "==", "Entregado")));
        const entregados = [];
        snap.forEach(d => { entregados.push({ id_firestore: d.id, ...d.data() }); });
        if(entregados.length === 0) { 
            alert("No existen órdenes completadas con éxito en esta semana para archivar."); 
            restaurarBotonCorte();
            return; 
        }

        entregados.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
        const primerPedido = entregados[0].fecha.substring(0, 10);
        const ultimoPedido = entregados[entregados.length - 1].fecha.substring(0, 10);
        const periodoStr = `${primerPedido} al ${ultimoPedido}`;
        const timestampCorte = new Date().toLocaleString('es-DO', { hour12: true });

        await addDoc(collection(db, "cortes_semanales"), {
            periodo: periodoStr,
            pedidos: entregados,
            fecha_corte: timestampCorte 
        });

        const promesasDeActualizacion = entregados.map(p => 
            updateDoc(doc(db, "pedidos", p.id_firestore), { valido: false, archivado: true })
        );
        await Promise.all(promesasDeActualizacion);

        alert(`¡Corte consolidado con éxito! Se archivaron ${entregados.length} pedidos.`);
        corteModal.style.display = 'none'; await cargarTablas();
    } catch (error) { 
        alert("Fallo durante el cierre contable: " + error.message); 
    } finally {
        restaurarBotonCorte();
    }
});

function restaurarBotonCorte() {
    btnEjecutarCorte.disabled = false;
    btnEjecutarCorte.innerText = "Proceder con el Corte";
    btnCancelarCorte.style.display = "inline-block";
    corteModal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => { cargarSelectores(); cargarTablas(); });