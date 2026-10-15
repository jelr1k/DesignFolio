import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API, api } from "../api/client";
import { Breadcrumbs, EmptyState, ErrorNotice, PageHeading, SiteLayout, WorkCard } from "../components/SiteLayout";

const palette = ["#FFBBC4", "#C6B5FF", "#FFD86D", "#8FD8CB", "#111318", "#F0F0EE"];

function authorLabel(id) {
  return "Автор #" + id;
}

export function DesignersPage() {
  const [works, setWorks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/works?page=1&limit=100&sort=newest")
      .then((result) => { if (active) setWorks(result.items || []); })
      .catch((requestError) => { if (active) setError(requestError.message || "Не удалось загрузить авторов."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const designers = useMemo(() => {
    const byAuthor = new Map();
    works.forEach((work) => {
      const key = String(work.author_id);
      const current = byAuthor.get(key) || { id: key, works: [], latest: work };
      current.works.push(work);
      byAuthor.set(key, current);
    });
    return Array.from(byAuthor.values()).sort((a, b) => b.works.length - a.works.length);
  }, [works]);

  const filtered = designers.filter((designer) => {
    const text = (authorLabel(designer.id) + " " + designer.works.map((work) => work.title).join(" ")).toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <SiteLayout>
      <Breadcrumbs items={[{ label: "Дизайнеры" }]} />
      <PageHeading
        eyebrow="СООБЩЕСТВО / 01"
        title="Дизайнеры"
        description="Авторы проектов и их работы в одном месте. Открой профиль, чтобы посмотреть портфолио."
      />

      <label className="df-search-field df-designer-search">
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по авторам и названиям работ" aria-label="Поиск дизайнеров" />
      </label>

      <div className="df-results-row">
        <p>{filtered.length} {filtered.length === 1 ? "автор" : "авторов"}</p>
        <span>Сначала авторы с большим количеством работ</span>
      </div>

      <ErrorNotice>{error}</ErrorNotice>
      {loading ? (
        <div className="df-loading-state">Ищем авторов<span>…</span></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Пока нет опубликованных авторов" description="Когда в каталоге появятся проекты, здесь соберутся их авторы." />
      ) : (
        <div className="df-designer-grid">
          {filtered.map((designer, index) => (
            <article className="df-designer-card" key={designer.id}>
              <div className="df-designer-card-top">
                <span className="df-designer-number">DF / {String(index + 1).padStart(2, "0")}</span>
                <span className="df-designer-orbit" style={{ background: palette[index % palette.length] }}>{String(designer.id).slice(-2).padStart(2, "0")}</span>
              </div>
              <h2>{authorLabel(designer.id)}</h2>
              <p className="df-designer-role">Автор портфолио</p>
              <div className="df-designer-stat"><strong>{designer.works.length}</strong><span>{designer.works.length === 1 ? "работа" : "работ(ы)"}</span></div>
              <div className="df-mini-work-list">
                {designer.works.slice(0, 2).map((work) => <span key={work.id}>{work.title}</span>)}
              </div>
              <Link className="df-button df-button--secondary df-button--full" to={"/designers/" + designer.id}>Открыть профиль <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      )}

      <p className="df-data-note">Публичный API сейчас отдаёт ID автора, но не имя и аватар. Поэтому до добавления такого endpoint в профилях используется номер автора, без выдуманных персональных данных.</p>
    </SiteLayout>
  );
}

export function DesignerProfilePage() {
  const { username } = useParams();
  const authorId = Number(String(username).replace(/^author-/, ""));
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/api/works?page=1&limit=100&sort=newest"),
      api("/api/categories")
    ]).then(([result, categoryList]) => {
      if (!active) return;
      setWorks((result.items || []).filter((work) => String(work.author_id) === String(authorId)));
      setCategories(categoryList || []);
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Не удалось загрузить профиль.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authorId]);

  const categoryNames = Object.fromEntries(categories.map((category) => [String(category.id), category.name]));
  const validId = Number.isInteger(authorId) && authorId > 0;

  return (
    <SiteLayout wide>
      <Breadcrumbs items={[{ label: "Дизайнеры", to: "/designers" }, { label: validId ? authorLabel(authorId) : "Профиль" }]} />
      {!validId ? (
        <EmptyState title="Профиль не найден" description="В текущем API публичные профили адресуются по ID автора." />
      ) : (
        <>
          <section className="df-profile-hero">
            <div className="df-profile-art" aria-hidden="true"><span /><span /><span /></div>
            <div className="df-profile-identity">
              <span className="df-profile-avatar">{String(authorId).slice(-2).padStart(2, "0")}</span>
              <div>
                <p className="df-eyebrow">ПОРТФОЛИО АВТОРА</p>
                <h1>{authorLabel(authorId)}</h1>
                <p>Автор опубликованных проектов на DesignFolio.</p>
              </div>
            </div>
            <div className="df-profile-stats">
              <div><strong>{loading ? "—" : works.length}</strong><span>работ</span></div>
              <div><strong>DF / {String(authorId).padStart(3, "0")}</strong><span>ID автора</span></div>
            </div>
          </section>

          <PageHeading eyebrow="ПОРТФОЛИО / 01" title="Работы автора" description="Все доступные проекты этого автора." />
          <ErrorNotice>{error}</ErrorNotice>
          {loading ? (
            <div className="df-loading-state">Загружаем портфолио<span>…</span></div>
          ) : works.length === 0 ? (
            <EmptyState title="Здесь пока нет работ" description="Когда автор опубликует проект, он появится в этом разделе." action={<Link className="df-button df-button--secondary" to="/designers">Вернуться к дизайнерам</Link>} />
          ) : (
            <div className="df-work-grid">
              {works.map((work, index) => <WorkCard key={work.id} work={work} index={index} categoryName={categoryNames[String(work.category_id)] || "Работа"} />)}
            </div>
          )}
        </>
      )}
    </SiteLayout>
  );
}
