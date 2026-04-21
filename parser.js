// parser.js
// Responsable de tomar el texto plano de un documento y extraer preguntas, opciones y respuestas.

function parseTestContent(rawText) {
    console.log("Parseando el siguiente texto:", rawText);
    // Aquí implementarás la lógica para analizar el texto
    // y devolver un objeto con la estructura de preguntas.

    // Ejemplo de formato esperado (será clave para esto)
    // Cada pregunta en una línea nueva, opciones con letras, y al final las respuestas.
    // Ejemplo de cómo podría ser el formato en el archivo TXT:
    /*
    1. ¿Pregunta uno?
    a) Opción A
    b) Opción B
    c) Opción C
    d) Opción D

    2. ¿Pregunta dos?
    a) Opción A
    b) Opción B
    c) Opción C
    d) Opción D

    RESPUESTAS:
    1. b
    2. a
    */

    // Por ahora, devolveremos una estructura de ejemplo
    // Esta parte la desarrollaremos una vez tengamos los conversores de PDF/DOCX o TXT leyendo correctamente
    return {
        title: "Test Parseado (Ejemplo)",
        questions: [
            // ... Aquí irían las preguntas extraídas
        ]
    };
}

// Puedes exportar la función si lo necesitas
// window.parseTestContent = parseTestContent;
