import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { EmptyState, ErrorNotice, PageHeading, SiteLayout, useCurrentUser } from "../components/SiteLayout";

function AdminFrame({ active, user, children }) {
  if (user?.role !== "admin") {
    return <SiteLayout><EmptyState title="Нет доступа" description="Административные разделы доступны только аккаунтам с ролью admin." action={<Link className="df-button df-button--secondary" to="/">На главную</Link>} /></SiteLayout>;
  }
  return (
    <SiteLayout wide>
      <div className="df-admin-layout">
        <aside className="df-admin-sidebar">
          <p className="df-eyebrow">CONTROL ROOM</p><h2>Администрирование</h2>
          <nav>
            <Link className={active === "overview" ? "is-active" : ""} to="/admin">Обзор</Link>
            <Link className={active === "works" ? "is-active" : ""} to="/admin/works">Работы</Link>
            <Link className={active === "comments" ? "is-active" : ""} to="/admin/comments">Комментарии</Link>
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (user?.role !== "admin") { setLoading(false); return () => { active = false; }; }
    api("/api/admin/stats")
      .then((value) => { if (active) setStats(value); })
      .catch((e) => { if (active) setError(e.message || "Не удалось загрузить статистику."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);
  if (userLoading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;
  const metric = (name) => loading ? "—" : (stats?.[name] ?? 0);
  return (
    <AdminFrame active="overview" user={user}>
      <PageHeading eyebrow="ADMIN / OVERVIEW" title="Панель управления" description="Статистика и быстрые действия модерации." />
      <ErrorNotice>{error}</ErrorNotice>
      <div className="df-metric-grid">
        <article className="df-metric-card df-metric-card--coral"><span>01 / РАБОТЫ</span><strong>{metric("works")}</strong><p>Опубликовано в каталоге</p></article>
        <article className="df-metric-card"><span>02 / ПОЛЬЗОВАТЕЛИ</span><strong>{metric("users")}</strong><p>Всего аккаунтов · дизайнеров {metric("designers")}</p></article>
        <article className="df-metric-card"><span>03 / АКТИВНОСТЬ</span><strong>{metric("comments")}</strong><p>Комментариев · лайков {metric("likes")}</p></article>
        <article className="df-metric-card"><span>04 / МОДЕРАЦИЯ</span><strong>{metric("hidden_works")}</strong><p>Скрытых работ · категорий {metric("categories")}</p></article>
      </div>
      <div className="df-admin-actions">
        <Link className="df-admin-action-card" to="/admin/works"><span>01</span><strong>Работы</strong><p>Искать публикации, скрывать и удалять работы.</p><b>Открыть →</b></Link>
        <Link className="df-admin-action-card" to="/admin/comments"><span>02</span><strong>Комментарии</strong><p>Скрывать спам и удалять неподходящие комментарии.</p><b>Открыть →</b></Link>
        <Link className="df-admin-action-card" to="/admin/users"><span>03</span><strong>Пользователи</strong><p>Управлять аккаунтами и блокировками.</p><b>Открыть →</b></Link>
      </div>
    </AdminFrame>
  );
}

export function AdminWorksPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    if (user?.role !== "admin") { setLoading(false); return () => { active = false; }; }
    setLoading(true); setError("");
    api("/api/admin/works?limit=100&sort=" + sort + "&search=" + encodeURIComponent(query.trim()))
      .then((data) => { if (active) setWorks(data.items || []); })
      .catch((e) => { if (active) setError(e.message || "Не удалось загрузить работы."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, query, sort, reloadKey]);
  async function toggleVisibility(work) {
    try {
      await api("/api/admin/works/" + work.id + "/visibility", { method: "PATCH", body: JSON.stringify({ is_hidden: !work.is_hidden }) });
      setReloadKey((value) => value + 1);
    } catch (e) { setError(e.message || "Не удалось изменить видимость работы."); }
  }
  async function removeWork(work) {
    if (!window.confirm("Удалить работу «" + work.title + "» вместе с комментариями и лайками?")) return;
    try {
      await api("/api/admin/works/" + work.id, { method: "DELETE" });
      setReloadKey((value) => value + 1);
    } catch (e) { setError(e.message || "Не удалось удалить работу."); }
  }
  if (userLoading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;
  return (
    <AdminFrame active="works" user={user}>
      <PageHeading eyebrow="ADMIN / WORKS" title="Модерация работ" description="Поиск, сортировка, скрытие публикаций и удаление контента." />
      <div className="df-catalog-toolbar">
        <label className="df-search-field"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Работа, описание или автор" /></label>
        <label className="df-sort-field"><span>Сортировка</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="title">По названию</option></select></label>
      </div>
      <ErrorNotice>{error}</ErrorNotice>
      {loading ? <div className="df-loading-state">Загружаем публикации…</div> : works.length === 0 ? <EmptyState title="Работы не найдены" description="Попробуй изменить поисковый запрос." /> : (
        <div className="df-table-wrap"><table className="df-table"><thead><tr><th>ID</th><th>Работа</th><th>Автор</th><th>Категория</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
          {works.map((work) => <tr key={work.id}>
            <td>#{work.id}</td><td><strong>{work.title}</strong><small>{(work.description || "").slice(0, 90)}</small></td>
            <td>{work.author_username}</td><td>{work.category_name}</td><td>{work.is_hidden ? "Скрыта" : "Опубликована"}</td>
            <td className="df-admin-row-actions"><Link className="df-table-link" to={"/works/" + work.id}>Открыть</Link><button type="button" className="df-text-button" onClick={() => toggleVisibility(work)}>{work.is_hidden ? "Показать" : "Скрыть"}</button><button type="button" className="df-text-button" onClick={() => removeWork(work)}>Удалить</button></td>
          </tr>)}
        </tbody></table></div>
      )}
    </AdminFrame>
  );
}

export function AdminCommentsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    if (user?.role !== "admin") { setLoading(false); return () => { active = false; }; }
    setLoading(true); setError("");
    api("/api/admin/comments?limit=100&search=" + encodeURIComponent(query.trim()))
      .then((data) => { if (active) setComments(data.items || []); })
      .catch((e) => { if (active) setError(e.message || "Не удалось загрузить комментарии."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, query, reloadKey]);
  async function toggleVisibility(comment) {
    try {
      await api("/api/admin/comments/" + comment.id + "/visibility", { method: "PATCH", body: JSON.stringify({ is_hidden: !comment.is_hidden }) });
      setReloadKey((value) => value + 1);
    } catch (e) { setError(e.message || "Не удалось изменить видимость комментария."); }
  }
  async function removeComment(comment) {
    if (!window.confirm("Удалить комментарий пользователя «" + comment.username + "»?")) return;
    try {
      await api("/api/admin/comments/" + comment.id, { method: "DELETE" });
      setReloadKey((value) => value + 1);
    } catch (e) { setError(e.message || "Не удалось удалить комментарий."); }
  }
  if (userLoading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;
  return (
    <AdminFrame active="comments" user={user}>
      <PageHeading eyebrow="ADMIN / COMMENTS" title="Модерация комментариев" description="Поиск, скрытие и удаление комментариев." />
      <label className="df-search-field df-admin-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Текст, автор или работа" /></label>
      <ErrorNotice>{error}</ErrorNotice>
      {loading ? <div className="df-loading-state">Загружаем комментарии…</div> : comments.length === 0 ? <EmptyState title="Комментариев пока нет" description="Когда появятся комментарии, ими можно будет управлять здесь." /> : (
        <div className="df-table-wrap"><table className="df-table"><thead><tr><th>ID</th><th>Комментарий</th><th>Работа</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
          {comments.map((comment) => <tr key={comment.id}><td>#{comment.id}</td><td><strong>{comment.username}</strong><small>{comment.content}</small></td>
            <td><Link className="df-table-link" to={"/works/" + comment.work_id}>{comment.work_title}</Link></td><td>{comment.is_hidden ? "Скрыт" : "Опубликован"}</td>
            <td className="df-admin-row-actions"><button type="button" className="df-text-button" onClick={() => toggleVisibility(comment)}>{comment.is_hidden ? "Показать" : "Скрыть"}</button><button type="button" className="df-text-button" onClick={() => removeComment(comment)}>Удалить</button></td>
          </tr>)}
        </tbody></table></div>
      )}
    </AdminFrame>
  );
}

export function AdminUsersPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    if (user?.role !== "admin") { setLoading(false); return () => { active = false; }; }
    setLoading(true); setError("");
    api("/api/admin/users?limit=100&search=" + encodeURIComponent(query.trim()))
      .then((data) => { if (active) setUsers(data.items || []); })
      .catch((e) => { if (active) setError(e.message || "Не удалось загрузить пользователей."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, query, reloadKey]);
  async function toggleBlock(account) {
    try {
      await api("/api/admin/users/" + account.id + "/block", { method: "PATCH", body: JSON.stringify({ is_blocked: !account.is_blocked }) });
      setReloadKey((value) => value + 1);
    } catch (e) { setError(e.message || "Не удалось изменить статус пользователя."); }
  }
  if (userLoading) return <SiteLayout><div className="df-loading-state">Проверяем права доступа…</div></SiteLayout>;
  return (
    <AdminFrame active="users" user={user}>
      <PageHeading eyebrow="ADMIN / USERS" title="Пользователи" description="Поиск по аккаунтам и блокировка доступа к сайту." />
      <label className="df-search-field df-admin-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя, e-mail или роль" /></label>
      <ErrorNotice>{error}</ErrorNotice>
      {loading ? <div className="df-loading-state">Загружаем пользователей…</div> : users.length === 0 ? <EmptyState title="Пользователи не найдены" /> : (
        <div className="df-table-wrap"><table className="df-table"><thead><tr><th>Пользователь</th><th>Роль</th><th>Работы</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
          {users.map((account) => <tr key={account.id}><td><strong>{account.username}</strong><small>{account.email}</small></td><td>{account.role}</td><td>{account.works_count}</td><td>{account.is_blocked ? "Заблокирован" : "Активен"}</td>
            <td>{account.role === "admin" ? "Администратор" : <button type="button" className="df-text-button" onClick={() => toggleBlock(account)}>{account.is_blocked ? "Разблокировать" : "Заблокировать"}</button>}</td>
          </tr>)}
        </tbody></table></div>
      )}
    </AdminFrame>
  );
}
