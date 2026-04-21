// reader.js
// Responsable de cargar la lista de tests y (en el futuro) el contenido de los tests individuales.

const TESTS_JSON_PATH = 'tests.json'; // Ruta a tu archivo tests.json
const TESTS_FOLDER_PATH = 'tests/'; // Ruta a tu carpeta de tests

// Función para obtener el tipo de archivo y un icono representativo
function getFileTypeInfo(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    let type = 'unknown';
    let iconClass = 'fas fa-file'; // Icono por defecto

    if (ext === 'pdf') {
        type = 'pdf';
        iconClass = 'fas fa-file-pdf';
    } else if (ext === 'docx' || ext === 'doc') {
        type = 'docx';
        iconClass = 'fas fa-file-word';
    } else if (ext === 'txt') {
        type = 'txt';
        iconClass = 'fas fa-file-alt';
    }
    // Puedes añadir más tipos si es necesario
    return { type, iconClass };
}

// Cargar la lista de tests desde tests.json
async function loadTestList() {
    try {
        const response = await fetch(TESTS_JSON_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const filenames = await response.json();

        // Mapear los nombres de archivo a un formato de objeto más útil
        const tests = filenames.map((filename, index) => {
            const { type, iconClass } = getFileTypeInfo(filename);
            return {
                id: `test-${index}`, // ID único para cada test
                title: filename.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' '), // Eliminar extensión y reemplazar guiones
                filename: filename,
                filepath: TESTS_FOLDER_PATH + filename, // Ruta completa al archivo de test
                type: type,
                icon: iconClass
            };
        });
        
        // Asumiendo que ui.js tendrá una función para mostrar los tests
        if (typeof renderTestCards === 'function') {
            renderTestCards(tests);
        } else {
            console.error("renderTestCards no está definida en ui.js. Asegúrate de que ui.js se cargue después de reader.js y defina esa función.");
        }

        return tests;

    } catch (error) {
        console.error('Error al cargar la lista de tests:', error);
        // Aquí podrías mostrar un mensaje de error en la UI
        const container = document.getElementById('test-cards-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: red;">No se pudo cargar la lista de tests. Por favor, asegúrate de que "tests.json" existe y es accesible.</p>';
        }
        return [];
    }
}

// Función para cargar el contenido de un test específico
// (Esta función la desarrollaremos más adelante, solo es un placeholder)
async function loadTestContent(testFilename) {
    console.log(`Cargando contenido de: ${testFilename}`);
    // Aquí iría la lógica para:
    // 1. Fetch el archivo (PDF, DOCX, TXT)
    // 2. Convertir a texto (usando librerías como pdf.js o mammoth.js)
    // 3. Pasar el texto a parser.js
    // 4. Devolver la estructura de preguntas y respuestas
    
    // Por ahora, solo devuelve un mock de datos para pruebas
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                title: testFilename.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' '),
                questions: [
                    {
                        questionText: "¿Cuál es la capital de España?",
                        options: ["Barcelona", "Madrid", "Valencia", "Sevilla"],
                        correctAnswer: "Madrid"
                    },
                    {
                        questionText: "¿Quién escribió El Quijote?",
                        options: ["Cervantes", "Lope de Vega", "Góngora", "Quevedo"],
                        correctAnswer: "Cervantes"
                    },
                     {
                        questionText: "¿Cuánto es 2 + 2?",
                        options: ["3", "4", "5", "6"],
                        correctAnswer: "4"
                    }
                ]
            });
        }, 500); // Simula una carga asíncrona
    });
}

// Llama a cargar la lista de tests cuando el script se ejecute
document.addEventListener('DOMContentLoaded', loadTestList);

// Exportar funciones si se usan en otros módulos (no necesario si todo es global para este ejemplo)
// window.loadTestList = loadTestList;
// window.loadTestContent = loadTestContent;
