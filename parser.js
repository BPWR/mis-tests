// parser.js
// Responsable de tomar el texto plano de un documento y extraer preguntas, opciones y respuestas.

export function parseTestContent(rawText, testFilePath) { // Exportar la función
    console.log("Parseando el siguiente texto:\n", rawText);

    const questions = [];
    let currentQuestion = null;
    
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line !== '');

    const testTitle = testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ');

    let parsingAnswersSection = false;
    const rawAnswers = {}; // { indexPregunta: 'letraRespuesta' }

    for (const line of lines) {
        // Detectar el inicio de la sección de respuestas por el patrón "1. A"
        // Este regex ahora maneja si hay un espacio, un paréntesis o nada después de la letra.
        if (line.match(/^(\d+)\.\s*[a-dA-D][\)\s]?$/)) {
             if (!parsingAnswersSection && currentQuestion) { // Asegurarse de guardar la última pregunta si existe
                questions.push(currentQuestion);
                currentQuestion = null;
            }
            parsingAnswersSection = true;
        }


        if (!parsingAnswersSection) {
            // --- Parsear Preguntas y Opciones ---
            const questionMatch = line.match(/^(\d+)\.\s*(.+)$/); // Ej: "1. ¿Pregunta?"
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    questionText: questionMatch[2].trim(),
                    options: [],
                    correctAnswer: null
                };
            } else if (currentQuestion) {
                // CORREGIDO: Expresión regular para opciones. Quitado el ')' extra.
                const optionMatch = line.match(/^[a-dA-D]\)\s*(.+)$/); // Ej: "a) Opción A"
                if (optionMatch) {
                    currentQuestion.options.push(optionMatch[1].trim()); // Capturar el texto de la opción
                }
            }
        } else {
            // --- Parsear la sección de Respuestas ---
            // El formato es "1. B" o "1. B)" o "1.b" o "1.b)"
            const answerMatch = line.match(/^(\d+)\.\s*([a-dA-D])[\)\s]?$/i); 
            if (answerMatch) {
                const qNum = parseInt(answerMatch[1]) - 1; // Ajustar a índice base 0
                const answerLetter = answerMatch[2].toLowerCase(); // 'a', 'b', 'c', 'd'
                rawAnswers[qNum] = answerLetter;
            }
        }
    }

    if (currentQuestion) {
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
                console.warn(`[Parser] Respuesta incorrecta o fuera de rango para pregunta ${index + 1} (${q.questionText}): ${correctLetter}`);
                q.correctAnswer = "NO_ENCONTRADA";
            }
        } else {
            console.warn(`[Parser] No se encontró respuesta para la pregunta ${index + 1}: "${q.questionText}"`);
            q.correctAnswer = "NO_DEFINIDA";
        }
    });

    return {
        title: testTitle,
        questions: questions
    };
}
