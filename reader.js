const reader = {
    async loadFile(url) {
        const extension = url.split('.').pop().toLowerCase();

        if (extension === "txt") {
            const response = await fetch(url);
            const text = await response.text();
            parser.parseText(text);
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
        }

        if (extension === "docx") {
            const response = await fetch(url);
            const blob = await response.blob();
            const text = await readDocx(blob);
            parser.parseText(text);
        }
    }
};

async function readDocx(blob) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = async e => {
            const arrayBuffer = e.target.result;
            const text = await window.docx.extractRawText(arrayBuffer);
            resolve(text);
        };
        reader.readAsArrayBuffer(blob);
    });
}
