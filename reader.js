async function loadTests() {
    const response = await fetch("tests/");
    const text = await response.text();
    const files = [...text.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(f => f !== "../");

    return files;
}

async function readFile(path) {
    const ext = path.split('.').pop().toLowerCase();

    if (ext === "txt") {
        return fetch("tests/" + path).then(r => r.text());
    }

    if (ext === "pdf") {
        return readPDF("tests/" + path);
    }

    if (ext === "docx") {
        return readDOCX("tests/" + path);
    }

    return "";
}

async function readPDF(url) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    const pdf = await pdfjsLib.getDocument(url).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(i => i.str).join(" ") + "\n";
    }

    return text;
}

async function readDOCX(url) {
    const buffer = await fetch(url).then(r => r.arrayBuffer());
    return window.docxText(buffer);
}
