document.addEventListener("DOMContentLoaded", async () => {
    const listContainer = document.getElementById("test-list");

    try {
        const response = await fetch("tests.json");
        const tests = await response.json();

        listContainer.innerHTML = "";

        tests.forEach(test => {
            const item = document.createElement("div");
            item.className = "test-item";

            item.innerHTML = `
                <span>${test}</span>
                <button onclick="openTest('${test}')">Abrir</button>
            `;

            listContainer.appendChild(item);
        });

    } catch (error) {
        listContainer.innerHTML = "<p>Error cargando tests.json</p>";
        console.error(error);
    }
});

function openTest(filename) {
    const url = `tests/${encodeURIComponent(filename)}`;
    reader.loadFile(url);
}

