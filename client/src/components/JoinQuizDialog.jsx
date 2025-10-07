import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function JoinQuizDialog({ onClose }) {
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();
  const { token } = useAuth(); // assuming your AuthContext provides JWT token

  const handleStart = async () => {
    if (!sessionId.trim()) return alert("Enter a Quiz ID.");

    try {
      const res = await fetch(`${process.env.BACKEND_API}/takequiz/${sessionId}/check`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Cannot start quiz.");
      }

      if (!data.allowed) {
        return alert(data.message || "You cannot attempt this quiz anymore.");
      }

      navigate(`/take/${sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Error checking quiz eligibility.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold text-lg"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-purple-700">Join a Quiz</h2>

        <input
          type="text"
          placeholder="Enter Quiz ID"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full border rounded p-2"
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleStart}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
