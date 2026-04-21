function parseTest(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    const questions = [];
    let current = null;

    for (let line of lines) {
        if (/^\d+\./.test(line)) {
            if (current) questions.push(current);
            current = { question: line, options: [] };
        } else if (/^[abcd]\)/i.test(line)) {
            current.options.push(line);
        }
    }

    if (current) questions.push(current);

    const answers = lines.slice(-questions.length).map(a => a.trim().toUpperCase());

    return { questions, answers };
}
