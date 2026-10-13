import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, API } from "../api/client";

const PAGE_SIZE = 6;

function getCategoryName(categories, categoryId) {
  return categories.find((category) => category.id === categoryId)?.name || "Работа";
}

function formatWorkCount(count) {
  const n = Math.abs(count) % 100;
  const lastDigit = n % 10;
  if (n > 10 && n < 20) return `${count} работ`;
  if (lastDigit === 1) return `${count} работа`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} работы`;
  return `${count} работ`;
}

function WorkArtwork({ work, categoryName, index }) {
  const imageUrl = work.cover_url
    ? work.cover_url.startsWith("http")
      ? work.cover_url
      : API + work.cover_url
    : null;

  return (
    <div className={`work-art work-art--${index % 6}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={work.title} loading="lazy" />
      ) : (
        <div className="work-art-placeholder" aria-hidden="true">
          <span className="art-shape art-shape--back" />
          <span className="art-shape art-shape--front" />
          <span className="art-grid" />
          <span className="art-placeholder-label">{categoryName}</span>
        </div>
      )}
      <span className="work-category">{categoryName}</span>
    </div>
  );
}

export function CatalogPage() {
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const items = await api("/api/categories");
        const enriched = await Promise.all(
          items.map(async (item) => {
            try {
              const result = await api(
                `/api/works?page=1&limit=1&category_id=${encodeURIComponent(item.id)}`
              );
              return { ...item, workCount: result.total };
            } catch {
              return { ...item, workCount: 0 };
            }
          })
        );
        if (!cancelled) setCategories(enriched);
      } catch {
        if (!cancelled) setCategories([]);
      }
    }

    loadCategories();

    if (localStorage.getItem("designfolio_token")) {
      api("/api/auth/me")
        .then((currentUser) => {
          if (!cancelled) setUser(currentUser);
        })
        .catch(() => {
          localStorage.removeItem("designfolio_token");
          if (!cancelled) setUser(null);
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort: "newest",
    });
    if (q.trim()) params.set("search", q.trim());
    if (category) params.set("category_id", category);

    api("/api/works?" + params.toString())
      .then((result) => {
        if (cancelled) return;
        setWorks(result.items || []);
        setMeta(result);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || "Не удалось загрузить работы");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, q, category]);

  function chooseCategory(categoryId) {
    setCategory((current) => (current === String(categoryId) ? "" : String(categoryId)));
    setPage(1);
    document.getElementById("works")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function logout() {
    localStorage.removeItem("designfolio_token");
    setUser(null);
    setMenuOpen(false);
  }

  function initials(name) {
    return (name || "DF")
      .trim()
      .split(/[\s._-]+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();
  }

  return (
    <div className="home-shell">
      <header className="home-header">
        <Link className="home-brand" to="/" aria-label="DesignFolio — главная">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>DesignFolio</span>
        </Link>

        <button
          className="home-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav className={`home-nav${menuOpen ? " is-open" : ""}`} aria-label="Основная навигация">
          <a href="#works" onClick={() => setMenuOpen(false)}>Работы</a>
          <a href="#categories" onClick={() => setMenuOpen(false)}>Категории</a>
          <a href="#community" onClick={() => setMenuOpen(false)}>Сообщество</a>
        </nav>

        <form
          className="home-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            document.getElementById("works")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Поиск работ"
            placeholder="Поиск работ..."
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </form>

        <div className="home-account">
          {user ? (
            <>
              <span className="account-avatar" aria-hidden="true">{initials(user.username)}</span>
              <span className="account-name" title={user.username}>{user.username}</span>
              {user.role === "admin" && <span className="admin-chip">Админ</span>}
              <button className="account-logout" type="button" onClick={logout}>Выйти</button>
            </>
          ) : (
            <>
              <Link className="account-login" to="/login">Войти</Link>
              <Link className="account-signup" to="/register">Регистрация</Link>
            </>
          )}
        </div>
      </header>

      <main className="home-content">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-abstract" aria-hidden="true">
            <span className="abstract-orb" />
            <span className="abstract-ring abstract-ring--one" />
            <span className="abstract-ring abstract-ring--two" />
            <span className="abstract-ribbon abstract-ribbon--one" />
            <span className="abstract-ribbon abstract-ribbon--two" />
            <span className="abstract-spark abstract-spark--one">✳</span>
            <span className="abstract-spark abstract-spark--two">✳</span>
          </div>

          <div className="hero-copy">
            <p className="hero-kicker">ПЛАТФОРМА ДЛЯ ТВОРЧЕСТВА</p>
            <h1 id="home-title">Портфолио, которое говорит за тебя.</h1>
            <p className="hero-description">
              Публикуй проекты, находи вдохновение и открывай дизайнеров,
              за которыми хочется следить.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#works">Смотреть работы <span aria-hidden="true">↗</span></a>
              <Link className="button-secondary" to={user ? "/works/new" : "/login"}>Загрузить работу <span aria-hidden="true">＋</span></Link>
            </div>
            <div className="hero-note"><span /> Пространство для новых идей</div>
          </div>

          <div className="hero-index" aria-hidden="true">
            <span>DESIGN</span>
            <span>FOLIO</span>
            <b>№ 01</b>
          </div>
        </section>

        <section className="home-categories" id="categories" aria-labelledby="categories-title">
          <div className="section-heading section-heading--dark">
            <div>
              <p className="section-eyebrow">НАЙДИ СВОЙ СТИЛЬ</p>
              <h2 id="categories-title">Исследуй категории</h2>
            </div>
            {category && (
              <button className="clear-filter" type="button" onClick={() => { setCategory(""); setPage(1); }}>
                Сбросить фильтр ×
              </button>
            )}
          </div>

          <div className="category-list">
            {categories.length ? categories.slice(0, 3).map((item, index) => (
              <button
                className={`category-card category-card--${index}${category === String(item.id) ? " is-active" : ""}`}
                key={item.id}
                type="button"
                aria-pressed={category === String(item.id)}
                onClick={() => chooseCategory(item.id)}
              >
                <span className="category-number">0{index + 1}</span>
                <span className="category-name">{item.name}</span>
                <span className="category-count">{formatWorkCount(item.workCount || 0)}</span>
                <span className="category-arrow" aria-hidden="true">↗</span>
              </button>
            )) : (
              <>
                <a className="category-card category-card--0" href="#works"><span className="category-number">01</span><span className="category-name">UI/UX</span><span className="category-count">Интерфейсы</span><span className="category-arrow" aria-hidden="true">↗</span></a>
                <a className="category-card category-card--1" href="#works"><span className="category-number">02</span><span className="category-name">3D</span><span className="category-count">Объём и форма</span><span className="category-arrow" aria-hidden="true">↗</span></a>
                <a className="category-card category-card--2" href="#works"><span className="category-number">03</span><span className="category-name">Иллюстрация</span><span className="category-count">Рисунок и цвет</span><span className="category-arrow" aria-hidden="true">↗</span></a>
              </>
            )}
          </div>
        </section>

        <section className="home-works" id="works" aria-labelledby="works-title">
          <div className="section-heading section-heading--works">
            <div>
              <p className="section-eyebrow">ВЫБОР СООБЩЕСТВА</p>
              <h2 id="works-title">{category ? "Работы в категории" : "Популярные работы"}</h2>
              <p className="section-caption">
                {q.trim() ? `Результаты поиска: «${q.trim()}»` : "Свежие проекты, идеи и визуальные эксперименты."}
              </p>
            </div>
            <a className="text-link" href="#works">Смотреть все <span aria-hidden="true">→</span></a>
          </div>

          {loading ? (
            <div className="works-state">Подбираем работы для тебя<span className="loading-dots">…</span></div>
          ) : error ? (
            <div className="works-state works-state--error">{error}</div>
          ) : works.length === 0 ? (
            <div className="works-empty">
              <span className="empty-mark" aria-hidden="true">✳</span>
              <h3>Здесь начинается чья-то история</h3>
              <p>Подходящих работ пока нет. Попробуй изменить запрос или стань первым автором.</p>
              <Link className="button-primary" to={user ? "/works/new" : "/login"}>Опубликовать работу <span aria-hidden="true">↗</span></Link>
            </div>
          ) : (
            <>
              <div className="works-grid">
                {works.map((work, index) => {
                  const categoryName = getCategoryName(categories, work.category_id);
                  return (
                    <Link className="home-work-card" to={`/works/${work.id}`} key={work.id}>
                      <WorkArtwork work={work} categoryName={categoryName} index={index} />
                      <div className="home-work-details">
                        <div className="home-work-title-row">
                          <h3>{work.title}</h3>
                          <span className="work-open" aria-hidden="true">↗</span>
                        </div>
                        <div className="home-work-meta">
                          <span>Автор #{work.author_id}</span>
                          <span className="work-id">DF / {String(work.id).padStart(3, "0")}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {meta.pages > 1 && (
                <div className="home-pagination">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Назад</button>
                  <span>{page} <i>/</i> {meta.pages}</span>
                  <button type="button" disabled={page >= meta.pages} onClick={() => setPage((current) => current + 1)}>Дальше →</button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="home-community" id="community" aria-labelledby="community-title">
          <div className="community-decoration" aria-hidden="true"><span /><span /><span /></div>
          <p className="section-eyebrow">ТВОЙ ХОД</p>
          <h2 id="community-title">Покажи, что ты умеешь</h2>
          <p>Загрузи проект и получи обратную связь от сообщества.</p>
          <Link className="button-light" to={user ? "/works/new" : "/register"}>Опубликовать <span aria-hidden="true">↗</span></Link>
          <span className="community-footnote">ИДЕИ СТАНОВЯТСЯ ПРОЕКТАМИ.</span>
        </section>
      </main>

      <footer className="home-footer">
        <Link className="footer-brand" to="/">DesignFolio<span>®</span></Link>
        <nav aria-label="Навигация в подвале">
          <a href="#community">О платформе</a>
          <a href="#categories">Категории</a>
          <a href="mailto:hello@designfolio.local">Контакты</a>
        </nav>
        <p>© 2026 DesignFolio</p>
      </footer>
    </div>
  );
}
