// geminiLLM.js — Wrapper for Gemini LLM calls and quiz generation

// const fetch = require("node-fetch");

// const geminiLLM = {
//   apiKey: process.env.GEMINI_API_KEY,
//   url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",

//   async generate(prompt) {
//     if (!this.apiKey) throw new Error("GEMINI_API_KEY not set");

//     const res = await fetch(this.url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-goog-api-key": this.apiKey
//       },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }]
//       })
//     });

//     const data = await res.json();
//     return data;
//   }
// };

const axios = require("axios");

const geminiLLM = {
  apiKey: process.env.GEMINI_API_KEY,
  url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  
  async generate(prompt) {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY not set");

    try {
      const res = await axios.post(
        this.url,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": this.apiKey,
          },
        }
      );
      return res.data;
    } catch (err) {
      console.error("Axios Gemini API error:", err.response?.data || err.message);
      throw err;
    }
  },
};

// Example endpoint: POST /api/generate-quiz
const generateQuiz = async (req, res) => {
  try {
    const {
      source,
      num_questions = 5,
      difficulties = ["Intermediate"],
      question_types = ["MCQ", "True/False", "One Word", "Subjective"]
    } = req.body;

    if (!source) return res.status(400).json({ error: "source required" });

    // Build prompt with strict JSON instructions + few-shot examples
    const prompt = `
Generate a JSON array of ${num_questions} questions about "${source}".
Maintain a mix difficulty in questions of about ${difficulties}.
Each question must be an object with keys:
- type: one of ${question_types.join(", ")}
- text: question text
- options: array of strings (only for MCQ/True-False)
- answer: string (or array for multi-MCQ)

Use the following examples for reference:

Example 1:
{
  "type": "MCQ",
  "text": "What is the capital of France?",
  "options": ["Paris", "London", "Berlin", "Rome"],
  "answer": "Paris"
}

Example 2:
{
  "type": "True/False",
  "text": "The Sun rises in the west.",
  "options": ["True", "False"],
  "answer": "False"
}

Example 3:
{
  "type": "One Word",
  "text": "Name the process by which plants make food.",
  "answer": "Photosynthesis"
}

Example 4:
{
  "type": "Subjective",
  "text": "Explain why the sky appears blue.",
  "answer": "Due to scattering of sunlight by the atmosphere."
}

Return **only JSON**, no extra text or formatting.
`;

    const result = await geminiLLM.generate(prompt);
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Sanitize code blocks and whitespace
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
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { geminiLLM, generateQuiz };
