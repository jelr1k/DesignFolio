import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { AdminCommentsPage, AdminPage, AdminUsersPage, AdminWorksPage } from "./pages/AdminPage";
import { CatalogPage } from "./pages/CatalogPage";
import { ContactsPage } from "./pages/ContactsPage";
import { DashboardPage, ProfileSettingsPage } from "./pages/DashboardPage";
import { DesignerProfilePage, DesignersPage } from "./pages/DesignersPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WorkEditorPage } from "./pages/WorkEditorPage";
import { WorkPage } from "./pages/WorkPage";
import { WorksCatalogPage } from "./pages/WorksCatalogPage";

function NotFoundPage() {
  return (
    <main className="df-not-found">
      <section className="df-not-found-panel">
        <div className="df-not-found-art" aria-hidden="true">
          <span className="df-not-found-orbit df-not-found-orbit--outer" />
          <span className="df-not-found-orbit df-not-found-orbit--inner" />
          <svg className="df-not-found-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="29" cy="35" r="20" />
            <path d="M37 27 31 41 20 30 37 27Z" />
            <path d="M42 10H55V23" />
            <path d="M55 10 42 23" />
          </svg>
        </div>
        <span className="df-not-found-code">404</span>
        <h1>Страница не найдена</h1>
        <div className="df-not-found-actions">
          <Link className="df-button df-button--primary" to="/">На главную</Link>
          <Link className="df-button df-button--secondary" to="/works">Каталог работ</Link>
        </div>
      </section>
    </main>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/works" element={<WorksCatalogPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/works/new" element={<WorkEditorPage />} />
        <Route path="/works/:id/edit" element={<WorkEditorPage />} />
        <Route path="/works/:id" element={<WorkPage />} />
        <Route path="/designers" element={<DesignersPage />} />
        <Route path="/designers/:username" element={<DesignerProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<ProfileSettingsPage />} />
        <Route path="/dashboard/works/new" element={<WorkEditorPage />} />
        <Route path="/dashboard/works/:id/edit" element={<WorkEditorPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/works" element={<AdminWorksPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/comments" element={<AdminCommentsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
