import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkQuizAttempt, getTakeQuiz, submitTakeQuiz } from "../services/api";

export default function TakeQuiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [adjustedEndTime, setAdjustedEndTime] = useState(null);

  const tickRef = useRef(null);
  const autosaveRef = useRef(null);

  // ===== Load quiz + check attempts =====
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const hostedQuiz = await getTakeQuiz(sessionId);
        const now = new Date();

        if (!hostedQuiz) {
          alert("Quiz not available or not active");
          navigate("/");
          return;
        }

        if (hostedQuiz.startTime && now < new Date(hostedQuiz.startTime)) {
          alert("Quiz has not started yet");
          navigate("/");
          return;
        }

        const adjEndTime = hostedQuiz.endTime
          ? new Date(new Date(hostedQuiz.endTime).getTime() - 2000)
          : null;
        setAdjustedEndTime(adjEndTime);

        if (adjEndTime && now > adjEndTime) {
          alert("Quiz has ended");
          navigate("/");
          return;
        }

        const check = await checkQuizAttempt(sessionId);
        if (!check.allowed) {
          alert(check.message || "You have exceeded maximum attempts.");
          navigate("/");
          return;
        }

        setQuiz(hostedQuiz);

        const saved = localStorage.getItem(`quiz-${sessionId}-answers`);
        setAnswers(saved ? JSON.parse(saved) : {});

        // Compute timeLeft: whichever hits first (timeLimit or endTime)
        let rawEnd = null;
        if (hostedQuiz.timeLimit && adjEndTime) {
          const limitEnd = new Date(now.getTime() + hostedQuiz.timeLimit * 60000);
          rawEnd = limitEnd < adjEndTime ? limitEnd : adjEndTime;
        } else if (hostedQuiz.timeLimit) {
          rawEnd = new Date(now.getTime() + hostedQuiz.timeLimit * 60000);
        } else if (adjEndTime) {
          rawEnd = adjEndTime;
        }

        if (rawEnd) {
          setTimeLeft(Math.floor((rawEnd - now) / 1000));
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load quiz.");
        navigate("/");
      }
    };

    fetchQuiz();
  }, [sessionId, navigate]);

  // ===== Timer + Auto-submit =====
  useEffect(() => {
    if (timeLeft === null || submitted) return;

    tickRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [timeLeft, submitted]);

  // ===== Auto-save answers locally =====
  useEffect(() => {
    if (submitted) return;

    autosaveRef.current = setInterval(() => {
      localStorage.setItem(`quiz-${sessionId}-answers`, JSON.stringify(answers));
    }, 4000);

    return () => clearInterval(autosaveRef.current);
  }, [answers, sessionId, submitted]);

  // ===== Change answer =====
  const handleChange = (qId, value, multiple = false) => {
    setAnswers((prev) => {
      if (multiple) {
        const prevArr = prev[qId] || [];
        if (prevArr.includes(value)) return { ...prev, [qId]: prevArr.filter((v) => v !== value) };
        return { ...prev, [qId]: [...prevArr, value] };
      }
      return { ...prev, [qId]: value };
    });
  };

  // ===== Submit quiz =====
  const handleSubmit = async (auto = false) => {
    if (!quiz || submitted || submitting) return;
    setSubmitting(true);
    clearInterval(tickRef.current);
    clearInterval(autosaveRef.current);

    try {
      const data = await submitTakeQuiz(sessionId, { answers });
      setResult(data);
      setSubmitted(true);
      localStorage.removeItem(`quiz-${sessionId}-answers`);
      if (auto) alert("Time’s up! Your quiz was auto-submitted.");
      else alert("Quiz submitted!");
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Formatters =====
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatEndTime = (time) => {
    if (!time) return "";
    const t = new Date(time);
    return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  if (loading)
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-purple-300">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-700"></div>
    </div>
  );

if (!quiz) return null;

return (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-200 flex flex-col">
    {/* Header */}
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-purple-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 text-center sm:text-left">
          {quiz.title}
        </h1>

        {(quiz.timeLimit || adjustedEndTime || timeLeft !== null) && (
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-3 sm:mt-0">
            {quiz.timeLimit && (
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                ⏱ {quiz.timeLimit} min
              </div>
            )}
            {adjustedEndTime && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium">
                🕒 Ends: {formatEndTime(adjustedEndTime)}
              </div>
            )}
            {timeLeft !== null && !submitted && (
              <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium">
                ⏱ Left: {formatTime(timeLeft)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Main Body */}
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <p className="text-center text-sm text-gray-500">Answers auto-saved</p>

        {/* Submitted Result */}
        {submitted && result ? (
          <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl shadow">
            <p className="text-2xl font-bold text-green-700 text-center mb-2">
              ✅ Quiz Submitted
            </p>
            <p className="text-center text-lg font-medium mb-6">
              Score: <span className="font-bold">{result.score}</span> / {result.total} (
              {result.correctCount} correct)
            </p>

            <div className="space-y-4">
              {result.details?.map((d, idx) => (
                <div
                  key={d.questionId}
                  className={`p-4 rounded-xl border-2 ${
                    d.correct
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <p className="font-medium mb-1">
                    {idx + 1}. {d.questionText}
                  </p>
                  <p>
                    Your Answer:{" "}
                    <span
                      className={d.correct ? "text-green-700" : "text-red-700"}
                    >
                      {Array.isArray(d.submittedAnswer)
                        ? d.submittedAnswer.join(", ")
                        : d.submittedAnswer || "N/A"}
                    </span>
                  </p>
                  {!d.correct && (
                    <p>
                      Correct Answer:{" "}
                      <span className="text-green-700">
                        {Array.isArray(d.correctAnswer)
                          ? d.correctAnswer.join(", ")
                          : d.correctAnswer || "N/A"}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate("/")}
                className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-lg font-medium shadow transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          /* Questions */
          quiz.questions.map((q, idx) => {
            const type = q.type.toLowerCase();
            return (
              <div
                key={q.id}
                className="p-5 bg-white rounded-2xl shadow-md border border-purple-100 space-y-3"
              >
                <p className="font-semibold text-purple-900">
                  {idx + 1}. {q.text}
                </p>

                {(type === "mcq" || type === "true/false") && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const multiple = type === "mcq" && q.multiple;
                      const isSelected = multiple
                        ? (answers[q.id] || []).includes(opt)
                        : answers[q.id] === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => handleChange(q.id, opt, multiple)}
                          className={`w-full text-left px-4 py-2 rounded-lg border flex justify-between items-center transition
                            ${
                              isSelected
                                ? "bg-purple-100 border-purple-500 text-purple-800"
                                : "border-gray-300 hover:bg-purple-50"
                            }`}
                        >
                          <span>{opt}</span>
                          {isSelected && (
                            <span className="text-purple-700 font-bold">✔</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {type === "one word" && (
                  <input
                    type="text"
                    className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-purple-400"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    placeholder="Type your answer"
                  />
                )}

                {type === "subjective" && (
                  <textarea
                    className="border p-2 rounded-lg w-full focus:ring-2 focus:ring-purple-400"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={4}
                    placeholder="Write your answer..."
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>

    {/* Submit Button */}
    {!submitted && (
      <div className="sticky bottom-0 z-20 bg-white/90 backdrop-blur-lg border-t border-purple-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold shadow transition
              ${
                submitting
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
              }`}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    )}
  </div>
);
}