import { db, collection, addDoc, getDocs, updateDoc, doc, query, where } from "./firebase-config.js";

// Captura del Formulario
const form = document.getElementById('empleadoForm');
const tipoEmpleado = document.getElementById('tipoEmpleado');
const nombre = document.getElementById('nombre');
const apellido = document.getElementById('apellido');
const cedula = document.getElementById('cedula');
const telefono = document.getElementById('telefono');
const salarioGroup = document.getElementById('salarioGroup');
const salario = document.getElementById('salario');

// Captura de la Tabla y Modal
const tablaEmpleados = document.getElementById('tablaEmpleados');
const passwordStaffModal = document.getElementById('passwordStaffModal');
const staffPassword = document.getElementById('staffPassword');
const btnVerificarPassword = document.getElementById('btnVerificarPassword');
const btnCancelarPassword = document.getElementById('btnCancelarPassword');

// 🔒 LÓGICA DE SEGURIDAD PARA EL TIPO DE EMPLEADO
tipoEmpleado.addEventListener('change', () => {
    if (tipoEmpleado.value === 'Staff') {
        // Lanza el modal y limpia contraseñas viejas
        passwordStaffModal.style.display = 'flex';
        staffPassword.value = '';
        staffPassword.focus();
    } else {
        // Si vuelve a Mensajero, oculta y limpia el salario
        salarioGroup.style.display = 'none';
        salario.removeAttribute('required');
        salario.value = '';
    }
});

btnVerificarPassword.addEventListener('click', () => {
    if (staffPassword.value === 'Luismanuel2709') {
        // Clave correcta: Cierra el modal y revela el salario
        passwordStaffModal.style.display = 'none';
        salarioGroup.style.display = 'block';
        salario.setAttribute('required', 'true');
    } else {
        alert('❌ Contraseña Incorrecta. Intento denegado.');
        staffPassword.value = '';
    }
});

btnCancelarPassword.addEventListener('click', () => {
    // Si cancela, el select se devuelve a Mensajero automáticamente
    passwordStaffModal.style.display = 'none';
    tipoEmpleado.value = 'Mensajero';
    salarioGroup.style.display = 'none';
    salario.removeAttribute('required');
});

// Cargar Plantilla de Empleados en la Tabla
async function cargarEmpleados() {
    tablaEmpleados.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando personal...</td></tr>';
    try {
        const snap = await getDocs(query(collection(db, "empleados"), where("activo", "==", true)));
        tablaEmpleados.innerHTML = '';
        
        if (snap.empty) {
            tablaEmpleados.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay personal registrado en el sistema.</td></tr>';
            return;
        }

        let empleadosArray = [];
        snap.forEach(docSnap => { empleadosArray.push({ id_firestore: docSnap.id, ...docSnap.data() }); });
        
        // Ordenar alfabéticamente por nombre
        empleadosArray.sort((a, b) => a.nombre.localeCompare(b.nombre));

        empleadosArray.forEach(d => {
            const tr = document.createElement('tr');
            
            // Detectar si es Staff o Mensajero para darle color a la etiqueta
            const tipo = d.tipo || 'Mensajero';
            const badgeStyle = tipo === 'Staff' ? 'background-color:#1e3c72; color:white;' : 'background-color:#e2e8f0; color:#334155;';
            const salarioMostrar = tipo === 'Staff' ? `RD$ ${parseFloat(d.salario).toFixed(2)}` : 'N/A (Sueldo Base)';

            tr.innerHTML = `
                <td><strong>${d.id_auto}</strong></td>
                <td>${d.nombre} ${d.apellido}</td>
                <td>${d.cedula}</td>
                <td>${d.telefono}</td>
                <td><span class="badge" style="${badgeStyle}">${tipo}</span></td>
                <td style="color:#64748b; font-weight: 500; text-align: right;">${salarioMostrar}</td>
                <td style="text-align: center;"><button class="action-btn btn-delete btn-baja" data-id="${d.id_firestore}">Desactivar</button></td>
            `;
            tablaEmpleados.appendChild(tr);
        });

        // Lógica para dar de baja (Eliminado suave)
        document.querySelectorAll('.btn-baja').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('⚠️ ¿Está seguro que desea dar de baja a este empleado? Ya no aparecerá en el sistema para asignarle viajes.')) {
                    await updateDoc(doc(db, "empleados", e.target.getAttribute('data-id')), { activo: false });
                    cargarEmpleados();
                }
            });
        });

    } catch (error) {
        console.error("Error cargando empleados:", error);
        tablaEmpleados.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Falla de conexión.</td></tr>';
    }
}

// Guardado del Nuevo Empleado
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Si es Staff, tomar el valor, si es Mensajero el salario es 0
    const salarioFinal = tipoEmpleado.value === 'Staff' ? parseFloat(salario.value) : 0;

    const dataGuardar = {
        id_auto: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
        nombre: nombre.value.trim(),
        apellido: apellido.value.trim(),
        cedula: cedula.value.trim(),
        telefono: telefono.value.trim(),
        tipo: tipoEmpleado.value,
        salario: salarioFinal,
        activo: true,
        fecha_registro: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "empleados"), dataGuardar);
        
        // Resetear visualmente el formulario
        form.reset();
        tipoEmpleado.value = 'Mensajero';
        salarioGroup.style.display = 'none';
        salario.removeAttribute('required');
        
        await cargarEmpleados();
        alert("✅ Empleado guardado exitosamente en la base de datos.");
    } catch (error) {
        alert("🚨 Error de permisos o conexión al guardar: " + error.message);
    }
});

// Cargar la lista al abrir la página
document.addEventListener('DOMContentLoaded', cargarEmpleados);