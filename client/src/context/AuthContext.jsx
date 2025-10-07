import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const BACKEND_API = import.meta.env.VITE_BACKEND_API;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from backend using JWT
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache', },
      });
      setUser(res.data.user);
    } catch (err) {
      console.error(err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${BACKEND_API}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    await fetchUser();
  };

  const register = async (name, email, password) => {
    const res = await axios.post(`${BACKEND_API}/auth/register`, { name, email, password });
    localStorage.setItem("token", res.data.token);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
