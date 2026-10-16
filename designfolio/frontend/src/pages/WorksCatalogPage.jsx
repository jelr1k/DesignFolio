import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Breadcrumbs, EmptyState, ErrorNotice, PageHeading, SiteLayout, WorkCard, WorkSkeletonGrid } from "../components/SiteLayout";

export function WorksCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [works, setWorks] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/categories").then((items) => {
      if (active) setCategories(items || []);
    }).catch(() => {
      if (active) setCategories([]);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "9", sort });
    if (query.trim()) params.set("search", query.trim());
    if (category) params.set("category_id", category);
    api("/api/works?" + params.toString())
      .then((result) => {
        if (!active) return;
        setWorks(result.items || []);
        setMeta({ pages: result.pages || 0, total: result.total || 0 });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Не удалось загрузить работы.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, query, category, sort]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (category) next.set("category", category);
    setSearchParams(next, { replace: true });
  }, [query, category, setSearchParams]);

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((item) => [String(item.id), item.name])),
    [categories]
  );

  function selectCategory(id) {
    setCategory((current) => current === String(id) ? "" : String(id));
    setPage(1);
  }

  return (
    <SiteLayout wide>
      <Breadcrumbs items={[{ label: "Работы" }]} />
      <PageHeading
        eyebrow="КАТАЛОГ / 01"
        title="Все работы"
        description="Идеи, проекты и визуальные эксперименты студентов-дизайнеров."
      />

      <form className="df-catalog-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
        <label className="df-search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Поиск по названию, автору или описанию"
            aria-label="Поиск работ"
          />
        </label>
        <label className="df-sort-field">
          <span>Сортировка</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
          </select>
        </label>
      </form>

      <div className="df-filter-panel">
        <div className="df-filter-heading">
          <span className="df-eyebrow">НАПРАВЛЕНИЕ</span>
          {category && <button type="button" className="df-text-button" onClick={() => { setCategory(""); setPage(1); }}>Сбросить фильтр ×</button>}
        </div>
        <div className="df-filter-list">
          <button className={"df-filter-chip" + (!category ? " is-active" : "")} type="button" aria-pressed={!category} onClick={() => { setCategory(""); setPage(1); }}>Все работы</button>
          {categories.map((item) => (
            <button
              className={"df-filter-chip" + (category === String(item.id) ? " is-active" : "")}
              type="button"
              key={item.id}
              aria-pressed={category === String(item.id)}
              onClick={() => selectCategory(item.id)}
            >{item.name}</button>
          ))}
        </div>
      </div>

      <div className="df-results-row">
        <p>{meta.total} {meta.total === 1 ? "работа" : meta.total > 1 && meta.total < 5 ? "работы" : "работ"}</p>
        <span>{query.trim() ? "Поиск: «" + query.trim() + "»" : "Каталог DesignFolio"}</span>
      </div>

      <ErrorNotice>{error}</ErrorNotice>
      {loading ? (
        <WorkSkeletonGrid count={6} />
      ) : works.length === 0 ? (
        <EmptyState
          title="Здесь начинается чья-то история"
          description="Подходящих проектов пока нет. Попробуй изменить фильтры или стань первым автором."
        />
      ) : (
        <div className="df-work-grid">
          {works.map((work, index) => (
            <WorkCard key={work.id} work={work} index={index} categoryName={categoryNames[String(work.category_id)] || "Работа"} />
          ))}
        </div>
      )}

      {meta.pages > 1 && (
        <nav className="df-pagination" aria-label="Страницы каталога">
          <button type="button" disabled={page <= 1 || loading} onClick={() => { setPage((current) => current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Назад</button>
          <span>Страница <strong>{page}</strong> из {meta.pages}</span>
          <button type="button" disabled={page >= meta.pages || loading} onClick={() => { setPage((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Дальше →</button>
        </nav>
      )}
    </SiteLayout>
  );
}
