import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6">
        <h2 className="text-3xl font-bold text-purple-700 text-center">Login</h2>

        <input type="email" placeholder="Email"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-400 outline-none"
          value={email} onChange={(e) => setEmail(e.target.value)} required />

        <input type="password" placeholder="Password"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-400 outline-none"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit" disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white ${loading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"} transition`}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-gray-600">
          Not a user?{" "}
          <button type="button" className="text-purple-700 hover:underline" onClick={() => navigate("/register")}>Register</button>
        </p>
      </form>
    </div>
  );
}
