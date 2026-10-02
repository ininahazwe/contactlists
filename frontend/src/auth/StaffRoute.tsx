import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Staff module: admin and editor, not read_only -- mirrors the backend's
 * requireRole("admin", "editor") on the whole /api/staff router (import
 * stays admin-only, guarded separately under AdminRoute).
 */
export function StaffRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "read_only") return <Navigate to="/" replace />;

  return <Outlet />;
}
