import React from "react";

export default function ViewModeQuestions({ questions }) {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id} className="bg-gray-50 p-4 rounded-2xl shadow space-y-2">
          <h2 className="font-semibold">Question {idx + 1}</h2>
          <p className="font-medium">{q.text}</p>
          {(q.type.includes("MCQ") || q.type === "True/False") && (
            <ul className="list-disc pl-5 space-y-1">
              {q.options.map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ul>
          )}
          {q.type === "One Word" && <p>Answer: {q.answer}</p>}
        </div>
      ))}
    </div>
  );
}
