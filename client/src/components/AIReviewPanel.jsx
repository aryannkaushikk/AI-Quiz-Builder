import React from "react";
import { QUESTION_TYPES } from "../data/constants";

export default function AIReviewPanel({
  aiQuestions,
  setAiQuestions,
  confirmAIQuestion,
  confirmAllAIQuestions,
  removeAIQuestion,
}) {
  const updateQuestionField = (index, field, value) => {
    const updated = [...aiQuestions];
    const q = updated[index];

    if (field === "type") {
      q.type = value;
      switch (value) {
        case "MCQ":
          q.options = ["", "", "", ""];
          q.answer = "";
          break;
        case "Multi MCQ":
          q.options = ["", "", "", ""];
          q.answer = [];
          break;
        case "True/False":
          q.options = ["True", "False"];
          q.answer = "";
          break;
        default:
          q.options = [];
          q.answer = "";
      }
    } else {
      q[field] = value;
    }

    setAiQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...aiQuestions];
    updated[qIndex].options[optIndex] = value;
    setAiQuestions(updated);
  };

  const toggleMultiAnswer = (qIndex, option) => {
    const updated = [...aiQuestions];
    const q = updated[qIndex];
    let answers = Array.isArray(q.answer) ? [...q.answer] : [];

    if (answers.includes(option)) {
      answers = answers.filter((a) => a !== option);
    } else {
      answers.push(option);
    }

    q.answer = answers;
    setAiQuestions(updated);
  };

  if (!aiQuestions.length) return null;

  return (
    <div className="bg-yellow-50 p-4 rounded-2xl mb-6 space-y-2 max-h-96 overflow-y-auto relative">
      <div className="flex justify-end space-x-2 mb-2">
        <button
          onClick={confirmAllAIQuestions}
          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
        >
          Confirm All
        </button>
        <button
          onClick={() => setAiQuestions([])}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Remove All
        </button>
      </div>

      <h3 className="font-semibold text-yellow-800 mb-2">AI-generated Questions</h3>

      {aiQuestions.map((q, idx) => (
        <div key={q.id} className="border rounded p-2 space-y-2">
          <select
            className="border rounded p-1 w-full"
            value={q.type}
            onChange={(e) => updateQuestionField(idx, "type", e.target.value)}
          >
            {QUESTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Question Text"
            className="border rounded p-1 w-full resize-none"
            value={q.text}
            onChange={(e) => updateQuestionField(idx, "text", e.target.value)}
          />

          {(q.type.includes("MCQ") || q.type === "True/False") &&
            q.options.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Option ${i + 1}`}
                className="border rounded p-1 w-full"
                value={opt}
                onChange={(e) => updateOption(idx, i, e.target.value)}
              />
            ))}

          {q.type === "Multi MCQ" && (
            <div className="flex flex-wrap gap-2 mt-1">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={Array.isArray(q.answer) && q.answer.includes(opt)}
                    onChange={() => toggleMultiAnswer(idx, opt)}
                    className="accent-purple-700"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "One Word" && (
            <input
              type="text"
              placeholder="Answer"
              className="border rounded p-1 w-full"
              value={q.answer || ""}
              onChange={(e) => updateQuestionField(idx, "answer", e.target.value)}
            />
          )}

          <textarea
            placeholder="Explanation (Optional)"
            className="border rounded p-1 w-full resize-none"
            value={q.explanation || ""}
            onChange={(e) => updateQuestionField(idx, "explanation", e.target.value)}
          />

          <div className="flex space-x-2 mt-1">
            <button
              onClick={() => confirmAIQuestion(idx)}
              className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            >
              Confirm
            </button>
            <button
              onClick={() => removeAIQuestion(idx)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
