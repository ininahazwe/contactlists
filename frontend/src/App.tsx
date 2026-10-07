import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./auth/AdminRoute";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { StaffRoute } from "./auth/StaffRoute";
import Layout from "./components/Layout";
import AdminActivityPage from "./pages/AdminActivityPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import HomePage from "./pages/HomePage";
import ContactFormPage from "./pages/ContactFormPage";
import EventFormPage from "./pages/EventFormPage";
import ImportContactsPage from "./pages/ImportContactsPage";
import ImportStaffPage from "./pages/ImportStaffPage";
import LoginPage from "./pages/LoginPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import SearchPage from "./pages/SearchPage";
import StaffPage from "./pages/StaffPage";
import StaffFormPage from "./pages/StaffFormPage";
import StaffJobTitlesPage from "./pages/StaffJobTitlesPage";
import StaffSearchPage from "./pages/StaffSearchPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import KeyDocsPage from "./pages/KeyDocsPage";
import KeyDocsMembershipsPage from "./pages/KeyDocsMembershipsPage";
import KeyDocsDashboardPage from "./pages/KeyDocsDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/contacts" element={<SearchPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/contacts/new" element={<ContactFormPage />} />
              <Route path="/contacts/:id/edit" element={<ContactFormPage />} />
              <Route path="/contacts/import" element={<ImportContactsPage />} />
              <Route path="/events/new" element={<EventFormPage />} />

              <Route element={<StaffRoute />}>
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/staff/search" element={<StaffSearchPage />} />
                <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
                <Route path="/keydocs" element={<KeyDocsPage />} />
                <Route path="/keydocs/memberships" element={<KeyDocsMembershipsPage />} />
                <Route path="/keydocs/dashboard" element={<KeyDocsDashboardPage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/activity" element={<AdminActivityPage />} />
                <Route path="/staff/import" element={<ImportStaffPage />} />
                <Route path="/staff/job-titles" element={<StaffJobTitlesPage />} />
                <Route path="/staff/new" element={<StaffFormPage />} />
                <Route path="/staff/:id/edit" element={<StaffFormPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
