let currentTest = null;
let mode = null;
let timer = null;
let timeLeft = 0;

async function start() {
    const files = await loadTests();
    showTestMenu(files);
}

function showTestMenu(files) {
    const app = document.getElementById("app");
    app.innerHTML = `<h1>Selecciona un test</h1>`;

    files.forEach(f => {
        app.innerHTML += `
        <div class="card">
            <h2>📄 ${f}</h2>
            <button class="button" onclick="selectMode('${f}')">Abrir</button>
        </div>`;
    });
}

function selectMode(file) {
    const app = document.getElementById("app");
    app.innerHTML = `
    <div class="card">
        <h2>¿Cómo quieres hacer este test?</h2>
        <button class="button" onclick="loadTest('${file}', 'normal')">Modo normal</button>
        <button class="button" onclick="loadTest('${file}', 'random')">Modo aleatorio</button>
        <button class="button" onclick="selectTime('${file}')">Modo examen</button>
    </div>`;
}

function selectTime(file) {
    const app = document.getElementById("app");
    app.innerHTML = `
    <div class="card">
        <h2>Tiempo para el examen</h2>
        <button class="button" onclick="loadTest('${file}', 'exam', 10)">10 minutos</button>
        <button class="button" onclick="loadTest('${file}', 'exam', 20)">20 minutos</button>
        <button class="button" onclick="loadTest('${file}', 'exam', 30)">30 minutos</button>
    </div>`;
}

async function loadTest(file, selectedMode, minutes = null) {
    mode = selectedMode;
    const text = await readFile(file);
    currentTest = parseTest(text);

    if (mode === "random") {
        currentTest.questions = currentTest.questions.sort(() => Math.random() - 0.5);
    }

    if (mode === "exam") {
        timeLeft = minutes * 60;
        startTimer();
    }

    showQuestion(0, file);
}

function startTimer() {
    const app = document.getElementById("app");
    const timerDiv = document.createElement("div");
    timerDiv.className = "timer";
    timerDiv.id = "timer";
    document.body.prepend(timerDiv);

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = formatTime(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(timer);
            showResults();
        }
    }, 1000);
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function showQuestion(i, file) {
    const app = document.getElementById("app");
    const q = currentTest.questions[i];

    app.innerHTML = `
    <div class="card">
        <h2>${file}</h2>
        <h3>${q.question}</h3>
        ${q.options.map((o, idx) => `
            <div class="option" onclick="answer(${i}, ${idx})">${o}</div>
        `).join("")}
    </div>`;
}

function answer(i, idx) {
    if (mode === "exam") {
        if (i + 1 < currentTest.questions.length) {
            showQuestion(i + 1);
        } else {
            showResults();
        }
        return;
    }

    const correct = currentTest.answers[i].charCodeAt(0) - 65;

    const options = document.querySelectorAll(".option");
    options[idx].classList.add(idx === correct ? "correct" : "wrong");

    setTimeout(() => {
        if (i + 1 < currentTest.questions.length) {
            showQuestion(i + 1);
        } else {
            showResults();
        }
    }, 700);
}

function showResults() {
    clearInterval(timer);

    const app = document.getElementById("app");
    app.innerHTML = `
    <div class="card">
        <h2>Resultados</h2>
        <p>Test completado</p>
        <button class="button" onclick="start()">Volver al menú</button>
    </div>`;
}

start();
