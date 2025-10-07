import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createQuiz, updateQuiz, getQuizById } from "../services/api";
import { generateAIQuiz as apiGenerateAIQuiz } from "../services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const QUESTION_TYPES = ["MCQ", "True/False", "One Word"]; //"Multi MCQ", "Subjective"
const AI_QUESTION_NUM = Array.from({ length: 50 }, (_, i) => i + 1);

export default function QuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // Quiz state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState(false);

  // AI generation state
  const [aiSource, setAiSource] = useState("");
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState(["Intermediate"]);
  const [aiTypes, setAiTypes] = useState([...QUESTION_TYPES]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);

  // Load quiz
  useEffect(() => {
  if (!quizId) return;

  const loadQuiz = async () => {
    // Try from localStorage cache
    const cached = JSON.parse(localStorage.getItem("cachedQuizzes") || "[]");
    let quiz = cached.find((q) => q._id === quizId);

    // If not in cache, fetch from API
    if (!quiz) {
      try {
        quiz = await getQuizById(quizId);

        // Optionally update cache for future use
        if (quiz) {
          localStorage.setItem(
            "cachedQuizzes",
            JSON.stringify([...cached.filter((q) => q._id !== quizId), quiz])
          );
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
      }
    }

    if (quiz) {
      setTitle(quiz.title || "");
      setDescription(quiz.description || "");
      const normalizedQuestions = (quiz.questions || []).map((q) => ({
        ...q,
        answer:
          q.type === "Multi MCQ"
            ? Array.isArray(q.answer)
              ? q.answer
              : q.answer
              ? [q.answer]
              : []
            : q.answer || "",
      }));
      setQuestions(normalizedQuestions);
    }
  };

  loadQuiz();
}, [quizId]);


  // --- Question CRUD ---
  const addQuestion = () =>
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "MCQ",
        text: "",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
      },
    ]);

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (list, setList, index, field, value) => {
    const newList = [...list];
    if (field === "type") {
      newList[index].type = value;
      // Reset options & answers
      if (value === "MCQ") {
        newList[index].options = ["", "", "", ""];
        newList[index].answer = "";
      } else if (value === "Multi MCQ") {
        newList[index].options = ["", "", "", ""];
        newList[index].answer = [];
      } else if (value === "True/False") {
        newList[index].options = ["True", "False"];
        newList[index].answer = "";
      } else {
        newList[index].options = [];
        newList[index].answer = "";
      }
    } else {
      newList[index][field] = value;
    }
    setList(newList);
  };

  const handleOptionChange = (list, setList, qIndex, optIndex, value) => {
    const newList = [...list];
    newList[qIndex].options[optIndex] = value;
    setList(newList);
  };

  const addOption = (list, setList, qIndex) => {
    const newList = [...list];
    newList[qIndex].options.push("");
    setList(newList);
  };

  const toggleAiType = (type) =>
    setAiTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  const toggleAiDifficulty = (diff) =>
    setAiDifficulty((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );

  // --- AI Quiz Generation ---
  const generateAIQuiz = async () => {
    if (!aiSource) return alert("Please enter a topic or text.");
    if (!aiTypes.length) return alert("Select at least one question type.");
    if (!aiDifficulty.length) return alert("Select at least one difficulty.");

    setLoadingAI(true);
    setAiQuestions([]);

    try {
      const tempQuestionsRaw = await apiGenerateAIQuiz({
        source: aiSource,
        num_questions: aiNumQuestions,
        difficulties: aiDifficulty,
        question_types: aiTypes,
      });

      const tempQuestions = tempQuestionsRaw.map((q) => ({
        ...q,
        id: Date.now() + Math.random(),
        options: q.options || (q.type.includes("MCQ") ? ["", "", "", ""] : []),
        answer:
          q.type === "Multi MCQ"
            ? Array.isArray(q.answer)
              ? q.answer
              : q.answer
              ? [q.answer]
              : []
            : q.answer || "",
        explanation: q.explanation || "",
      }));

      setAiQuestions(tempQuestions);
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI quiz: " + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const confirmAIQuestion = (index) => {
    const q = aiQuestions[index];
    const normalized = {
      ...q,
      answer:
        q.type === "Multi MCQ"
          ? Array.isArray(q.answer)
            ? q.answer
            : [q.answer].filter(Boolean)
          : q.answer,
    };
    setQuestions((prev) => [...prev, normalized]);
    setAiQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmAllAIQuestions = () => {
    const normalized = aiQuestions.map((q) => ({
      ...q,
      answer:
        q.type === "Multi MCQ"
          ? Array.isArray(q.answer)
            ? q.answer
            : [q.answer].filter(Boolean)
          : q.answer,
    }));
    setQuestions((prev) => [...prev, ...normalized]);
    setAiQuestions([]);
  };

  const removeAIQuestion = (index) =>
    setAiQuestions((prev) => prev.filter((_, i) => i !== index));

  // --- Drag & Drop ---
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newQuestions = Array.from(questions);
    const [moved] = newQuestions.splice(result.source.index, 1);
    newQuestions.splice(result.destination.index, 0, moved);
    setQuestions(newQuestions);
  };

  // --- Save Quiz ---
  const saveQuiz = async () => {
    for (let q of questions) {
      if (!q.text.trim()) return alert("All questions must have text.");
      if (q.type.includes("MCQ") || q.type === "True/False") {
        if (q.options.some((o) => !o.trim()))
          return alert("All MCQ options must be filled.");
        if (q.type === "MCQ" && !q.answer)
          return alert("Select correct answer for MCQ.");
        if (q.type === "Multi MCQ" && (!Array.isArray(q.answer) || q.answer.length === 0))
          return alert("Select at least one correct answer for Multi MCQ.");
        for (let ans of Array.isArray(q.answer) ? q.answer : [q.answer]) {
          if (!q.options.includes(ans))
            return alert("Correct answers must match available options.");
        }
      }
    }

    const quizData = { title, description, questions };
    try {
      if (quizId) await updateQuiz(quizId, quizData);
      else await createQuiz(quizData);
      navigate("/dashboard");
    } catch (err) {
      alert("Error saving quiz: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Mode Toggle */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800"
          >
            Back
          </button>
          <button
            onClick={() => setViewMode(!viewMode)}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800"
          >
            {viewMode ? "Switch to Edit Mode" : "Switch to View Mode"}
          </button>
        </div>

        {/* AI Generation */}
        {!viewMode && (
          <div className="bg-purple-100 p-4 rounded-2xl mb-6 space-y-2">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">
              Generate AI Quiz
            </h2>
            <textarea
              placeholder="Enter a topic or text"
              className="border rounded-lg p-3 w-full mb-2 resize-none"
              value={aiSource}
              onChange={(e) => setAiSource(e.target.value)}
            />
            <div className="flex flex-wrap gap-4 items-center mb-2">
              <label className="flex items-center space-x-1">
                <span>Number:</span>
                <select
                  className="border rounded p-2 appearance-none"
                  value={aiNumQuestions}
                  onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                >
                  {AI_QUESTION_NUM.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2">Difficulty:</span>
                {["Beginner", "Intermediate", "Advanced"].map((diff) => (
                  <label key={diff} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={aiDifficulty.includes(diff)}
                      onChange={() => toggleAiDifficulty(diff)}
                      className="accent-purple-700"
                    />
                    <span>{diff}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2">Types:</span>
                {QUESTION_TYPES.map((type) => (
                  <label key={type} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={aiTypes.includes(type)}
                      onChange={() => toggleAiType(type)}
                      className="accent-purple-700"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={generateAIQuiz}
              disabled={loadingAI}
              className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 flex items-center justify-center"
            >
              {loadingAI && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {loadingAI ? "Generating..." : "Generate Quiz"}
            </button>
          </div>
        )}

        {/* AI Review */}
        {!viewMode && aiQuestions.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-2xl mb-6 space-y-2 max-h-96 overflow-y-auto relative">
            {/* Confirm All / Remove All */}
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

            <h3 className="font-semibold text-yellow-800 mb-2">
              AI-generated Questions
            </h3>
            {aiQuestions.map((q, idx) => (
              <div key={q.id} className="border rounded p-2 space-y-2">
                <select
                  className="border rounded p-1 w-full"
                  value={q.type}
                  onChange={(e) =>
                    handleQuestionChange(aiQuestions, setAiQuestions, idx, "type", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleQuestionChange(aiQuestions, setAiQuestions, idx, "text", e.target.value)
                  }
                />

                {(q.type.includes("MCQ") || q.type === "True/False") &&
                  q.options.map((opt, oIdx) => (
                    <input
                      key={oIdx}
                      type="text"
                      placeholder={`Option ${oIdx + 1}`}
                      className="border rounded p-1 w-full"
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(aiQuestions, setAiQuestions, idx, oIdx, e.target.value)
                      }
                    />
                  ))}

                {q.type === "Multi MCQ" && (
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
                            handleQuestionChange(aiQuestions, setAiQuestions, idx, "answer", newAnswer);
                          }}
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
                    onChange={(e) =>
                      handleQuestionChange(aiQuestions, setAiQuestions, idx, "answer", e.target.value)
                    }
                  />
                )}

                <textarea
                  placeholder="Explanation (Optional)"
                  className="border rounded p-1 w-full resize-none"
                  value={q.explanation || ""}
                  onChange={(e) =>
                    handleQuestionChange(aiQuestions, setAiQuestions, idx, "explanation", e.target.value)
                  }
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
        )}

        {/* Quiz Metadata */}
        <input
          type="text"
          placeholder="Quiz Title"
          className="border rounded-lg p-3 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={viewMode}
        />
        <textarea
          placeholder="Quiz Description"
          className="border rounded-lg p-3 w-full resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={viewMode}
        />

        {/* Questions Drag & Drop */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {questions.map((q, idx) => (
                  <Draggable key={q.id} draggableId={q.id.toString()} index={idx} isDragDisabled={viewMode}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-gray-50 p-4 rounded-2xl shadow space-y-2">
                        <div className="flex justify-between items-center">
                          <h2 className="font-semibold">Question {idx + 1}</h2>
                          {!viewMode && <button onClick={() => removeQuestion(idx)} className="text-red-500 hover:underline">Delete</button>}
                        </div>
                        {viewMode ? (
                          <>
                            <p className="font-medium">{q.text}</p>
                            {(q.type.includes("MCQ") || q.type === "True/False") && (
                              <ul className="list-disc pl-5 space-y-1">{q.options.map((opt, i) => <li key={i}>{opt}</li>)}</ul>
                            )}
                          </>
                        ) : (
                          <>
                            <select className="border rounded p-2 w-full" value={q.type} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "type", e.target.value)}>
                              {QUESTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <textarea placeholder="Question Text" className="border rounded p-2 w-full resize-none" value={q.text} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "text", e.target.value)} />

                            {(q.type.includes("MCQ") || q.type === "True/False") &&
                              q.options.map((opt, oIdx) => <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} className="border rounded p-2 w-full" value={opt} onChange={(e) => handleOptionChange(questions, setQuestions, idx, oIdx, e.target.value)} />)}

                            {q.type.includes("MCQ") && <button onClick={() => addOption(questions, setQuestions, idx)} className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">+ Add Option</button>}

                            {q.type === "Multi MCQ" && (
                              <div className="flex flex-wrap gap-2 mt-1">{q.options.map((opt, i) => (
                                <label key={i} className="flex items-center space-x-1">
                                  <input type="checkbox" checked={Array.isArray(q.answer) && q.answer.includes(opt)} onChange={() => {
                                    let newAnswer = Array.isArray(q.answer) ? [...q.answer] : [];
                                    newAnswer = newAnswer.includes(opt) ? newAnswer.filter((a) => a !== opt) : [...newAnswer, opt];
                                    handleQuestionChange(questions, setQuestions, idx, "answer", newAnswer);
                                  }} className="accent-purple-700" />
                                  <span>{opt}</span>
                                </label>
                              ))}</div>
                            )}

                            {(q.type === "One Word") && (
                              <input type="text" placeholder="Answer" className="border rounded p-2 w-full mt-1" value={q.answer || ""} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "answer", e.target.value)} />
                            )}

                            {(q.type === "MCQ" || q.type === "True/False") && q.type !== "Multi MCQ" && (
                              <select className="border rounded p-2 w-full mt-1" value={q.answer} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "answer", e.target.value)}>
                                <option value="">Select Correct Answer</option>
                                {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                              </select>
                            )}

                            <textarea placeholder="Explanation (Optional)" className="border rounded p-2 w-full resize-none mt-1" value={q.explanation || ""} onChange={(e) => handleQuestionChange(questions, setQuestions, idx, "explanation", e.target.value)} />
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {!viewMode && (
          <div className="flex justify-between mt-4">
            <button onClick={addQuestion} className="bg-purple-700 text-white px-2 py-1 rounded-lg hover:bg-purple-800">+ Add Question</button>
            <div className="space-x-2">
              <button onClick={saveQuiz} className="bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700">Save</button>
              <button onClick={() => navigate("/dashboard")} className="bg-gray-300 text-gray-800 px-2 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
