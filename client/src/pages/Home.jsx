import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex flex-col justify-center items-center text-center px-4">
      {/* Main Heading */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
        AI Quiz Builder
      </h1>

      {/* Subheading */}
      <p className="text-lg md:text-2xl text-purple-100 mb-8 max-w-2xl">
        Generate high-quality quizzes instantly using AI. Save, edit, and share quizzes effortlessly.
      </p>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => navigate("/register")}
          className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-100 transition"
        >
          Get Started
        </button>

        <button
          onClick={() => navigate("/login")}
          className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-purple-800 transition"
        >
          Login
        </button>
      </div>

      {/* Optional Image / Illustration */}
      <div className="mt-12">
  <img
    src="logoOrg.png"
    alt="AI quiz illustration"
    className="h-24 w-25 rounded-full shadow-lg object-cover"
  />
</div>

    </div>
  );
}
