// ui.js
// Responsable de la renderización de la interfaz de usuario, interacción y navegación.

import { loadTestList, loadTestContent } from './reader.js'; 

// Elementos del DOM
const testListSection = document.getElementById('test-list-section');
const testCardsContainer = document.getElementById('test-cards-container');
const quizSection = document.getElementById('quiz-section');
const quizTitle = document.getElementById('quiz-title');
const questionContainer = document.getElementById('question-container');
const quizNavigation = document.getElementById('quiz-navigation'); 
const prevQuestionButton = document.getElementById('prev-question');
const nextQuestionButton = document.getElementById('next-question');
const submitQuizButton = document.getElementById('submit-quiz');
const quizResult = document.getElementById('quiz-result');
const backToListButton = document.getElementById('back-to-list');

// Elementos del selector de modo
const testModeSelector = document.getElementById('test-mode-selector');
const modeExamenButton = document.getElementById('mode-examen');
const modeEstudioButton = document.getElementById('mode-estudio');

let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = {}; // { preguntaIndex: "textoDeLaRespuestaSeleccionada" }

// Variable para el modo de test (examen o estudio), por defecto 'examen'
let testMode = 'examen'; 

// --- Funciones para el selector de modo ---
async function setTestMode(mode) {
    testMode = mode;
    // Actualizar clases CSS para resaltar el botón seleccionado
    modeExamenButton.classList.remove('selected');
    modeEstudioButton.classList.remove('selected');
    if (mode === 'examen') {
        modeExamenButton.classList.add('selected');
    } else {
        modeEstudioButton.classList.add('selected');
    }
    console.log(`Modo de test cambiado a: ${testMode}`);
    const tests = await loadTestList(); 
    renderTestCards(tests); 
}


// Función para obtener la última nota guardada para un test
function getLastScore(testFilename) {
    const scoreKey = `test_score_examen_${testFilename}`; 
    const storedScore = localStorage.getItem(scoreKey);
    // Devuelve {correct, total, incorrect} o null
    return storedScore ? JSON.parse(storedScore) : null; 
}

// Función para guardar la última nota de un test
// Ahora guarda aciertos y fallos explícitamente
function saveLastScore(testFilename, correct, total) {
    const scoreKey = `test_score_examen_${testFilename}`;
    const incorrect = total - correct;
    localStorage.setItem(scoreKey, JSON.stringify({ correct, total, incorrect }));
}


// Función para renderizar las tarjetas de tests
async function renderTestCards(tests) {
    testCardsContainer.innerHTML = ''; 
    if (tests.length === 0) {
        testCardsContainer.innerHTML = '<p style="text-align: center;">No se encontraron tests.</p>';
        return;
    }
    
    // Obtener las notas de todos los tests de una vez
    const testScores = {};
    tests.forEach(test => {
        testScores[test.filename] = getLastScore(test.filename); 
    });

    tests.forEach(test => {
        const card = document.createElement('div');
        card.className = `test-card type-${test.type}`; 
        card.dataset.filename = test.filename; 

        const displayTitle = test.title.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ');

        let scoreIndicatorHtml = '';
        const lastScore = testScores[test.filename]; // Obtener la nota para este test

        // Solo mostrar la nota o "Nuevo" si estamos en modo examen
        if (testMode === 'examen') {
            if (lastScore) { 
                // Formato "X A - Y F"
                scoreIndicatorHtml = `<span class="test-score-indicator">Última Nota: ${lastScore.correct} A - ${lastScore.incorrect} F</span>`;
            } else { 
                scoreIndicatorHtml = `<span class="test-score-indicator new">Nuevo</span>`;
            }
        }
        
        card.innerHTML = `
            <i class="${test.icon} test-card-icon"></i>
            <h3>${displayTitle}</h3>
            <p>Tipo: ${test.type.toUpperCase()}</p>
            <span class="file-extension">${test.type.toUpperCase()}</span>
            ${scoreIndicatorHtml}
        `;
        card.addEventListener('click', () => startTest(test)); 
        testCardsContainer.appendChild(card);
    });
}

