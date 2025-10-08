import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuizAnalytics } from "../services/api";
import dayjs from "dayjs";

export default function Analytics() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetchQuizAnalytics(quizId);
        const data = res.data || [];

        // Sort by createdAt descending
        const sortedSessions = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Convert scorePercent to number
        const formatted = sortedSessions.map((s) => ({
          ...s,
          attempts: s.attempts.map((a) => ({
            ...a,
            scorePercent: parseFloat(a.scorePercent),
          })),
        }));

        setSessions(formatted);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [quizId]);

  if (loading)
    return (
      <div className="p-6 text-center text-purple-400 animate-pulse">
        Loading analytics...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-500 font-medium">{error}</div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 flex items-center text-purple-700 font-semibold hover:text-purple-900"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8 text-center text-purple-700">
        Quiz Analytics
      </h1>

      {sessions.length === 0 ? (
        <p className="text-center text-gray-500">No attempts found.</p>
      ) : (
        sessions.map((session, idx) => (
          <div
            key={session.sessionId}
            className="bg-white rounded-3xl shadow-lg mb-6 overflow-hidden border border-purple-200"
          >
            <div className="bg-purple-50 px-5 py-4 flex justify-between items-center border-b border-purple-100">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-800 truncate">
                Session #{sessions.length - idx} -{" "}
                {dayjs(session.createdAt).format("DD MMM YYYY, h:mm A")}
              </h2>
              <span className="text-sm text-purple-600 font-medium">
                {session.attempts.length} attempt
                {session.attempts.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm sm:text-base">
                <thead className="bg-purple-100 text-purple-700">
                  <tr>
                    <th className="py-3 px-4 text-left">User</th>
                    <th className="py-3 px-4 text-left">Score (%)</th>
                    <th className="py-3 px-4 text-left">Correct</th>
                    <th className="py-3 px-4 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {session.attempts.map((a, idx) => (
                    <tr
                      key={idx}
                      className="border-b last:border-none hover:bg-purple-50 transition-colors"
                    >
                      <td className="py-2 px-4 font-medium text-purple-800 truncate">
                        {a.userName}
                      </td>
                      <td
                        className={`py-2 px-4 font-semibold ${
                          a.scorePercent >= 70
                            ? "text-green-600"
                            : a.scorePercent >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {a.scorePercent.toFixed(1)}%
                      </td>
                      <td className="py-2 px-4">{a.correct}</td>
                      <td className="py-2 px-4">{a.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
