// parser.js
// Responsable de tomar el texto plano de un documento y extraer preguntas, opciones y respuestas.

export function parseTestContent(rawText, testFilePath) {
    console.log("[Parser] Iniciando parseo para:", testFilePath);
    console.log("[Parser] Texto crudo recibido (primeros 500 chars):\n", rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''));

    let preprocessedText = rawText;

    // --- PRE-PROCESAMIENTO ---
    // 1. Normalizar saltos de línea a '\n'
    preprocessedText = preprocessedText.replace(/\r\n/g, '\n');

    // 2. Asegurar que CADA número de pregunta (ej. "1.") inicie en una nueva línea.
    // Usamos (\s*|^) para capturar el inicio de línea o cualquier espacio previo.
    // Y que las opciones también estén en su propia línea
    preprocessedText = preprocessedText.replace(/(\s*|^)(\d+\.\s*)/g, '\n$2'); // Preguntas
    preprocessedText = preprocessedText.replace(/(\s*|^)([a-dA-D])\)[\t ]*/g, '\n$2) '); // Opciones

    // 3. Limpiar múltiples espacios en blanco y saltos de línea excesivos.
    preprocessedText = preprocessedText.replace(/[ \t]{2,}/g, ' '); // Reemplazar múltiples espacios/tabulaciones por uno solo
    preprocessedText = preprocessedText.replace(/(\n\s*){2,}/g, '\n'); // Reducir saltos de línea excesivos a uno solo
    preprocessedText = preprocessedText.trim(); // Eliminar espacios/saltos al inicio y final

    console.log("[Parser] Texto pre-procesado final (primeros 500 chars):\n", preprocessedText.substring(0, 500) + (preprocessedText.length > 500 ? '...' : ''));

    const lines = preprocessedText.split('\n').map(line => line.trim()).filter(line => line !== '');

    const questions = [];
    let currentQuestion = null;
    const testTitle = testFilePath.split('/').pop().replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ');

    let parsingAnswersSection = false;
    const rawAnswers = {}; // { indexPregunta: 'letraRespuesta' } // 0-indexed

    // Separador que indica el inicio de la sección de respuestas (observa el patrón `RESPUESTAS` y posibles espacios/saltos)
    const ANSWERS_SECTION_SEPARATOR_REGEX = /^RESPUESTAS\s*$/i;

    for (const line of lines) {
        if (ANSWERS_SECTION_SEPARATOR_REGEX.test(line)) {
            if (currentQuestion) {
                questions.push(currentQuestion);
                currentQuestion = null;
            }
            parsingAnswersSection = true;
            console.log("[Parser] Detectada sección de respuestas.");
            continue; // Saltamos a la siguiente línea
        }

        if (parsingAnswersSection) {
            // Patrón para las respuestas: "1.   C", "2. D"
            const answerMatch = line.match(/^(\d+)\.\s*([a-dA-D])[\s.]*$/i);
            if (answerMatch) {
                const qNum = parseInt(answerMatch[1]) - 1; // Convertir a índice base 0
                const answerLetter = answerMatch[2].toLowerCase();
                rawAnswers[qNum] = answerLetter;
                console.log(`[Parser] Respuesta: Pregunta ${qNum + 1} = ${answerLetter}`);
            } else {
                console.warn(`[Parser] Ignorando línea en sección de respuestas: "${line}" (no coincide con el patrón esperado)`);
            }
            continue;
        }

        // --- Parsear Preguntas y Opciones ---
        const questionMatch = line.match(/^(\d+)\.\s*(.+)$/);
        if (questionMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                questionText: questionMatch[2].trim(),
                options: [],
                correctAnswer: null // Se asignará después
            };
            console.log(`[Parser] Nueva pregunta: ${questionMatch[1]}. ${currentQuestion.questionText}`);
        } else if (currentQuestion) {
            // Si no es una nueva pregunta, intentamos buscar una opción o continuar el texto de la pregunta/opción
            const optionMatch = line.match(/^([a-dA-D])\)[\s]*(.+)$/); // Ajustado para 'a)'
            if (optionMatch) {
                currentQuestion.options.push(optionMatch[2].trim());
                console.log(`[Parser]   Opción: ${optionMatch[1]}) ${optionMatch[2]}`);
            } else if (line.trim() !== '') {
                // Si la línea no es una opción ni una nueva pregunta, y no está vacía,
                // la consideramos parte del texto de la pregunta anterior o de la última opción.
                if (currentQuestion.options.length === 0) {
                    currentQuestion.questionText += ' ' + line;
                    console.log(`[Parser]   Añadiendo a texto de pregunta: ${line}`);
                } else {
                    // Solo añadir si la última opción no termina con un signo de puntuación fuerte
                    // para evitar unir frases completas que deberían ser separadas por el usuario.
                    const lastOptionIndex = currentQuestion.options.length - 1;
                    const lastOptionText = currentQuestion.options[lastOptionIndex];
                    if (!/[.?!]$/.test(lastOptionText.trim())) { // Si no termina con ., ?, !
                        currentQuestion.options[lastOptionIndex] += ' ' + line;
                        console.log(`[Parser]   Añadiendo a última opción: ${line}`);
                    } else {
                        console.warn(`[Parser] WARN: Línea no parseada: "${line}". Parece parte de una nueva opción pero no tiene prefijo. Se ignorará o podría causar problemas.`);
                    }
                }
            }
        }
    }

    // Asegurarse de añadir la última pregunta si existe
    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    // --- Vincular respuestas correctas a las preguntas ---
    questions.forEach((q, index) => {
        const correctLetter = rawAnswers[index];
        if (correctLetter) {
            const optionIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
            if (optionIndex >= 0 && optionIndex < q.options.length) {
                q.correctAnswer = q.options[optionIndex];
            } else {
                console.warn(`[Parser] WARN: Respuesta correcta '${correctLetter}' no coincide con las opciones de la pregunta ${index + 1} (${q.questionText}). Opciones disponibles: ${q.options.map((o, i) => `${String.fromCharCode(97 + i)}) ${o}`).join(', ')}`);
                q.correctAnswer = "OPCION_NO_VALIDA"; // Marcar para depuración
            }
        } else {
            console.warn(`[Parser] WARN: No se encontró respuesta para la pregunta ${index + 1}: "${q.questionText}". Asignando "NO_DEFINIDA".`);
            q.correctAnswer = "NO_DEFINIDA"; // Marcar para depuración
        }
    });

    console.log("[Parser] Parseo finalizado. Objeto de preguntas:", questions);
    return {
        title: testTitle,
        questions: questions
    };
}