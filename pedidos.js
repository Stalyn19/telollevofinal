import { db, collection, addDoc, getDocs, updateDoc, doc, query, where } from "./firebase-config.js";

const form = document.getElementById('pedidoForm');
const selectCliente = document.getElementById('idCliente');
const selectEmpleado = document.getElementById('idEmpleado');
const selectPedido = document.getElementById('pedidoSelect');
const customGroup = document.getElementById('customGroup');
const inputPedidoCustom = document.getElementById('pedidoCustom');
const inputDistancia = document.getElementById('distancia');
const inputPrecio = document.getElementById('precio');
const selectPago = document.getElementById('pago');

const tablaPendientes = document.getElementById('tablaPendientes');
const tablaEntregados = document.getElementById('tablaEntregados');
const btnCorteNomina = document.getElementById('btnCorteNomina');
const corteModal = document.getElementById('corteModal');
const cortePassword = document.getElementById('cortePassword');
const btnEjecutarCorte = document.getElementById('btnEjecutarCorte');
const btnCancelarCorte = document.getElementById('btnCancelarCorte');

// ==========================================================================
// NUEVA REGLA DE EVALUACIÓN DE PRECIOS POR DISTANCIA (MOTO)
// ==========================================================================
function calcularPrecio(dist) {
    if (dist < 0) return 0;
    if (dist <= 5) return 200;   // 0 a 5 KM -> RD$ 200.00
    if (dist <= 8) return 250;   // 6 a 8 KM -> RD$ 250.00
    if (dist <= 11) return 300;  // 9 a 11 KM -> RD$ 300.00
    if (dist <= 16) return 350;  // 12 a 16 KM -> RD$ 350.00
    if (dist <= 19) return 400;  // 17 a 19 KM -> RD$ 400.00
    if (dist <= 29) return 500;  // 20 a 28 KM (Incluye 29 para continuidad) -> RD$ 500.00
    if (dist <= 35) return 700;  // 30 a 35 KM -> RD$ 700.00
    return -1; // Si excede los 35 KM -> Fuera de cobertura
}

// Escuchar cambios en la distancia para calcular el precio dinámicamente en pantalla
inputDistancia.addEventListener('input', () => {
    const d = parseFloat(inputDistancia.value);
    if(!isNaN(d)) {
        const p = calcularPrecio(d);
        if (p === -1) { 
            inputPrecio.value = "ÁREA SIN COBERTURA"; 
            inputPrecio.style.color = "red";
            inputPrecio.style.fontWeight = "bold";
        } else { 
            inputPrecio.value = p.toFixed(2); 
            inputPrecio.style.color = "inherit";
            inputPrecio.style.fontWeight = "normal";
        }
    } else {
        inputPrecio.value = "0.00";
    }
});

selectPedido.addEventListener('change', () => {
    customGroup.style.display = selectPedido.value === "OTRO" ? "block" : "none";
});

async function cargarSelectores() {
    const snapC = await getDocs(query(collection(db, "clientes"), where("activo", "==", true)));
    selectCliente.innerHTML = '';
    snapC.forEach(d => {
        selectCliente.innerHTML += `<option value="${d.data().id_auto}">${d.data().nombre}</option>`;
    });

    const snapE = await getDocs(query(collection(db, "empleados"), where("activo", "==", true)));
    selectEmpleado.innerHTML = '';
    snapE.forEach(d => {
        selectEmpleado.innerHTML += `<option value="${d.data().id_auto}">${d.data().nombre} ${d.data().apellido}</option>`;
    });
}

async function cargarTablas() {
    tablaPendientes.innerHTML = '';
    tablaEntregados.innerHTML = '';
    
    const q = query(collection(db, "pedidos"), where("valido", "==", true));
    const snap = await getDocs(q);
    
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
            const id = e.target.getAttribute('data-id');
            await updateDoc(doc(db, "pedidos", id), { estatus: e.target.value });
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
    const p = calcularPrecio(dist);
    
    if(p === -1) { 
        alert("🚨 Error de Cobertura: El pedido excede el límite permitido o se encuentra en un área sin cobertura. No se puede guardar."); 
        return; 
    }

    let det = selectPedido.value;
    if(det === "OTRO") det = inputPedidoCustom.value.trim();

    await addDoc(collection(db, "pedidos"), {
        id_pedido: 'PED-' + Math.floor(100000 + Math.random() * 900000),
        id_cliente: selectCliente.value,
        nombre_cliente: selectCliente.options[selectCliente.selectedIndex].text,
        id_empleado: selectEmpleado.value,
        nombre_empleado: selectEmpleado.options[selectEmpleado.selectedIndex].text,
        detalle_pedido: det,
        distancia: dist,
        precio: p,
        estatus: "Pendiente",
        pago: selectPago.value,
        valido: true,
        fecha: new Date().toISOString()
    });

    form.reset(); customGroup.style.display="none"; cargarTablas();
});

btnCorteNomina.addEventListener('click', () => {
    corteModal.style.display = 'flex';
    cortePassword.value = '';
});
btnCancelarCorte.addEventListener('click', () => corteModal.style.display = 'none');

btnEjecutarCorte.addEventListener('click', async () => {
    if(cortePassword.value !== "te_lo_llevo_2026") {
        alert("Contraseña Maestra Inválida.");
        return;
    }

    const snap = await getDocs(query(collection(db, "pedidos"), where("valido", "==", true)));
    const entregados = [];
    
    snap.forEach(d => {
        if(d.data().estatus === "Entregado") {
            entregados.push({ id_firestore: d.id, ...d.data() });
        }
    });

    if(entregados.length === 0) {
        alert("No hay pedidos con estatus 'Entregado' para archivar en este corte.");
        corteModal.style.display = 'none';
        return;
    }

    entregados.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    const primerPedido = entregados[0].fecha.substring(0, 10);
    const ultimoPedido = entregados[entregados.length - 1].fecha.substring(0, 10);
    const periodoStr = `${primerPedido} al ${ultimoPedido}`;

    await addDoc(collection(db, "cortes_semanales"), {
        periodo: periodoStr,
        pedidos: entregados,
        fecha_corte: new Date().toISOString()
    });

    for(let p of entregados) {
        await updateDoc(doc(db, "pedidos", p.id_firestore), { valido: false, archivado: true });
    }

    alert(`¡Corte procesado con éxito para el período: ${periodoStr}!`);
    corteModal.style.display = 'none';
    cargarTablas();
});

document.addEventListener('DOMContentLoaded', () => {
    cargarSelectores();
    cargarTablas();
});