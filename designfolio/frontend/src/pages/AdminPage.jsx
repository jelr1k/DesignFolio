import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState, ErrorNotice, PageHeading, SiteLayout, useCurrentUser } from "../components/SiteLayout";

function AdminFrame({ active, user, children }) {
  if (user?.role !== "admin") {
    return (
      <SiteLayout>
        <EmptyState title="Нет доступа" description="Административные разделы доступны только аккаунтам с ролью admin." action={<Link className="df-button df-button--secondary" to="/">На главную</Link>} />
      </SiteLayout>
    );
  }
  return (
    <SiteLayout wide>
      <div className="df-admin-layout">
        <aside className="df-admin-sidebar">
          <p className="df-eyebrow">CONTROL ROOM</p>
          <h2>Администрирование</h2>
          <nav>
            <Link className={active === "overview" ? "is-active" : ""} to="/admin">Обзор</Link>
            <Link className={active === "works" ? "is-active" : ""} to="/admin/works">Все работы</Link>
            <Link className={active === "users" ? "is-active" : ""} to="/admin/users">Пользователи</Link>
          </nav>
          <Link className="df-sidebar-back" to="/dashboard">← В кабинет</Link>
        </aside>
        <div className="df-admin-content">{children}</div>
      </div>
    </SiteLayout>
  );
}

export function AdminPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user || user.role !== "admin") { setLoading(false); return () => { active = false; }; }
    Promise.all([api("/api/works?page=1&limit=100"), api("/api/categories")])
      .then(([result, categoryList]) => {
        if (!active) return;
        setWorks(result.items || []);
        setCategories(categoryList || []);
      })
      .catch((requestError) => { if (active) setError(requestError.message || "Не удалось загрузить статистику."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  if (userLoading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;

  return (
    <AdminFrame active="overview" user={user}>
      <PageHeading eyebrow="ADMIN / OVERVIEW" title="Панель управления" description="Сводка по опубликованным работам и направлениям." />
      <ErrorNotice>{error}</ErrorNotice>
      <div className="df-metric-grid">
        <article className="df-metric-card df-metric-card--coral"><span>01 / КАТАЛОГ</span><strong>{loading ? "—" : works.length}</strong><p>Работ в загруженной выборке</p></article>
        <article className="df-metric-card"><span>02 / НАПРАВЛЕНИЯ</span><strong>{loading ? "—" : categories.length}</strong><p>Категорий каталога</p></article>
        <article className="df-metric-card"><span>03 / ДАННЫЕ</span><strong>API</strong><p>Статистика подключена к серверу</p></article>
      </div>
      <div className="df-admin-actions">
        <Link className="df-admin-action-card" to="/admin/works"><span>01</span><strong>Управление работами</strong><p>Поиск по каталогу и переход к публикациям.</p><b>Открыть →</b></Link>
        <Link className="df-admin-action-card" to="/admin/users"><span>02</span><strong>Пользователи</strong><p>Раздел для списка аккаунтов и управления доступом.</p><b>Открыть →</b></Link>
      </div>
    </AdminFrame>
  );
}

export function AdminWorksPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [works, setWorks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user || user.role !== "admin") { setLoading(false); return () => { active = false; }; }
    api("/api/works?page=1&limit=100&search=" + encodeURIComponent(query.trim()))
      .then((result) => { if (active) setWorks(result.items || []); })
      .catch((requestError) => { if (active) setError(requestError.message || "Не удалось загрузить каталог."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, query]);

  if (userLoading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;
  return (
    <AdminFrame active="works" user={user}>
      <PageHeading eyebrow="ADMIN / WORKS" title="Все работы" description="Поиск публикаций и переход к странице каждой работы." />
      <label className="df-search-field df-admin-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию" /></label>
      <ErrorNotice>{error}</ErrorNotice>
      {loading ? <div className="df-loading-state">Загружаем каталог…</div> : works.length === 0 ? (
        <EmptyState title="Работы не найдены" description="Измени поисковый запрос и попробуй ещё раз." />
      ) : (
        <div className="df-table-wrap">
          <table className="df-table">
            <thead><tr><th>ID</th><th>Работа</th><th>Автор</th><th>Категория ID</th><th>Переход</th></tr></thead>
            <tbody>{works.map((work) => (
              <tr key={work.id}>
                <td>#{work.id}</td>
                <td><strong>{work.title}</strong><small>{(work.description || "").slice(0, 90)}</small></td>
                <td>#{work.author_id}</td>
                <td>{work.category_id}</td>
                <td><Link className="df-table-link" to={"/works/" + work.id}>Открыть ↗</Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AdminFrame>
  );
}

export function AdminUsersPage() {
  const { user, loading } = useCurrentUser();
  if (loading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;
  return (
    <AdminFrame active="users" user={user}>
      <PageHeading eyebrow="ADMIN / USERS" title="Пользователи" description="Раздел подготовлен для таблицы аккаунтов, статусов и блокировки." />
      <EmptyState
        title="Требуется endpoint пользователей"
        description="Серверный API пока не предоставляет список аккаунтов и операции блокировки. Не подставляю фиктивных пользователей; экран готов принять реальные данные после добавления этих методов."
      />
    </AdminFrame>
  );
}
