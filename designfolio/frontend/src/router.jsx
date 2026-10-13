import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { CatalogPage } from "./pages/CatalogPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WorkEditorPage } from "./pages/WorkEditorPage";
import { WorkPage } from "./pages/WorkPage";

function NotFoundPage() {
  return (
    <main className="form-page">
      <section className="form">
        <p className="eyebrow">404</p>
        <h1>Страница не найдена</h1>
        <p>Похоже, такой страницы в DesignFolio пока нет.</p>
        <Link to="/">Вернуться в каталог</Link>
      </section>
    </main>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/works/new" element={<WorkEditorPage />} />
        <Route path="/works/:id/edit" element={<WorkEditorPage />} />
        <Route path="/works/:id" element={<WorkPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
