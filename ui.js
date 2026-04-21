// ui.js
// Responsable de la renderización de la interfaz de usuario, interacción y navegación.

const testListSection = document.getElementById('test-list-section');
const testCardsContainer = document.getElementById('test-cards-container');
const quizSection = document.getElementById('quiz-section');
const quizTitle = document.getElementById('quiz-title');
const questionContainer = document.getElementById('question-container');
const prevQuestionButton = document.getElementById('prev-question');
const nextQuestionButton = document.getElementById('next-question');
const submitQuizButton = document.getElementById('submit-quiz');
const quizResult = document.getElementById('quiz-result');
const backToListButton = document.getElementById('back-to-list');

let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = {}; // Para almacenar las respuestas del usuario { preguntaIndex: "respuestaSeleccionada" }

// Función para renderizar las tarjetas de tests
function renderTestCards(tests) {
    testCardsContainer.innerHTML = ''; // Limpiar el contenedor actual
    tests.forEach(test => {
        const card = document.createElement('div');
        card.className = `test-card type-${test.type}`; // Añadir clase de tipo para estilos específicos
        card.dataset.filename = test.filename; // Guardar el nombre del archivo para referencia

        card.innerHTML = `
            <i class="${test.icon} test-card-icon"></i>
            <h3>${test.title}</h3>
            <p>Tipo: ${test.type.toUpperCase()}</p>
            <span class="file-extension">${test.type.toUpperCase()}</span>
        `;
        card.addEventListener('click', () => startTest(test)); // Asignar evento al hacer clic
        testCardsContainer.appendChild(card);
    });
}

// Función para iniciar un test seleccionado
async function startTest(test) {
    // Ocultar la lista de tests y mostrar la sección del quiz
    testListSection.style.display = 'none';
    quizSection.style.display = 'block';
    
    quizTitle.textContent = `Cargando: ${test.title}...`;
    backToListButton.style.display = 'block'; // Mostrar el botón de volver
    quizResult.style.display = 'none'; // Ocultar resultados anteriores

    try {
        // Cargar el contenido del test usando la función de reader.js
        // AVISO: loadTestContent de reader.js actualmente devuelve datos MOCK (ejemplo)
        currentTest = await loadTestContent(test.filepath); 
        quizTitle.textContent = currentTest.title;
        currentQuestionIndex = 0;
        userAnswers = {}; // Resetear respuestas para el nuevo test
        questionContainer.style.display = 'block'; // Asegurarse de que el contenedor de preguntas es visible
        quizNavigation.style.display = 'flex'; // Asegurarse de que los botones de navegación son visibles
        renderQuestion(currentQuestionIndex);
        updateNavigationButtons();
    } catch (error) {
        console.error("Error al cargar el test:", error);
        quizTitle.textContent = `Error al cargar "${test.title}".`;
        questionContainer.innerHTML = '<p style="color: red; text-align: center;">No se pudo cargar el test. Inténtalo de nuevo más tarde.</p>';
        quizNavigation.style.display = 'none';
    }
}

// Función para renderizar una pregunta específica
function renderQuestion(index) {
    questionContainer.innerHTML = ''; // Limpiar preguntas anteriores
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
                <button class="option-button" data-option="${option}">${String.fromCharCode(97 + optIndex)}) ${option}</button>
            `).join('')}
        </div>
    `;
    questionContainer.appendChild(questionCard);

    // Asignar eventos de clic a las opciones
    const optionsGrid = document.getElementById(`options-for-q${index}`); // Obtener el contenedor de opciones
    optionsGrid.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', (event) => selectOption(event.target, index));
        
        // **Marcar la opción seleccionada si ya existe una respuesta para esta pregunta**
        if (userAnswers[index] && userAnswers[index] === button.dataset.option) {
            button.classList.add('selected');
        }
    });

    updateNavigationButtons();
}

// Función para seleccionar una opción de respuesta
function selectOption(selectedButton, questionIndex) {
    const optionsContainer = document.getElementById(`options-for-q${questionIndex}`);
    optionsContainer.querySelectorAll('.option-button').forEach(button => {
        button.classList.remove('selected'); // Quitar la selección anterior de todos los botones
    });
    selectedButton.classList.add('selected'); // Marcar la nueva selección
    userAnswers[questionIndex] = selectedButton.dataset.option; // Guardar la respuesta del usuario
    
    // console.log(`Respuesta para pregunta ${questionIndex}: ${userAnswers[questionIndex]}`);
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
    submitQuizButton.style.display = (currentQuestionIndex === currentTest.questions.length - 1) ? 'block' : 'none';
    
    // Si estamos en la última pregunta y hemos respondido todas, podríamos mostrar "Finalizar"
    // Esto es un ejemplo, se puede ajustar la lógica.
    // if (currentQuestionIndex === currentTest.questions.length - 1 && Object.keys(userAnswers).length === currentTest.questions.length) {
    //     submitQuizButton.style.display = 'block';
    // } else if (currentQuestionIndex === currentTest.questions.length - 1) {
    //     submitQuizButton.style.display = 'block'; // Mostrarlo aunque no haya respondido todas
    // } else {
    //     submitQuizButton.style.display = 'none';
    // }
}

// Función para finalizar el test y mostrar resultados
submitQuizButton.addEventListener('click', () => {
    let score = 0;
    currentTest.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            score++;
        }
    });

    questionContainer.style.display = 'none';
    quizNavigation.style.display = 'none'; // Ocultar botones de navegación
    quizResult.style.display = 'block';
    
    quizResult.innerHTML = `
        <h3>Test Finalizado!</h3>
        <p>Tu puntuación: ${score} de ${currentTest.questions.length}</p>
        <p>Aciertos: ${score}</p>
        <p>Fallos: ${currentTest.questions.length - score}</p>
    `;

    // **Opcional: Mostrar feedback de respuestas correctas/incorrectas al finalizar**
    // Podrías iterar de nuevo sobre las preguntas y mostrar el feedback en cada una
    // Por simplicidad, aquí solo mostramos el resultado general, pero se puede expandir.
    // Para la vista de revisión, se podría crear una nueva función.
});

// Botón para volver a la lista de tests
backToListButton.addEventListener('click', () => {
    testListSection.style.display = 'block'; // Mostrar la lista de tests
    quizSection.style.display = 'none'; // Ocultar la sección del quiz
    quizResult.style.display = 'none'; // Ocultar resultados si estaban visibles
    questionContainer.style.display = 'block'; // Asegurarse de que el contenedor de preguntas es visible para el siguiente test
    quizNavigation.style.display = 'flex'; // Asegurarse de que los botones de navegación son visibles para el siguiente test
    backToListButton.style.display = 'none'; // Ocultar este botón
    currentTest = null;
    currentQuestionIndex = 0;
    userAnswers = {}; // Limpiar respuestas para el siguiente test
});


// Exportar funciones si se usan en otros módulos (asegura que reader.js pueda llamar a renderTestCards)
window.renderTestCards = renderTestCards; 
// window.startTest = startTest; // Podría ser útil para depuración
