// parser.js
// Responsable de tomar el texto plano de un documento y extraer preguntas, opciones y respuestas.

export function parseTestContent(rawText, testFilePath) { // Exportar la función
    console.log("Parseando el siguiente texto:\n", rawText);

    const questions = [];
    let currentQuestion = null;
    
    // Separamos las líneas y las limpiamos de espacios extra al principio/final.
    // Importante: no filtramos líneas vacías aquí aún, porque las necesitamos para detectar el final de una pregunta
    // o el inicio de la sección de respuestas.
    const lines = rawText.split('\n').map(line => line.trim());

    const testTitle = testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ');

    let parsingAnswersSection = false;
    const rawAnswers = {}; // { indexPregunta: 'letraRespuesta' }

    // Variable para manejar la pausa entre preguntas/opciones y respuestas
    let potentialAnswersSectionStart = false; 

    for (const line of lines) {
        // Ignorar líneas completamente vacías, a menos que estemos buscando el separador de secciones
        if (line === '' && !parsingAnswersSection && currentQuestion) {
            // Si hay una línea vacía y ya tenemos una pregunta,
            // podría ser el separador antes de las respuestas.
            potentialAnswersSectionStart = true;
            continue; // Saltar a la siguiente línea
        }
        if (line === '' && parsingAnswersSection) {
            // Si ya estamos en la sección de respuestas, las líneas vacías son irrelevantes
            continue;
        }

        // Detectar el inicio de la sección de respuestas
        // Buscamos un patrón como "1. A" que suele aparecer después de una pausa.
        // Reiniciamos potentialAnswersSectionStart cada vez que encontramos una pregunta o una opción.
        const answerMatchCandidate = line.match(/^(\d+)\.\s*([a-dA-D])[\)\s.]?$/i);
        if (answerMatchCandidate && potentialAnswersSectionStart) {
            if (currentQuestion) { // Asegurarse de guardar la última pregunta si existe
                questions.push(currentQuestion);
                currentQuestion = null;
            }
            parsingAnswersSection = true;
            potentialAnswersSectionStart = false; // Ya no es solo "potencial"
        }
        
        // Si ya estamos parseando respuestas, procesamos la línea como respuesta
        if (parsingAnswersSection) {
            const answerMatch = line.match(/^(\d+)\.\s*([a-dA-D])[\)\s.]?$/i); 
            if (answerMatch) {
                const qNum = parseInt(answerMatch[1]) - 1; // Ajustar a índice base 0
                const answerLetter = answerMatch[2].toLowerCase(); // 'a', 'b', 'c', 'd'
                rawAnswers[qNum] = answerLetter;
            }
            continue; // Ya procesamos la línea como respuesta, ir a la siguiente
        }
        
        // --- Parsear Preguntas y Opciones (solo si NO estamos en la sección de respuestas) ---
        if (!parsingAnswersSection) {
            const questionMatch = line.match(/^(\d+)\.\s*(.+)$/); // Ej: "1. ¿Pregunta?"
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    questionText: questionMatch[2].trim(),
                    options: [],
                    correctAnswer: null // Se asignará más tarde
                };
                potentialAnswersSectionStart = false; // Es una pregunta, no un inicio de respuestas
            } else if (currentQuestion) {
                // Modificado: El regex de opciones ahora acepta el paréntesis ')' o ningún caracter extra,
                // seguido del texto de la opción.
                const optionMatch = line.match(/^[a-dA-D][\)\.\s]\s*(.+)$/); // Ej: "a) Opción A", "a. Opción A", "a Opción A"
                if (optionMatch) {
                    currentQuestion.options.push(optionMatch[1].trim()); // Capturar el texto de la opción
                    potentialAnswersSectionStart = false; // Es una opción, no un inicio de respuestas
                }
            }
        }
    }

    // Asegurarse de guardar la última pregunta si existe y no se ha guardado
    if (currentQuestion && !parsingAnswersSection) {
        questions.push(currentQuestion);
    }

    // --- Vincular respuestas correctas a las preguntas ---
    questions.forEach((q, index) => {
        const correctLetter = rawAnswers[index]; // 'a', 'b', 'c', 'd'
        if (correctLetter) {
            const optionIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
            if (optionIndex >= 0 && optionIndex < q.options.length) {
                q.correctAnswer = q.options[optionIndex]; // Asignar el texto de la opción correcta
            } else {
                console.warn(`[Parser] Respuesta correcta '${correctLetter}' no coincide con las opciones de la pregunta ${index + 1} (${q.questionText}). Opciones disponibles: ${q.options.join(', ')}`);
                q.correctAnswer = "OPCION_NO_VALIDA";
            }
        } else {
            console.warn(`[Parser] No se encontró respuesta para la pregunta ${index + 1}: "${q.questionText}"`);
            q.correctAnswer = "NO_DEFINIDA";
        }
    });
    console.log("Preguntas parseadas:", questions);
    return {
        title: testTitle,
        questions: questions
    };
}
