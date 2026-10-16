import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ErrorNotice, SiteLayout } from "../components/SiteLayout";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password })
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(requestError.message || "Не удалось создать аккаунт.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout className="df-auth-main">
      <div className="df-auth-layout df-auth-layout--register">
        <aside className="df-auth-visual df-auth-visual--register">
          <p className="df-eyebrow">DESIGNFOLIO COMMUNITY</p>
          <div className="df-auth-art" aria-hidden="true"><span /><span /><span /></div>
          <div className="df-auth-visual-copy">
            <span className="df-auth-overline">ПОКАЖИ СВОЙ ВЗГЛЯД.</span>
            <h1>Твоя идея заслуживает быть увиденной.</h1>
            <p>Создай профиль и собирай работы в одном месте. Делись процессом и находи вдохновение в проектах других авторов.</p>
          </div>
          <span className="df-auth-index">DF / 02</span>
        </aside>

        <form className="df-auth-card" onSubmit={submit}>
          <div className="df-auth-card-heading">
            <p className="df-eyebrow">НАЧНИ СЕГОДНЯ</p>
            <h2>Создать аккаунт</h2>
            <p>Заполни данные, чтобы присоединиться к DesignFolio.</p>
          </div>
          <ErrorNotice>{error}</ErrorNotice>
          <label className="df-field">
            <span>Имя пользователя</span>
            <input required minLength={3} maxLength={50} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Как к тебе обращаться?" />
            <small>От 3 до 50 символов.</small>
          </label>
          <label className="df-field">
            <span>E-mail</span>
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </label>
          <label className="df-field">
            <span>Пароль</span>
            <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" />
          </label>
          <button className="df-button df-button--primary df-button--full" disabled={submitting}>
            {submitting ? "Создаём аккаунт…" : "Зарегистрироваться"}
            <span aria-hidden="true">↗</span>
          </button>
          <div className="df-auth-switch"><span>Уже есть аккаунт?</span><Link to="/login">Войти</Link></div>
          <p className="df-auth-legal">После регистрации можно войти и открыть личный кабинет. Роль аккаунта назначает сервер.</p>
        </form>
      </div>
    </SiteLayout>
  );
}
