import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      const backendError = err.response?.data?.error || err.response?.data?.message;
      const msg = backendError || err.message || "Registration failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center px-4">
      <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6">
        <h2 className="text-3xl font-bold text-purple-700 text-center">Register</h2>

        <input type="text" placeholder="Name"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-400 outline-none"
          value={name} onChange={(e) => setName(e.target.value)} required />

        <input type="email" placeholder="Email"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-400 outline-none"
          value={email} onChange={(e) => setEmail(e.target.value)} required />

        <input type="password" placeholder="Password"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-400 outline-none"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center ${
            loading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"
          } transition`}
        >
          {loading && <span className="loader"></span>}
          {loading ? "" : "Register"}
        </button>

        <p className="text-center text-gray-600">
          Already a user?{" "}
          <button type="button" className="text-purple-700 hover:underline" onClick={() => navigate("/login")}>Login</button>
        </p>
      </form>

      {/* Spinner CSS */}
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
      `}</style>
    </div>
  );
}
