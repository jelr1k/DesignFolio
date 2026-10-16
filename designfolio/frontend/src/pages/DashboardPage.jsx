import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState, ErrorNotice, PageHeading, SiteLayout, WorkCard, WorkSkeletonGrid, useCurrentUser } from "../components/SiteLayout";

function DashboardSidebar({ active = "overview" }) {
  return (
    <aside className="df-dashboard-sidebar">
      <p className="df-eyebrow">WORKSPACE</p>
      <h2>Мой кабинет</h2>
      <nav aria-label="Навигация кабинета">
        <Link className={active === "overview" ? "is-active" : ""} to="/dashboard"><span>◫</span> Обзор</Link>
        <Link className={active === "works" ? "is-active" : ""} to="/dashboard"><span>▧</span> Мои работы</Link>
        <Link className={active === "new" ? "is-active" : ""} to="/dashboard/works/new"><span>＋</span> Добавить работу</Link>
        <Link className={active === "profile" ? "is-active" : ""} to="/dashboard/profile"><span>◎</span> Настройки профиля</Link>
      </nav>
      <Link className="df-sidebar-back" to="/">← На сайт</Link>
    </aside>
  );
}

function getRestrictedPage({ user, loading, error }) {
  if (loading) return <SiteLayout><div className="df-loading-state">Проверяем сессию…</div></SiteLayout>;
  if (!user) return (
    <SiteLayout>
      <EmptyState title="Войди в аккаунт" description={error || "Личный кабинет доступен после входа."} action={<Link className="df-button df-button--primary" to="/login">Войти</Link>} />
    </SiteLayout>
  );
  return null;
}

export function DashboardPage() {
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const [works, setWorks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return () => { active = false; };
    }
    Promise.all([
      api("/api/me/works"),
      api("/api/me/favorites").catch(() => [])
    ]).then(([myWorks, saved]) => {
      if (!active) return;
      setWorks(myWorks || []);
      setFavorites(saved || []);
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Не удалось загрузить кабинет.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const blocked = getRestrictedPage({ user, loading: userLoading, error: userError });
  if (blocked) return blocked;

  return (
    <SiteLayout wide className="df-main--dashboard">
      <div className="df-dashboard-layout">
        <DashboardSidebar active="overview" />
        <div className="df-dashboard-content">
          <div className="df-dashboard-greeting">
            <div>
              <p className="df-eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</p>
              <h1>Привет, {user.username}</h1>
              <p>Управляй работами и следи за своим портфолио.</p>
            </div>
            <Link className="df-button df-button--primary" to="/dashboard/works/new">＋ Добавить работу</Link>
          </div>

          <div className="df-metric-grid df-metric-grid--dashboard">
            <article className="df-metric-card df-metric-card--coral"><span>01 / РАБОТЫ</span><strong>{loading ? "—" : works.length}</strong><p>Опубликовано в каталоге</p></article>
            <article className="df-metric-card"><span>02 / ИЗБРАННОЕ</span><strong>{loading ? "—" : favorites.length}</strong><p>Сохранённые проекты</p></article>
          </div>

          <div className="df-section-title-row">
            <div><p className="df-eyebrow">ТВОЁ ПОРТФОЛИО</p><h2>Последние работы</h2></div>
            <Link className="df-text-link" to="/works">Открыть каталог ↗</Link>
          </div>
          <ErrorNotice>{error}</ErrorNotice>
          {loading ? (
            <WorkSkeletonGrid count={3} />
          ) : works.length === 0 ? (
            <EmptyState title="Твоё портфолио начинается здесь" description="Добавь первую работу, чтобы она появилась в каталоге DesignFolio." action={<Link className="df-button df-button--primary" to="/dashboard/works/new">Добавить первую работу</Link>} />
          ) : (
            <div className="df-work-grid">
              {works.map((work, index) => <WorkCard key={work.id} work={work} index={index} />)}
            </div>
          )}

          {user.role === "admin" && <div className="df-admin-shortcut"><span>Доступ администратора</span><Link className="df-button df-button--secondary" to="/admin">Открыть админ-панель ↗</Link></div>}
        </div>
      </div>
    </SiteLayout>
  );
}

export function ProfileSettingsPage() {
  const { user, setUser, loading, error: sessionError } = useCurrentUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!user) return;
    setUsername(user.username || "");
    setEmail(user.email || "");
    setBio(user.bio || "");
    setAvatarUrl(user.avatar_url || "");
  }, [user]);

  const blocked = getRestrictedPage({ user, loading, error: sessionError });
  if (blocked) return blocked;

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setMessage("");
    try {
      const updated = await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null
        })
      });
      setUser(updated);
      setMessage("Профиль сохранён.");
    } catch (requestError) {
      setFormError(requestError.message || "Не удалось сохранить профиль.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SiteLayout wide className="df-main--dashboard">
      <div className="df-dashboard-layout">
        <DashboardSidebar active="profile" />
        <section className="df-dashboard-content">
          <p className="df-eyebrow">АККАУНТ / 01</p>
          <PageHeading title="Настройки профиля" description="Обнови публичную информацию и контакты, которые увидят посетители твоего портфолио." />
          <form className="df-settings-card" onSubmit={saveProfile}>
            <div className="df-settings-avatar">{(username || "DF").slice(0, 2).toUpperCase()}</div>
            <div className="df-settings-fields">
              <label className="df-field"><span>Имя пользователя</span><input required minLength={3} maxLength={50} value={username} onChange={(event) => setUsername(event.target.value)} /></label>
              <label className="df-field"><span>E-mail для связи</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="df-field"><span>Ссылка на аватар</span><input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." /></label>
              <label className="df-field"><span>О себе</span><textarea rows={5} maxLength={1200} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Направление, интересы и чем занимаешься…" /></label>
              <label className="df-field"><span>Роль</span><input value={user.role || "viewer"} readOnly /></label>
            </div>
            {formError && <ErrorNotice>{formError}</ErrorNotice>}
            {message && <div className="df-notice df-notice--info" role="status">{message}</div>}
            <div className="df-editor-actions">
              <button className="df-button df-button--primary" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить профиль"}</button>
              <Link className="df-button df-button--secondary" to="/dashboard">Вернуться в кабинет</Link>
            </div>
          </form>
        </section>
      </div>
    </SiteLayout>
  );
}
