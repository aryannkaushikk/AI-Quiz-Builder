import React, { useState, useRef } from "react";
import { QUESTION_TYPES, AI_QUESTION_NUM } from "../data/constants";
import { generateAIQuiz as apiGenerateAIQuiz, convertQuizFile } from "../services/api";

export default function AIQuizControls({
  aiSource,
  setAiSource,
  aiFile,
  setAiFile,
  aiNumQuestions,
  setAiNumQuestions,
  aiDifficulty,
  toggleAiDifficulty,
  aiTypes,
  toggleAiType,
  setAiQuestions,
}) {
  const [loadingButton, setLoadingButton] = useState(null);
  const fileInputRef = useRef(null); // <--- ref for file input

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) return alert("File must be <= 10MB");
    setAiFile(file);
  };

  const resetFileInput = () => {
    setAiFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!aiSource.trim() && !aiFile) return alert("Please enter a topic/text or select a file.");
    if (!aiTypes.length) return alert("Select at least one question type.");
    if (!aiDifficulty.length) return alert("Select at least one difficulty.");

    setLoadingButton("generate");
    setAiQuestions([]);

    try {
      const tempQuestionsRaw = await apiGenerateAIQuiz({
        source: aiSource,
        file: aiFile,
        num_questions: aiNumQuestions,
        difficulties: aiDifficulty,
        question_types: aiTypes,
      });

      const tempQuestions = tempQuestionsRaw.map((q) => ({
        ...q,
        id: Date.now() + Math.random(),
        options: q.options || (q.type.includes("MCQ") ? ["", "", "", ""] : []),
        answer: q.type === "Multi MCQ" ? (Array.isArray(q.answer) ? q.answer : [q.answer].filter(Boolean)) : q.answer || "",
        explanation: q.explanation || "",
      }));

      setAiQuestions(tempQuestions);
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI quiz: " + err.message);
    } finally {
      setLoadingButton(null);
      resetFileInput(); // <--- reset after processing
    }
  };

  const handleConvert = async () => {
    if (!aiFile) return alert("Please select a file to convert.");

    setLoadingButton("convert");
    setAiQuestions([]);

    try {
      const converted = await convertQuizFile(aiFile);

      const normalized = converted.map((q) => ({
        ...q,
        id: Date.now() + Math.random(),
        options: q.options || (q.type.includes("MCQ") ? ["", "", "", ""] : []),
        answer: Array.isArray(q.answer) ? q.answer : q.answer || "",
        explanation: q.explanation || "",
      }));

      setAiQuestions(normalized);
    } catch (err) {
      console.error(err);
      alert("Failed to convert quiz: " + err.message);
    } finally {
      setLoadingButton(null);
      resetFileInput(); // <--- reset after processing
    }
  };

  return (
    <div className="bg-purple-100 p-4 rounded-2xl mb-6 space-y-2">
      <h2 className="text-lg font-semibold text-purple-700 mb-2">Generate / Convert Quiz</h2>

      <textarea
        placeholder="Enter a topic or text"
        className="border rounded-lg p-3 w-full mb-2 resize-none"
        value={aiSource}
        onChange={(e) => setAiSource(e.target.value)}
      />

      <label className="block bg-purple-200 hover:bg-purple-300 px-3 py-2 rounded-lg cursor-pointer w-max">
        {aiFile ? aiFile.name : "Choose File"}
        <input
          ref={fileInputRef}  // <--- attach ref here
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

<div className="flex flex-wrap gap-4 items-center mb-2">
        <label className="flex items-center space-x-1">
          <span>Number:</span>
          <select
            className="border rounded p-2 appearance-none"
            value={aiNumQuestions}
            onChange={(e) => setAiNumQuestions(Number(e.target.value))}
          >
            {AI_QUESTION_NUM.map((n) => <option key={n} value={n}>{n}</option>)}
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

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={loadingButton !== null}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 flex items-center justify-center"
        >
          {loadingButton === "generate" && <span className="loader"></span>}
          {loadingButton === "generate" ? "" : "Generate Quiz"}
        </button>
        <button
          onClick={handleConvert}
          disabled={loadingButton !== null}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center justify-center"
        >
          {loadingButton === "convert" && <span className="loader"></span>}
          {loadingButton === "convert" ? "" : "Convert Quiz"}
        </button>
      </div>

      {/* CSS Spinner */}
      <style>{`
        .loader {
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-right: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>    </div>
  );
}

