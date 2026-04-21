// Cargar DOCX con Mammoth.js (sin WASM, compatible con GitHub Pages)
async function readDocxWithMammoth(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result.value; // texto plano
    } catch (err) {
        console.error("Error leyendo DOCX:", err);
        return "No se pudo leer el archivo DOCX.";
    }
}

const reader = {
    async loadFile(url) {
        const extension = url.split('.').pop().toLowerCase();

        try {
            if (extension === "txt") {
                const response = await fetch(url);
                const text = await response.text();
                parser.parseText(text);
                return;
            }

            if (extension === "pdf") {
                const pdf = await pdfjsLib.getDocument(url).promise;
                let text = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(i => i.str).join(" ") + "\n";
                }

                parser.parseText(text);
                return;
            }

            if (extension === "docx") {
                const text = await readDocxWithMammoth(url);
                parser.parseText(text);
                return;
            }

            parser.parseText("Tipo de archivo no soportado: " + extension);

        } catch (error) {
            console.error("Error cargando archivo:", error);
            parser.parseText("Error cargando archivo.");
        }
    }
};
