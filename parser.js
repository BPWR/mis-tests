// parser.js
// Responsable de tomar el texto plano de un documento y extraer preguntas, opciones y respuestas.

function parseTestContent(rawText, testFilePath) {
    console.log("Parseando el siguiente texto:\n", rawText);

    const questions = [];
    let currentQuestion = null;
    
    // Dividir por líneas, limpiar espacios en blanco al inicio/fin y filtrar líneas completamente vacías.
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line !== '');

    const testTitle = testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ');

    let parsingAnswersSection = false;
    const rawAnswers = {}; // Para almacenar las respuestas antes de vincularlas { indexPregunta: 'letraRespuesta' }

    for (const line of lines) {
        // Detectar el inicio de la sección de respuestas
        // Usamos una regex más robusta para varias formas (ej: "1. B", "1.b", "1. b)", "1. B)")
        if (line.match(/^(\d+)\.\s*[a-dA-D][\)\s]?/)) {
            // Si la línea es una respuesta numerada, y aún no estamos en la sección de respuestas,
            // asumimos que el bloque anterior era de preguntas y ahora empieza el de respuestas.
            // Esto es crucial para tu formato donde las respuestas pueden no tener un encabezado explícito.
            if (!parsingAnswersSection) {
                 if (currentQuestion) { // Asegurarse de guardar la última pregunta si existe
                    questions.push(currentQuestion);
                    currentQuestion = null;
                }
                parsingAnswersSection = true;
            }
        }

        if (!parsingAnswersSection) {
            // --- Parsear Preguntas y Opciones ---
            const questionMatch = line.match(/^(\d+)\.\s*(.+)$/); // Ej: "1. ¿Pregunta?"
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion); // Añadir la pregunta anterior si existe
                }
                currentQuestion = {
                    questionText: questionMatch[2].trim(), // El texto de la pregunta
                    options: [],
                    correctAnswer: null // Esto se llenará desde la sección de RESPUESTAS
                };
            } else if (currentQuestion) {
                const optionMatch = line.match(/^[a-dA-D])\s*(.+)$/); // Ej: "a) Opción A"
                if (optionMatch) {
                    currentQuestion.options.push(optionMatch[2].trim()); // El texto de la opción
                }
            }
        } else {
            // --- Parsear la sección de Respuestas ---
            // El formato es "1. B" o "1. B)" o "1.b" o "1.b)"
            const answerMatch = line.match(/^(\d+)\.\s*([a-dA-D])[\)\s]?(.+)?$/i); 
            if (answerMatch) {
                const qNum = parseInt(answerMatch[1]) - 1; // Ajustar a índice base 0
                const answerLetter = answerMatch[2].toLowerCase(); // 'a', 'b', 'c', 'd'

                // Almacenar solo la letra de la respuesta correcta para luego mapearla al texto
                rawAnswers[qNum] = answerLetter;
            }
        }
    }

    // Asegurarse de añadir la última pregunta si el bucle termina y currentQuestion no es null
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
                q.correctAnswer = "NO_ENCONTRADA"; // Marcar como no encontrada
            }
        } else {
            console.warn(`[Parser] No se encontró respuesta para la pregunta ${index + 1}: "${q.questionText}"`);
            q.correctAnswer = "NO_DEFINIDA"; // Marcar como no definida
        }
    });

    return {
        title: testTitle,
        questions: questions
    };
}

// Exportar la función para que reader.js pueda llamarla
window.parseTestContent = parseTestContent;
