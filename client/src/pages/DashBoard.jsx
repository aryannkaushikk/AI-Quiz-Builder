import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserQuizzes, deleteQuiz } from "../services/api";
import HostQuizDialog from "../components/HostQuizDialog";
import JoinQuizDialog from "../components/JoinQuizDialog";

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [hostQuizId, setHostQuizId] = useState(null);
  const [takeQuizOpen, setTakeQuizOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const loadQuizzes = async () => {
    try {
      const data = await getUserQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
      localStorage.setItem("cachedQuizzes", JSON.stringify(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error loading quizzes:", err);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem("cachedQuizzes");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setQuizzes(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Failed to parse cached quizzes:", err);
        localStorage.removeItem("cachedQuizzes");
      }
    }
    loadQuizzes();
  }, []);

  const handleDelete = async (quizId) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      await deleteQuiz(quizId);
      loadQuizzes();
    }
  };

  return (
    <div className="min-h-screen bg-purple-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-2 sm:space-y-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-purple-700 text-center sm:text-left">
          Your Quizzes
        </h1>
        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate("/editor")}
            className="flex justify-center w-10 h-10 text-3xl font-bold rounded-full bg-purple-700 text-white hover:bg-purple-800"
          >
            +
          </button>
          <button
            onClick={() => setTakeQuizOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Take Quiz
          </button>
          <button
            onClick={logout}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length === 0 ? (
          <p className="text-gray-600 col-span-full text-center">
            No quizzes yet. Create one!
          </p>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between h-full"
            >
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 truncate">
                {quiz.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {Array.isArray(quiz.questions) ? quiz.questions.length : 0} Questions
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/editor/${quiz._id}`)}
                  className="flex-1 bg-purple-700 text-white px-3 py-1 rounded hover:bg-purple-800 text-sm text-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(quiz._id)}
                  className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm text-center"
                >
                  Delete
                </button>
                <button
                  onClick={() => setHostQuizId(quiz._id)}
                  className="flex-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm text-center"
                >
                  Host
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Host Dialog */}
      {hostQuizId && (
        <HostQuizDialog
          quizId={hostQuizId}
          onClose={() => setHostQuizId(null)}
          onHosted={loadQuizzes}
        />
      )}

      {/* Join Quiz Dialog */}
      {takeQuizOpen && <JoinQuizDialog onClose={() => setTakeQuizOpen(false)} />}
    </div>
  );
}
