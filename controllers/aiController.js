const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

const geminiLLM = {
  apiKey: process.env.GEMINI_API_KEY,
  url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",

  async generate(prompt) {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY not set");

    try {
      const res = await axios.post(
        this.url,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { "Content-Type": "application/json", "X-goog-api-key": this.apiKey } }
      );
      return res.data;
    } catch (err) {
      console.error("Axios Gemini API error:", err.response?.data || err.message);
      throw err;
    }
  },
};

// ------------------- FILE TEXT EXTRACTION -------------------
async function extractTextFromFile(file) {
  const { mimetype, path } = file;

  if (mimetype.includes("pdf")) {
    const data = await pdfParse(fs.readFileSync(path));
    return data.text;
  } else if (mimetype.includes("word") || mimetype.includes("officedocument")) {
    const result = await mammoth.extractRawText({ path });
    return result.value;
  } else if (mimetype.startsWith("image/")) {
    const { data } = await Tesseract.recognize(path, "eng");
    return data.text;
  } else if (mimetype.includes("text")) {
    return fs.readFileSync(path, "utf8");
  } else {
    throw new Error("Unsupported file type");
  }
}

// ------------------- /api/generate-quiz -------------------
const generateQuiz = async (req, res) => {
  try {
    let { source, num_questions = 5, difficulties = ["Intermediate"], question_types = ["MCQ", "True/False", "One Word", "Subjective"] } = req.body;

// Ensure difficulties is an array
if (!Array.isArray(difficulties)) {
  difficulties = [difficulties];
}

// Ensure question_types is an array
if (!Array.isArray(question_types)) {
  question_types = [question_types];
}


    let context = source || "";

    if (req.file) {
      const text = await extractTextFromFile(req.file);
      context += "\n" + text;
    }

    if (!context.trim())
      return res.status(400).json({ error: "Provide text or upload a file." });

    const prompt = `
Generate a JSON array of ${num_questions} questions about the following content:
"${context.slice(0, 10000)}"  // limit to 10k chars for safety

Maintain a mix difficulty in questions: ${difficulties.join(", ")}.
Each question must be an object with keys:
- type: one of ${question_types.join(", ")}
- text: question text
- options: array of strings (only for MCQ/True-False)
- answer: string (or array)

Return only JSON, no extra text.
`;

    const result = await geminiLLM.generate(prompt);
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const sanitized = raw.replace(/```json|```/gi, "").trim();

    let quiz;
    try {
      quiz = JSON.parse(sanitized);
    } catch (err) {
      console.error("LLM parse error:", sanitized);
      return res.status(500).json({ error: "LLM returned unparsable JSON", raw: sanitized });
    }

    res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    if (req.file) fs.unlink(req.file.path, () => {}); // cleanup
  }
};

// ------------------- /api/convert-quiz -------------------
const convertQuiz = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a quiz file to convert." });

    const text = await extractTextFromFile(req.file);

    const prompt = `
You are a parser. Convert the following quiz text into valid JSON questions.
Rules:
- type: MCQ, True/False, One Word, Subjective
- text: question text
- options: array (only for MCQ/True-False)
- answer: string or array
Use only the content present. Do not generate new questions.
Return only JSON array.
Content:
${text.slice(0, 10000)}
`;

    const result = await geminiLLM.generate(prompt);
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const sanitized = raw.replace(/```json|```/gi, "").trim();

    let quiz;
    try {
      quiz = JSON.parse(sanitized);
    } catch (err) {
      console.error("convertQuiz parse error:", sanitized);
      return res.status(500).json({ error: "Unparsable JSON", raw: sanitized });
    }

    res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    if (req.file) fs.unlink(req.file.path, () => {});
  }
};

module.exports = { geminiLLM, generateQuiz, convertQuiz };