// Función para iniciar un test seleccionado
async function startTest(test) {
    testModeSelector.style.display = 'none'; 
    testListSection.style.display = 'none';
    quizSection.style.display = 'block';
    
    quizTitle.textContent = `Cargando: ${test.title.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ')}...`;
    backToListButton.style.display = 'block'; 
    quizResult.style.display = 'none'; 

    questionContainer.innerHTML = '<div style="text-align: center; margin-top: 50px;"><i class="fas fa-spinner fa-spin fa-3x" style="color: #3498db;"></i><p>Procesando test...</p></div>';
    quizNavigation.style.display = 'none'; 
    
    submitQuizButton.style.display = (testMode === 'examen') ? 'block' : 'none'; 

    try {
        currentTest = await loadTestContent(test.filepath, test.type); 
        
        if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
            throw new Error("El test no tiene preguntas o está vacío después del procesamiento.");
        }

        quizTitle.textContent = currentTest.title;
        currentQuestionIndex = 0;
        userAnswers = {}; // Resetear respuestas para el nuevo test
        questionContainer.style.display = 'block'; 
        quizNavigation.style.display = 'flex'; 
        renderQuestion(currentQuestionIndex);
        updateNavigationButtons();
    } catch (error) {
        console.error("Error al cargar el test:", error);
        quizTitle.textContent = `Error al cargar "${test.title}".`;
        questionContainer.innerHTML = `<p style="color: red; text-align: center;">No se pudo cargar el test: ${error.message}. Asegúrate de que el formato sea correcto y el archivo sea accesible.</p>`;
        quizNavigation.style.display = 'none';
    }
}

// Función para renderizar una pregunta específica
function renderQuestion(index) {
    questionContainer.innerHTML = ''; 
    const questionData = currentTest.questions[index];
    if (!questionData) {
        questionContainer.innerHTML = '<p>No hay preguntas disponibles.</p>';
        return;
    }

    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.innerHTML = `
        <p class="question-text"><strong>Pregunta ${index + 1}:</strong> ${questionData.questionText}</p>
        <div class="options-grid" id="options-for-q${index}">
            ${questionData.options.map((option, optIndex) => `
                <button class="option-button" data-option="${option}" data-opt-index="${optIndex}">${String.fromCharCode(97 + optIndex)}) ${option}</button>
            `).join('')}
        </div>
    `;
    questionContainer.appendChild(questionCard);

    const optionsGrid = document.getElementById(`options-for-q${index}`);
    optionsGrid.querySelectorAll('.option-button').forEach(button => {
        // En modo estudio, queremos que no se puedan cambiar las opciones una vez respondido
        if (testMode === 'estudio' && userAnswers[index]) {
            button.disabled = true; // Deshabilita los botones si ya hay una respuesta
        } else {
            button.addEventListener('click', (event) => selectOption(event.target, index));
        }
        
        // Marcar la opción seleccionada si ya existe una respuesta para esta pregunta
        if (userAnswers[index] && userAnswers[index] === button.dataset.option) {
            button.classList.add('selected');
            // Si es modo estudio y ya está respondida, mostrar feedback instantáneo
            if (testMode === 'estudio') {
                 const isCorrect = userAnswers[index] === questionData.correctAnswer;
                 button.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
                 // Si fue incorrecta, también resalta la correcta
                 if (!isCorrect) {
                    optionsGrid.querySelectorAll('.option-button').forEach(btn => {
                        if (btn.dataset.option === questionData.correctAnswer) {
                            btn.classList.add('correct-feedback');
                        }
                    });
                 }
                 // Deshabilita todas las opciones una vez respondida
                 optionsGrid.querySelectorAll('.option-button').forEach(btn => btn.disabled = true);
            }
        }
    });

    updateNavigationButtons();
}

// Función para seleccionar una opción de respuesta
function selectOption(selectedButton, questionIndex) {
    const questionData = currentTest.questions[questionIndex];
    const optionsContainer = document.getElementById(`options-for-q${questionIndex}`);

    optionsContainer.querySelectorAll('.option-button').forEach(button => {
        button.classList.remove('selected'); 
    });
    selectedButton.classList.add('selected'); 
    userAnswers[questionIndex] = selectedButton.dataset.option; 
    
    // Lógica para modo estudio: feedback instantáneo
    if (testMode === 'estudio') {
        const isCorrect = selectedButton.dataset.option === questionData.correctAnswer;

        // Quita feedback anterior si existe (por si cambia la implementación)
        optionsContainer.querySelectorAll('.option-button').forEach(button => {
            button.classList.remove('correct-feedback', 'incorrect-feedback');
        });

        // Aplica feedback a la selección del usuario
        selectedButton.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
        
        // Si la respuesta del usuario es incorrecta, resalta la correcta también
        if (!isCorrect) {
            optionsContainer.querySelectorAll('.option-button').forEach(button => {
                if (button.dataset.option === questionData.correctAnswer) {
                    button.classList.add('correct-feedback'); // Resalta la correcta
                }
            });
        }
        
        // Deshabilita todas las opciones de la pregunta una vez respondida
        optionsContainer.querySelectorAll('.option-button').forEach(button => {
            button.disabled = true;
        });
    }
}

