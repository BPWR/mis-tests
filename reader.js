// reader.js
// Responsable de cargar la lista de tests y (ahora sí) el contenido de los tests individuales.

import { getDocument, GlobalWorkerOptions } from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';

// Configuración del worker de PDF.js
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

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
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) loadingMessage.style.display = 'block'; // Mostrar spinner de carga

    try {
        const response = await fetch(TESTS_JSON_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const filenames = await response.json();

        const tests = filenames.map((filename, index) => {
            const { type, iconClass } = getFileTypeInfo(filename);
            return {
                id: `test-${index}`,
                title: filename.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' '),
                filename: filename,
                filepath: TESTS_FOLDER_PATH + filename,
                type: type,
                icon: iconClass
            };
        });
        
        if (typeof renderTestCards === 'function') {
            renderTestCards(tests);
        } else {
            console.error("renderTestCards no está definida en ui.js.");
        }

        return tests;

    } catch (error) {
        console.error('Error al cargar la lista de tests:', error);
        const container = document.getElementById('test-cards-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: red;">No se pudo cargar la lista de tests. Por favor, asegúrate de que "tests.json" existe y es accesible.</p>';
        }
        return [];
    } finally {
        if (loadingMessage) loadingMessage.style.display = 'none'; // Ocultar spinner de carga
    }
}

// Función para convertir DOCX a texto plano
async function convertDocxToText(arrayBuffer) {
    try {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value; // El texto extraído
    } catch (error) {
        console.error("Error al convertir DOCX:", error);
        throw new Error("Fallo en la conversión de DOCX.");
    }
}

// Función para convertir PDF a texto plano
async function convertPdfToText(arrayBuffer) {
    try {
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Une el texto de la página, añadiendo un espacio entre elementos o un salto de línea si es un bloque.
            fullText += textContent.items.map(s => s.str).join(' ');
            if (i < pdf.numPages) {
                fullText += '\n'; // Añadir un salto de línea entre páginas
            }
        }
        return fullText;
    } catch (error) {
        console.error("Error al convertir PDF:", error);
        throw new Error("Fallo en la conversión de PDF.");
    }
}


// Función para cargar el contenido de un test específico
async function loadTestContent(testFilePath, testType) {
    console.log(`Cargando contenido de: ${testFilePath} (Tipo: ${testType})`);

    try {
        const response = await fetch(testFilePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} al cargar ${testFilePath}`);
        }

        let rawText = '';
        const arrayBuffer = await response.arrayBuffer(); // Obtener como ArrayBuffer para DOCX/PDF

        if (testType === 'txt') {
            rawText = new TextDecoder().decode(arrayBuffer); // Convertir ArrayBuffer a texto para TXT
        } else if (testType === 'docx') {
            rawText = await convertDocxToText(arrayBuffer);
        } else if (testType === 'pdf') {
            rawText = await convertPdfToText(arrayBuffer);
        } else {
            throw new Error(`Tipo de archivo no soportado: ${testType}`);
        }

        console.log("Contenido plano cargado:\n", rawText);
        
        // Pasar el texto plano a parser.js
        if (typeof parseTestContent === 'function') {
            return parseTestContent(rawText, testFilePath); // parser.js devolverá el objeto de test
        } else {
            console.error("parseTestContent no está definida en parser.js.");
            throw new Error("La función de parseo no está disponible.");
        }

    } catch (error) {
        console.error(`Error al cargar o procesar el test ${testFilePath}:`, error);
        // Devuelve un mock de error para que la UI pueda manejarlo
        return {
            title: testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' '),
            questions: [{ questionText: `Error al cargar test: ${error.message}`, options: ["Error"], correctAnswer: "Error" }]
        };
    }
}


// Llama a cargar la lista de tests cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', loadTestList);

// Exportar funciones para que ui.js pueda llamarlas
window.loadTestContent = loadTestContent;
