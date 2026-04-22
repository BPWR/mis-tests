// parser.js
// Responsable de tomar el texto plano de un documento y extraer preguntas, opciones y respuestas.

export function parseTestContent(rawText, testFilePath) { // Exportar la función
    console.log("Parseando el siguiente texto:\n", rawText);

    // --- PRE-PROCESAMIENTO: Asegurarse de que cada pregunta empiece en una nueva línea ---
    // Esto es crucial porque en tu formato, a veces el número de la siguiente pregunta
    // aparece en la misma línea que la última opción de la pregunta anterior.
    let preprocessedText = rawText.replace(/(\d+)\.\s*(.+?)?\s*([a-dA-D][\)\.\s]\s*.+?)?\s*(\d+\.\s*)/g, (match, qNum1, qText1, optionText1, qNum2) => {
        // match: toda la coincidencia (ej. "d) Opción D. 5. ¿Pregunta 5?")
        // qNum1: Número de la primera pregunta (ej. "4")
        // qText1: Texto de la primera pregunta (puede ser undefined si ya está en opciones)
        // optionText1: La última opción de la pregunta anterior (ej. "d) Opción D.")
        // qNum2: El inicio de la siguiente pregunta (ej. "5. ")

        // El objetivo es insertar un salto de línea antes de qNum2 si no hay ya uno
        if (qNum2) {
            return `${match.substring(0, match.lastIndexOf(qNum2))}\n${qNum2}`;
        }
        return match; // Si no hay siguiente pregunta, devolver como está
    });
    // Una segunda pasada para casos donde las opciones terminan sin punto y la pregunta sigue inmediatamente
    preprocessedText = preprocessedText.replace(/([a-dA-D][\)\.\s]\s*.+?)(\s*\d+\.\s*)/g, (match, optionPart, nextQuestionPart) => {
        return `${optionPart}\n${nextQuestionPart}`;
    });

    // Asegurarse de que cada opción esté en su propia línea
    preprocessedText = preprocessedText.replace(/([a-dA-D][\)\.\s]\s*)([a-dA-D][\)\.\s]\s*)/g, '$1\n$2');


    // Luego, dividir por líneas y limpiar espacios como antes
    const lines = preprocessedText.split('\n').map(line => line.trim()).filter(line => line !== '');

    const questions = [];
    let currentQuestion = null;
    
    const testTitle = testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ');

    let parsingAnswersSection = false;
    const rawAnswers = {}; // { indexPregunta: 'letraRespuesta' }

    // Variable para manejar la pausa entre preguntas/opciones y respuestas
    let potentialAnswersSectionStart = false; 

    for (const line of lines) {
        // Detectar el inicio de la sección de respuestas
        // Buscamos un patrón como "1. A" que suele aparecer después de una pausa.
        const answerMatchCandidate = line.match(/^(\d+)\.\s*([a-dA-D])[\)\s.]?$/i);
        if (answerMatchCandidate && (potentialAnswersSectionStart || line.startsWith("1.") && questions.length > 0)) {
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
                // El regex de opciones ahora acepta el paréntesis ')' o ningún caracter extra,
                // seguido del texto de la opción.
                const optionMatch = line.match(/^[a-dA-D][\)\.\s]\s*(.+)$/); // Ej: "a) Opción A", "a. Opción A", "a Opción A"
                if (optionMatch) {
                    currentQuestion.options.push(optionMatch[1].trim()); // Capturar el texto de la opción
                    potentialAnswersSectionStart = false; // Es una opción, no un inicio de respuestas
                }
            } else if (line.trim() === '') { // Si encontramos una línea vacía Y NO hay una pregunta activa
                potentialAnswersSectionStart = true; // Podría ser el separador antes de las respuestas
            }
        }
    }

    // Asegurarse de guardar la última pregunta si existe y no se ha guardado
    if (currentQuestion) { // Ya que filter(line => line !== '') fue al final
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
