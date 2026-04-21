const numeroInput = document.getElementById('numero');
const tituloInput = document.getElementById('titulo');
const valorInput = document.getElementById('valor');
const addItemButton = document.getElementById('addItemButton');
const dataTableBody = document.querySelector('#dataTable tbody');
const jsonOutput = document.getElementById('jsonOutput');
const messageBox = document.getElementById('messageBox');
const clearAllButton = document.getElementById('clearAllButton');
const copyJsonButton = document.getElementById('copyJsonButton');

let data = []; // Array donde se almacenarán los ítems de la tabla

// Función para mostrar mensajes de éxito o error
function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `message ${type}`; // Remueve otras clases y añade la nueva
    messageBox.style.display = 'flex'; // Muestra el mensaje
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// Función para actualizar la tabla y el JSON
function updateDisplay() {
    // Limpiar la tabla
    dataTableBody.innerHTML = '';

    // Llenar la tabla con los datos actuales
    data.forEach((item, index) => {
        const row = dataTableBody.insertRow();
        row.insertCell().textContent = item.numero !== null ? item.numero : ''; // Mostrar vacío si es null
        row.insertCell().textContent = item.titulo;
        row.insertCell().textContent = item.valor;
        
        const actionsCell = row.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Icono de papelera de Font Awesome
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => deleteItem(index); // Asigna la función de borrar al hacer clic
        actionsCell.appendChild(deleteButton);
    });

    // Actualizar el área JSON con formato legible (indentación de 2 espacios)
    jsonOutput.textContent = JSON.stringify(data, null, 2);
}

// Evento para el botón "Añadir Ítem"
addItemButton.addEventListener('click', () => {
    const numero = numeroInput.value.trim();
    const titulo = tituloInput.value.trim();
    const valor = valorInput.value.trim();

    // Validaciones
    if (!numero && !titulo) {
        showMessage('Por favor, introduce un Número o un Título.', 'error');
        return;
    }
    if (numero !== '' && isNaN(parseInt(numero))) { // Si hay número, validar que sea numérico
        showMessage('El campo "Número" debe ser un valor numérico válido.', 'error');
        return;
    }

    const newItem = {
        numero: numero !== '' ? parseInt(numero) : null, // Convertir a número si no está vacío, sino null
        titulo: titulo,
        valor: valor
    };

    data.push(newItem); // Añadir el nuevo ítem al array
    updateDisplay(); // Refrescar la UI

    // Limpiar los campos después de añadir
    numeroInput.value = '';
    tituloInput.value = '';
    valorInput.value = '';
    
    showMessage('Ítem añadido con éxito.', 'success');
});

// Función para borrar un ítem por su índice en el array
function deleteItem(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este ítem?')) {
        data.splice(index, 1); // Eliminar 1 elemento desde la posición `index`
        updateDisplay();
        showMessage('Ítem eliminado.', 'success');
    }
}

// Evento para el botón "Limpiar Todo"
clearAllButton.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres limpiar todos los ítems?')) {
        data = []; // Vaciar el array de datos
        updateDisplay();
        showMessage('Todos los ítems han sido eliminados.', 'success');
    }
});

// Evento para el botón "Copiar JSON"
copyJsonButton.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent)
        .then(() => {
            showMessage('JSON copiado al portapapeles.', 'success');
        })
        .catch(err => {
            showMessage('Error al copiar el JSON: ' + err, 'error');
            console.error('Error al copiar el JSON:', err); // Para depuración
        });
});

// Inicializar la pantalla al cargar la página (en caso de que quieras cargar datos iniciales)
updateDisplay();

// Puedes añadir aquí la lógica para cargar datos desde tests.json si lo necesitas
// Por ejemplo:
/*
async function loadInitialData() {
    try {
        const response = await fetch('tests.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const initialData = await response.json();
        data = initialData; // O fusionarlos: data = [...data, ...initialData];
        updateDisplay();
        showMessage('Datos iniciales cargados desde tests.json', 'info');
    } catch (error) {
        console.error('No se pudieron cargar los datos de tests.json:', error);
        // showMessage('No se pudieron cargar datos iniciales.', 'error');
    }
}
loadInitialData(); // Llama a esta función al inicio si quieres cargar tests.json
*/
