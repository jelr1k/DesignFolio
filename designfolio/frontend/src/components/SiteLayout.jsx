import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API, api } from "../api/client";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("designfolio_token")) {
      setLoading(false);
      return () => { active = false; };
    }
    api("/api/auth/me")
      .then((current) => { if (active) setUser(current); })
      .catch((requestError) => {
        localStorage.removeItem("designfolio_token");
        if (active) {
          setUser(null);
          setError(requestError.message || "Сессия завершилась");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { user, setUser, loading, error };
}

function initials(value) {
  return (value || "DF").trim().split(/[\s._-]+/).slice(0, 2)
    .map((part) => part[0] || "").join("").toUpperCase();
}

function publicImageUrl(value) {
  if (!value) return "";
  return value.startsWith("http") ? value : API + (value.startsWith("/") ? "" : "/") + value;
}

export function SiteHeader() {
  const { user, setUser } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    localStorage.removeItem("designfolio_token");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  }

  function submitSearch(event) {
    event.preventDefault();
    navigate("/works" + (query.trim() ? "?q=" + encodeURIComponent(query.trim()) : ""));
    setMenuOpen(false);
  }

  const activePath = location.pathname;
  return (
    <header className="df-header">
      <Link className="df-brand" to="/" aria-label="DesignFolio — главная">
        <span className="df-brand-mark" aria-hidden="true">D</span>
        <span>DesignFolio</span>
      </Link>

      <button
        className="df-menu-toggle"
        type="button"
        aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span /><span />
      </button>

      <nav className={"df-nav" + (menuOpen ? " is-open" : "")} aria-label="Основная навигация">
        <Link className={activePath.startsWith("/works") ? "is-active" : ""} to="/works" onClick={() => setMenuOpen(false)}>Работы</Link>
        <Link className={activePath.startsWith("/designers") ? "is-active" : ""} to="/designers" onClick={() => setMenuOpen(false)}>Дизайнеры</Link>
        <Link className={activePath === "/contacts" ? "is-active" : ""} to="/contacts" onClick={() => setMenuOpen(false)}>Контакты</Link>
        <Link to="/#community" onClick={() => setMenuOpen(false)}>О платформе</Link>
        {user && <Link className={activePath.startsWith("/dashboard") ? "is-active" : ""} to="/dashboard" onClick={() => setMenuOpen(false)}>Кабинет</Link>}
        {user?.role === "admin" && <Link to="/admin" onClick={() => setMenuOpen(false)}>Админка</Link>}
      </nav>

      <form className="df-search" role="search" onSubmit={submitSearch}>
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="Поиск работ"
          placeholder="Поиск работ"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>

      <div className="df-account">
        {user ? (
          <>
            <Link className="df-account-user" to="/dashboard" title="Открыть кабинет">
              <span className="df-avatar">{initials(user.username)}</span>
              <span className="df-account-name">{user.username}</span>
            </Link>
            <button className="df-quiet-button" type="button" onClick={logout}>Выйти</button>
          </>
        ) : (
          <>
            <Link className="df-login-link" to="/login">Войти</Link>
            <Link className="df-button df-button--primary df-header-register" to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="df-footer">
      <div className="df-footer-brand">
        <Link className="df-brand" to="/">
          <span className="df-brand-mark" aria-hidden="true">D</span>
          <span>DesignFolio</span>
        </Link>
        <p>Платформа портфолио студентов-дизайнеров.</p>
      </div>
      <nav aria-label="Навигация в подвале">
        <Link to="/works">Работы</Link>
        <Link to="/designers">Дизайнеры</Link>
        <Link to="/#community">О платформе</Link>
        <Link to="/contacts">Контакты</Link>
      </nav>
      <span className="df-copyright">© 2026 DesignFolio</span>
    </footer>
  );
}

export function SiteLayout({ children, wide = false, className = "" }) {
  return (
    <div className="df-site">
      <SiteHeader />
      <main className={"df-main" + (wide ? " df-main--wide" : "") + (className ? " " + className : "")}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="df-breadcrumbs" aria-label="Хлебные крошки">
      <Link to="/">Главная</Link>
      {items.map((item, index) => (
        <span key={item.label + index}>
          <span className="df-breadcrumb-separator">/</span>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="df-page-heading">
      <div>
        {eyebrow && <p className="df-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="df-page-description">{description}</p>}
      </div>
      {action && <div className="df-heading-action">{action}</div>}
    </div>
  );
}

export function WorkCard({ work, index = 0, categoryName = "Работа" }) {
  const source = work?.cover_url || work?.image_url;
  const imageUrl = publicImageUrl(source);
  const authorName = work?.author?.username || "Автор портфолио";
  const authorAvatar = publicImageUrl(work?.author?.avatar_url);
  return (
    <Link className="df-work-card" to={"/works/" + work.id}>
      <div className={"df-work-art df-work-art--" + (index % 6)}>
        {imageUrl ? (
          <img src={imageUrl} alt={work.title || "Обложка проекта"} loading="lazy" />
        ) : (
          <div className="df-work-art-placeholder" aria-hidden="true">
            <span className="df-art-shape df-art-shape--back" />
            <span className="df-art-shape df-art-shape--front" />
            <span className="df-art-grid" />
            <span className="df-art-word">{categoryName}</span>
          </div>
        )}
        <span className="df-work-badge">{categoryName}</span>
      </div>
      <div className="df-work-card-body">
        <div className="df-work-card-topline">
          <span className="df-work-category">{categoryName}</span>
          <span className="df-work-arrow" aria-hidden="true">↗</span>
        </div>
        <h3>{work.title || "Без названия"}</h3>
        <div className="df-work-meta">
          <span className="df-work-author-meta">
            {authorAvatar
              ? <img src={authorAvatar} alt="" loading="lazy" />
              : <span className="df-work-author-initials">{initials(authorName)}</span>}
            <span className="df-work-author-name">{authorName}</span>
          </span>
          <span>DF / {String(work.id).padStart(3, "0")}</span>
        </div>
      </div>
    </Link>
  );
}

export function WorkSkeletonGrid({ count = 6 }) {
  return (
    <div className="df-work-grid df-skeleton-grid" aria-label="Загрузка работ" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="df-work-card df-work-card--skeleton" key={index}>
          <div className="df-work-art df-skeleton-block" />
          <div className="df-work-card-body">
            <div className="df-skeleton-line df-skeleton-line--short" />
            <div className="df-skeleton-line df-skeleton-line--title" />
            <div className="df-skeleton-line df-skeleton-line--meta" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <section className="df-empty-state">
      <span className="df-empty-mark" aria-hidden="true">✳</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}

export function ErrorNotice({ children }) {
  if (!children) return null;
  return <div className="df-notice df-notice--error" role="alert">{children}</div>;
}
