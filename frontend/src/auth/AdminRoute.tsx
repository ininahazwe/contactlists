import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Admin-only section. The API enforces the same rule on every route it
 * exposes: this guard only avoids showing a screen whose every call
 * would come back as 403.
 */
export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}
