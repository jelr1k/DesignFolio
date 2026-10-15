import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ErrorNotice, SiteLayout } from "../components/SiteLayout";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const token = await api("/api/auth/login", {
        method: "POST",
        body: new URLSearchParams({ username: username.trim(), password })
      });
      localStorage.setItem("designfolio_token", token.access_token);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Не удалось войти. Проверь данные.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout className="df-auth-main">
      <div className="df-auth-layout">
        <aside className="df-auth-visual df-auth-visual--login">
          <p className="df-eyebrow">DESIGNFOLIO COMMUNITY</p>
          <div className="df-auth-art" aria-hidden="true"><span /><span /><span /></div>
          <div className="df-auth-visual-copy">
            <span className="df-auth-overline">ТВОИ ИДЕИ. ТВОЯ ИСТОРИЯ.</span>
            <h1>Работы говорят громче резюме.</h1>
            <p>Сохрани свои проекты, получай обратную связь и находи людей из мира дизайна.</p>
          </div>
          <span className="df-auth-index">DF / 01</span>
        </aside>

        <form className="df-auth-card" onSubmit={submit}>
          <div className="df-auth-card-heading">
            <p className="df-eyebrow">РАДЫ СНОВА ВИДЕТЬ</p>
            <h2>С возвращением</h2>
            <p>Войди, чтобы продолжить работу с портфолио.</p>
          </div>
          <ErrorNotice>{error}</ErrorNotice>
          <label className="df-field">
            <span>E-mail или имя пользователя</span>
            <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="name@example.com" />
          </label>
          <label className="df-field">
            <span>Пароль</span>
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Введи пароль" />
          </label>
          <button className="df-button df-button--primary df-button--full" disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
            <span aria-hidden="true">↗</span>
          </button>
          <div className="df-auth-switch"><span>Впервые здесь?</span><Link to="/register">Создать аккаунт</Link></div>
          <p className="df-auth-legal">Входя в систему, ты продолжаешь пользоваться DesignFolio в соответствии с правилами платформы.</p>
        </form>
      </div>
    </SiteLayout>
  );
}