// Funciones de navegación
prevQuestionButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion(currentQuestionIndex);
    }
});

nextQuestionButton.addEventListener('click', () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
    }
});

// Actualizar visibilidad de botones de navegación (Prev, Next, Finalizar)
function updateNavigationButtons() {
    if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
        prevQuestionButton.style.display = 'none';
        nextQuestionButton.style.display = 'none';
        submitQuizButton.style.display = 'none';
        return;
    }

    prevQuestionButton.style.display = (currentQuestionIndex > 0) ? 'block' : 'none';
    nextQuestionButton.style.display = (currentQuestionIndex < currentTest.questions.length - 1) ? 'block' : 'none';
    
    submitQuizButton.style.display = (testMode === 'examen' && currentQuestionIndex === currentTest.questions.length - 1) ? 'block' : 'none';
}

// Función para finalizar el test y mostrar resultados (solo en modo examen)
submitQuizButton.addEventListener('click', () => {
    if (testMode !== 'examen') return; 

    let correctAnswers = 0;
    const totalQuestions = currentTest.questions.length;

    currentTest.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            correctAnswers++;
        }
    });

    // Guardar la puntuación en localStorage usando el filename completo del test
    saveLastScore(currentTest.filename, correctAnswers, totalQuestions);

    questionContainer.style.display = 'none';
    quizNavigation.style.display = 'none'; 
    quizResult.style.display = 'block';
    quizResult.innerHTML = ''; 

    const incorrectAnswers = totalQuestions - correctAnswers;
    const scoreSummary = document.createElement('div');
    scoreSummary.innerHTML = `
        <h3>Test Finalizado: ${currentTest.title}</h3>
        <p>Tu puntuación: <strong>${correctAnswers}</strong> aciertos de <strong>${totalQuestions}</strong> preguntas</p>
        <p>Aciertos: <span style="color: #28a745; font-weight: bold;">${correctAnswers}</span></p>
        <p>Fallos: <span style="color: #dc3545; font-weight: bold;">${incorrectAnswers}</span></p>
        <hr>
        <h4>Revisión de Preguntas:</h4>
    `;
    quizResult.appendChild(scoreSummary);

    currentTest.questions.forEach((question, index) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-question-card';
        
        const userSelectedAnswer = userAnswers[index];
        const isCorrect = userSelectedAnswer === question.correctAnswer;

        let optionsHtml = question.options.map((option, optIndex) => {
            let optionClass = 'review-option';
            let feedbackIcon = '';
            
            // Si es la respuesta correcta, la marcamos
            if (option === question.correctAnswer) {
                optionClass += ' correct';
                feedbackIcon = '<i class="fas fa-check feedback-icon correct"></i>';
            }

            // Si el usuario seleccionó esta opción
            if (option === userSelectedAnswer) {
                optionClass += ' user-selected';
                if (!isCorrect) { 
                    optionClass += ' incorrect';
                    feedbackIcon = '<i class="fas fa-times feedback-icon incorrect"></i>';
                }
            }

            return `<div class="${optionClass}">${String.fromCharCode(97 + optIndex)}) ${option} ${feedbackIcon}</div>`;
        }).join('');

        reviewCard.innerHTML = `
            <p class="question-text"><strong>Pregunta ${index + 1}:</strong> ${question.questionText}</p>
            <div>${optionsHtml}</div>
        `;
        quizResult.appendChild(reviewCard);
    });
});

// Botón para volver a la lista de tests
backToListButton.addEventListener('click', async () => { 
    testModeSelector.style.display = 'block'; 
    testListSection.style.display = 'block'; 
    quizSection.style.display = 'none'; 
    quizResult.style.display = 'none'; 
    questionContainer.style.display = 'block'; 
    quizNavigation.style.display = 'flex'; 
    backToListButton.style.display = 'none'; 
    currentTest = null;
    currentQuestionIndex = 0;
    userAnswers = {}; 
    submitQuizButton.style.display = 'none'; 

    const tests = await loadTestList(); 
    renderTestCards(tests); 
});


// Llama a cargar la lista de tests cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    modeExamenButton.addEventListener('click', async () => setTestMode('examen'));
    modeEstudioButton.addEventListener('click', async () => setTestMode('estudio'));

    const tests = await loadTestList(); 
    renderTestCards(tests); 
    setTestMode('examen'); 
});