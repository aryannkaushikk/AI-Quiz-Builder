import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>; // optional spinner

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
