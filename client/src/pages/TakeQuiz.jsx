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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );

  if (!quiz) return null;

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 relative h-screen flex flex-col">
      {/* Autosave note */}
      <div className="text-sm text-gray-500 text-center">
        Answers are auto-saved
      </div>

      <div className="sticky top-0 bg-white z-10 pt-2 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">{quiz.title}</h1>

        {/* Time boxes */}
        {(quiz.timeLimit || adjustedEndTime) && (
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-2 sm:space-y-0 text-center mt-2">
            {quiz.timeLimit && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-semibold">
                ⏱ Time Limit: {quiz.timeLimit} min
              </div>
            )}
            {adjustedEndTime && (
              <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold">
                🕒 Ends At: {formatEndTime(adjustedEndTime)}
              </div>
            )}
            {timeLeft !== null && !submitted && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-semibold">
                ⏱ Time Remaining: {formatTime(timeLeft)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable questions */}
      <div className="flex-1 overflow-y-scroll space-y-4 pr-2 scrollbar-hide">
        {submitted && result ? (
          <div className="p-4 sm:p-6 bg-green-50 rounded-xl space-y-4">
            <p className="text-xl sm:text-2xl font-bold text-center text-green-700">
              ✅ Quiz Submitted Successfully!
            </p>
            <p className="text-lg text-center font-medium">
              Score: <span className="font-bold">{result.score}</span> / {result.total} (
              {result.correctCount} correct)
            </p>

            <div className="space-y-4">
              {result.details?.map((d, idx) => (
                <div
                  key={d.questionId}
                  className={`p-3 rounded-lg border ${
                    d.correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                  }`}
                >
                  <p className="font-medium">{idx + 1}. {d.questionText}</p>
                  <p>
                    Your Answer:{" "}
                    <span className={d.correct ? "text-green-700" : "text-red-700"}>
                      {Array.isArray(d.submittedAnswer) ? d.submittedAnswer.join(", ") : d.submittedAnswer || "N/A"}
                    </span>
                  </p>
                  {!d.correct && (
                    <p>
                      Correct Answer:{" "}
                      <span className="text-green-700">
                        {Array.isArray(d.correctAnswer) ? d.correctAnswer.join(", ") : d.correctAnswer || "N/A"}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate("/")}
                className="bg-purple-700 text-white px-4 py-2 rounded-lg mt-4 w-full sm:w-auto"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          quiz.questions.map((q, idx) => {
            const type = q.type.toLowerCase();
            return (
              <div key={q.id} className="p-4 sm:p-5 bg-white rounded-xl shadow space-y-2">
                <p className="font-medium text-base sm:text-lg">{idx + 1}. {q.text}</p>

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
                          className={`w-full text-left px-3 py-2 rounded-lg border flex justify-between items-center
                            ${isSelected ? "bg-purple-100 border-purple-500" : "border-gray-300"}
                            hover:bg-purple-50 transition`}
                        >
                          <span>{opt}</span>
                          {isSelected && <span className="text-purple-700 font-bold">✔</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {type === "one word" && (
                  <input
                    type="text"
                    className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    placeholder="Type your answer"
                  />
                )}

                {type === "subjective" && (
                  <textarea
                    className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={4}
                    placeholder="Write your answer here..."
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {!submitted && (
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className={`px-4 py-2 rounded-lg text-white w-full sm:w-auto ${
            submitting ? "bg-gray-500" : "bg-purple-700 hover:bg-purple-800"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </button>
      )}
    </div>
  );
}
