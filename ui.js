document.addEventListener("DOMContentLoaded", async () => {
    const listContainer = document.getElementById("test-list");

    try {
        const response = await fetch("tests.json");
        const tests = await response.json();

        listContainer.innerHTML = "";

        tests.forEach(test => {
            const item = document.createElement("div");
            item.className = "test-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = test;

            const btn = document.createElement("button");
            btn.textContent = "Abrir";

            btn.addEventListener("click", () => {
                const url = "tests/" + encodeURIComponent(test);
                reader.loadFile(url);
            });

            item.appendChild(nameSpan);
            item.appendChild(btn);

            listContainer.appendChild(item);
        });

    } catch (error) {
        listContainer.innerHTML = "<p>Error cargando tests.json</p>";
        console.error(error);
    }
});
