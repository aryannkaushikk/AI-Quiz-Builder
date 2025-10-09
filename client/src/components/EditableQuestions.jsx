import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function EditableQuestions({ questions, setQuestions, removeQuestion, handleQuestionChange, handleOptionChange, addOption }) {
  
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newQuestions = Array.from(questions);
    const [moved] = newQuestions.splice(result.source.index, 1);
    newQuestions.splice(result.destination.index, 0, moved);
    setQuestions(newQuestions);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="questions">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {questions.map((q, idx) => (
              <Draggable key={q.id} draggableId={q.id.toString()} index={idx}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-gray-50 p-4 rounded-2xl shadow space-y-2">
                    <div className="flex justify-between items-center">
                      <h2 className="font-semibold">Question {idx + 1}</h2>
                      <button onClick={() => removeQuestion(idx)} className="text-red-500 hover:underline">Delete</button>
                    </div>

                    <select className="border rounded p-2 w-full" value={q.type} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "type", e.target.value)}>
                      {["MCQ", "True/False", "One Word"].map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>

                    <textarea
                      placeholder="Question Text"
                      className="border rounded p-2 w-full resize-none"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "text", e.target.value)}
                    />

                    {(q.type.includes("MCQ") || q.type === "True/False") &&
                      q.options.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          placeholder={`Option ${oIdx + 1}`}
                          className="border rounded p-2 w-full"
                          value={opt}
                          onChange={(e) => handleOptionChange(questions, setQuestions, idx, oIdx, e.target.value)}
                        />
                      ))
                    }

                    {q.type.includes("MCQ") && (
                      <button onClick={() => addOption(questions, setQuestions, idx)} className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 mt-1">
                        + Add Option
                      </button>
                    )}

                    {(q.type === "Multi MCQ") && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {q.options.map((opt, i) => (
                          <label key={i} className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              checked={Array.isArray(q.answer) && q.answer.includes(opt)}
                              onChange={() => {
                                let newAnswer = Array.isArray(q.answer) ? [...q.answer] : [];
                                newAnswer = newAnswer.includes(opt)
                                  ? newAnswer.filter((a) => a !== opt)
                                  : [...newAnswer, opt];
                                handleQuestionChange(questions, setQuestions, idx, "answer", newAnswer);
                              }}
                              className="accent-purple-700"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(q.type === "One Word") && (
                      <input
                        type="text"
                        placeholder="Answer"
                        className="border rounded p-2 w-full mt-1"
                        value={q.answer || ""}
                        onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "answer", e.target.value)}
                      />
                    )}

                    {(q.type === "MCQ" || q.type === "True/False") && q.type !== "Multi MCQ" && (
                      <select className="border rounded p-2 w-full mt-1" value={q.answer} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "answer", e.target.value)}>
                        <option value="">Select Correct Answer</option>
                        {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    <textarea
                      placeholder="Explanation (Optional)"
                      className="border rounded p-2 w-full resize-none mt-1"
                      value={q.explanation || ""}
                      onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "explanation", e.target.value)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
