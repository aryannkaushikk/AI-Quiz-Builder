import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createQuiz,
  updateQuiz,
  getQuizById,
  generateAIQuiz as apiGenerateAIQuiz,
  convertQuizFile,
} from "../services/api";
import { QUESTION_TYPES, AI_QUESTION_NUM } from "../data/constants";

import AIQuizControls from "../components/AIQuizControls";
import AIReviewPanel from "../components/AIReviewPanel";
import EditableQuestions from "../components/EditableQuestions";
import ViewModeQuestions from "../components/ViewModeQuestions";

export default function QuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // --- Quiz state ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState(false);

  // --- AI / Converted questions state ---
  const [aiSource, setAiSource] = useState("");
  const [aiFile, setAiFile] = useState(null);
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState(["Intermediate"]);
  const [aiTypes, setAiTypes] = useState([...QUESTION_TYPES]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);

  // --- Load quiz ---
  useEffect(() => {
    if (!quizId) return;
    const loadQuiz = async () => {
      const cached = JSON.parse(localStorage.getItem("cachedQuizzes") || "[]");
      let quiz = cached.find((q) => q._id === quizId);

      if (!quiz) {
        try {
          quiz = await getQuizById(quizId);
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
          options:
            q.options || (q.type.includes("MCQ") ? ["", "", "", ""] : []),
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

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleQuestionChange = (list, setList, index, field, value) => {
    const newList = [...list];
    if (field === "type") {
      newList[index].type = value;
      switch (value) {
        case "MCQ":
          newList[index].options = ["", "", "", ""];
          newList[index].answer = "";
          break;
        case "Multi MCQ":
          newList[index].options = ["", "", "", ""];
          newList[index].answer = [];
          break;
        case "True/False":
          newList[index].options = ["True", "False"];
          newList[index].answer = "";
          break;
        default:
          newList[index].options = [];
          newList[index].answer = "";
      }
    } else newList[index][field] = value;
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

  // --- AI Question Review ---
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

  // --- Save Quiz ---
  const saveQuiz = async () => {
    if (!title.trim()) {
      return alert("Quiz must have a title.");
    }

    for (let q of questions) {
      if (!q.text.trim()) return alert("All questions must have text.");
      if (q.type.includes("MCQ") || q.type === "True/False") {
        if (q.options.some((o) => !o.trim()))
          return alert("All MCQ options must be filled.");
        if (q.type === "MCQ" && !q.answer)
          return alert("Select correct answer for MCQ.");
        if (
          q.type === "Multi MCQ" &&
          (!Array.isArray(q.answer) || q.answer.length === 0)
        )
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
        {/* Header */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate("/dashboard")}
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

        {/* AI Controls */}
        {!viewMode && (
          <AIQuizControls
            aiSource={aiSource}
            setAiSource={setAiSource}
            aiFile={aiFile}
            setAiFile={setAiFile}
            aiNumQuestions={aiNumQuestions}
            setAiNumQuestions={setAiNumQuestions}
            aiDifficulty={aiDifficulty}
            toggleAiDifficulty={toggleAiDifficulty}
            aiTypes={aiTypes}
            toggleAiType={toggleAiType}
            setAiQuestions={setAiQuestions} // review panel updates
            QUESTION_TYPES={QUESTION_TYPES}
            AI_QUESTION_NUM={AI_QUESTION_NUM}
          />
        )}

        {/* AI Review Panel */}
        {!viewMode && (
          <AIReviewPanel
            aiQuestions={aiQuestions}
            setAiQuestions={setAiQuestions}
            confirmAIQuestion={confirmAIQuestion}
            confirmAllAIQuestions={confirmAllAIQuestions}
            removeAIQuestion={removeAIQuestion}
          />
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

        {/* Questions */}
        {viewMode ? (
          <ViewModeQuestions questions={questions} />
        ) : (
          <EditableQuestions
            questions={questions}
            setQuestions={setQuestions}
            removeQuestion={removeQuestion}
            handleQuestionChange={handleQuestionChange}
            handleOptionChange={handleOptionChange}
            addOption={addOption}
          />
        )}

        {/* Footer Actions */}
        {!viewMode && (
          <div className="flex justify-between mt-4">
            <button
              onClick={addQuestion}
              className="bg-purple-700 text-white px-2 py-1 rounded-lg hover:bg-purple-800"
            >
              + Add Question
            </button>
            <div className="space-x-2">
              <button
                onClick={saveQuiz}
                className="bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gray-300 text-gray-800 px-2 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
