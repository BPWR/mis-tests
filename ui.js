document.addEventListener("DOMContentLoaded", async () => {
    const listContainer = document.getElementById("test-list");

    try {
        const response = await fetch("tests.json");
        const tests = await response.json();

        listContainer.innerHTML = "";

        tests.forEach(test => {
            const item = document.createElement("div");
            item.className = "test-item";

            const safeName = test.replace(/"/g, '&quot;');

            item.innerHTML = `
                <span>${safeName}</span>
                <button onclick="openTest('${safeName}')">Abrir</button>
            `;

            listContainer.appendChild(item);
        });

    } catch (error) {
        listContainer.innerHTML = "<p>Error cargando tests.json</p>";
        console.error(error);
    }
});

function openTest(filename) {
    const url = "tests/" + encodeURIComponent(filename);
    reader.loadFile(url);
}
