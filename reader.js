// reader.js
// Responsable de cargar la lista de tests y el contenido de los tests individuales.

// No necesitamos pdf.js ni mammoth.js si solo trabajamos con TXT
// import { getDocument, GlobalWorkerOptions } from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
import { parseTestContent } from './parser.js'; // Importar parseTestContent desde parser.js

// Comentar o eliminar la configuración del worker de PDF.js
// GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

const TESTS_JSON_PATH = 'tests.json'; // Ruta a tu archivo tests.json
const TESTS_FOLDER_PATH = 'tests/'; // Ruta a tu carpeta de tests

// Función para obtener el tipo de archivo y un icono representativo
// Simplificada para asumir solo TXT por ahora.
function getFileTypeInfo(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    // Forzamos el tipo a 'txt' ya que estamos priorizando solo archivos TXT.
    // Podrías mantener la lógica original si quieres mostrar el icono correcto
    // pero internamente solo procesarías como TXT.
    return { type: 'txt', iconClass: 'fas fa-file-alt' }; // Siempre TXT y su icono
}

// Cargar la lista de tests desde tests.json
export async function loadTestList() { 
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) loadingMessage.style.display = 'block';

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
                type: type, // Esto será 'txt' por getFileTypeInfo simplificado
                icon: iconClass
            };
        });
        
        return tests;

    } catch (error) {
        console.error('Error al cargar la lista de tests:', error);
        const container = document.getElementById('test-cards-container');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: red;">No se pudo cargar la lista de tests. Por favor, asegúrate de que "tests.json" existe y es accesible.</p>';
        }
        return [];
    } finally {
        if (loadingMessage) loadingMessage.style.display = 'none';
    }
}

// Funciones de conversión de DOCX y PDF comentadas/eliminadas.
// async function convertDocxToText(arrayBuffer) { /* ... */ }
// async function convertPdfToText(arrayBuffer) { /* ... */ }


// Función para cargar el contenido de un test específico
export async function loadTestContent(testFilePath, testType) { 
    console.log(`Cargando contenido de: ${testFilePath} (Tipo: ${testType})`);

    try {
        const response = await fetch(testFilePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} al cargar ${testFilePath}`);
        }

        let rawText = '';
        const arrayBuffer = await response.arrayBuffer(); 

        // Ahora solo procesamos como TXT
        if (testType === 'txt') {
            rawText = new TextDecoder().decode(arrayBuffer);
        } else {
            // Si por alguna razón llega otro tipo, lo manejamos como error o forzamos TXT
            console.warn(`[Reader] Tipo de archivo '${testType}' recibido, pero solo se esperan TXT. Se intentará procesar como TXT.`);
            rawText = new TextDecoder().decode(arrayBuffer);
        }

        console.log("Contenido plano cargado:\n", rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''));
        
        return parseTestContent(rawText, testFilePath); 

    } catch (error) {
        console.error(`Error al cargar o procesar el test ${testFilePath}:`, error);
        return {
            title: testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' '),
            questions: [{ questionText: `Error al cargar test: ${error.message}`, options: ["Error"], correctAnswer: "Error" }]
        };
    }
}