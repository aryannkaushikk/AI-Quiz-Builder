import { useState, useEffect } from "react";
import { hostQuiz, getActiveHostedQuiz, stopHostingQuiz } from "../services/api"; // updated service calls

export default function HostQuizDialog({ quizId, title, description, onClose, onHosted }) {
  const [timeLimit, setTimeLimit] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null); // hosted quiz info

  // Fetch active hosted session
  useEffect(() => {
  const fetchHosted = async () => {
    try {
      const hosted = await getActiveHostedQuiz(quizId); // returns active hosted quiz if exists
      
      // Only set session if hosted quiz exists
      if (hosted && hosted.status === 200) {
        const data = hosted.data; // actual quiz data from response
        setSession(data);
        setTimeLimit(data.timeLimit || "");
        setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "");
        setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.log("Hosted quiz not found, skipping session setup");
      } else {
        console.error(err);
      }
    }
  };

  fetchHosted();
}, [quizId]);


  const handleHost = async () => {
    setLoading(true);
    try {
      const hosted = await hostQuiz({
        quizId,
        title,
        description,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
      });

      if (hosted && hosted.status === 201) {
        const data = hosted.data; 
        setSession(data);
        setTimeLimit(data.timeLimit || "");
        setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "");
        setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "");
      }

      onHosted?.(); // refresh parent
    } catch (err) {
      alert("Error hosting quiz: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopHosting = async () => {
    if (!session) return;
    if (confirm("Stop hosting this quiz?")) {
      await stopHostingQuiz(session.sessionId);
      setSession(null);
      onHosted?.(); // refresh parent
    }
  };

  const copyToClipboard = () => {
    if (!session) return;
    const text = `${window.location.origin}/take/${session.sessionId}`;
    navigator.clipboard.writeText(text);
    alert("Copied link to clipboard!");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded-xl w-96 space-y-4">
        <h2 className="text-lg font-semibold">Host Quiz</h2>

        {!session ? (
          <>
            <label className="block text-sm font-medium">Time limit (minutes)</label>
            <input
              type="number"
              placeholder="Time limit (optional)"
              className="border p-2 rounded w-full"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />

            <label className="block text-sm font-medium">Start Time (optional)</label>
            <input
              type="datetime-local"
              className="border p-2 rounded w-full"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <label className="block text-sm font-medium">End Time (optional)</label>
            <input
              type="datetime-local"
              className="border p-2 rounded w-full"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />

            <button
              onClick={handleHost}
              disabled={loading}
              className="bg-purple-700 text-white px-4 py-2 rounded-lg w-full"
            >
              {loading ? "Hosting..." : "Host Quiz"}
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <p className="font-medium text-green-600">Quiz is live!</p>

            <p className="text-sm">Session Code:</p>
            <div className="p-2 bg-gray-100 rounded flex justify-between items-center">
              <span className="font-mono">{session.sessionId}</span>
              <button
                onClick={copyToClipboard}
                className="bg-purple-700 text-white px-2 py-1 rounded hover:bg-purple-800 text-sm"
              >
                Copy Link
              </button>
            </div>

            <p className="text-sm">Direct Link:</p>
            <a
              href={`/take/${session.sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-700 underline block"
            >
              {window.location.origin}/take/{session.sessionId}
            </a>

            <button
              onClick={handleStopHosting}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
            >
              Stop Hosting
            </button>
          </div>
        )}

        <button onClick={onClose} className="text-gray-600 hover:underline text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
