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
      <span className="df-not-found-code">404</span>
      <p className="df-eyebrow">НЕ ТОТ АДРЕС</p>
      <h1>Страница потерялась.</h1>
      <p>Такого маршрута пока нет. Вернись на главную или открой каталог работ.</p>
      <div className="df-not-found-actions">
        <Link className="df-button df-button--primary" to="/">На главную</Link>
        <Link className="df-button df-button--secondary" to="/works">Каталог работ</Link>
      </div>
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
