import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API, api } from "../api/client";
import { Breadcrumbs, EmptyState, ErrorNotice, PageHeading, SiteLayout, WorkCard, useCurrentUser } from "../components/SiteLayout";

export function WorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [work, setWork] = useState(null);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [like, setLike] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api("/api/works/" + id),
      api("/api/works/" + id + "/comments"),
      api("/api/categories"),
      api("/api/works?page=1&limit=12&sort=newest")
    ]).then(([loadedWork, loadedComments, categoryList, workList]) => {
      if (!active) return;
      setWork(loadedWork);
      setComments(loadedComments || []);
      setCategories(categoryList || []);
      setRelated((workList.items || []).filter((item) => String(item.id) !== String(id)).slice(0, 3));
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Не удалось открыть работу.");
    }).finally(() => { if (active) setLoading(false); });

    if (localStorage.getItem("designfolio_token")) {
      api("/api/works/" + id + "/like").then((value) => { if (active) setLike(value); }).catch(() => {});
    } else {
      setLike(null);
    }
    return () => { active = false; };
  }, [id]);

  const categoryName = categories.find((item) => String(item.id) === String(work?.category_id))?.name || "Работа";
  const cover = work?.cover_url ? (work.cover_url.startsWith("http") ? work.cover_url : API + work.cover_url) : "";

  async function toggleLike() {
    if (!localStorage.getItem("designfolio_token")) return navigate("/login");
    try {
      const result = await api("/api/works/" + id + "/like", { method: like?.liked ? "DELETE" : "POST" });
      setLike(result);
    } catch (requestError) {
      setCommentError(requestError.message || "Не удалось поставить лайк.");
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!localStorage.getItem("designfolio_token")) return navigate("/login");
    setSending(true);
    setCommentError("");
    try {
      const created = await api("/api/works/" + id + "/comments", {
        method: "POST",
        body: JSON.stringify({ content: commentText.trim() })
      });
      setComments((current) => [...current, created]);
      setCommentText("");
    } catch (requestError) {
      setCommentError(requestError.message || "Не удалось отправить комментарий.");
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(commentId) {
    try {
      await api("/api/works/" + id + "/comments/" + commentId, { method: "DELETE" });
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (requestError) {
      setCommentError(requestError.message || "Не удалось удалить комментарий.");
    }
  }

  if (loading) return <SiteLayout><div className="df-loading-state">Загружаем проект…</div></SiteLayout>;
  if (error || !work) return <SiteLayout><EmptyState title="Не удалось открыть проект" description={error || "Работа не найдена."} action={<Link className="df-button df-button--secondary" to="/works">Вернуться в каталог</Link>} /></SiteLayout>;

  return (
    <SiteLayout wide>
      <Breadcrumbs items={[{ label: "Работы", to: "/works" }, { label: work.title }]} />
      <div className="df-work-detail-heading">
        <div>
          <p className="df-eyebrow">PROJECT / {String(work.id).padStart(3, "0")}</p>
          <h1>{work.title}</h1>
          <div className="df-work-detail-meta"><span>{categoryName}</span><span>Автор #{work.author_id}</span><span>DesignFolio</span></div>
        </div>
        <div className="df-work-detail-actions">
          <button className={"df-button " + (like?.liked ? "df-button--liked" : "df-button--secondary")} type="button" onClick={toggleLike}>♡ {like?.liked ? "Нравится" : "Поставить лайк"} <strong>{like?.likes_count ?? "—"}</strong></button>
          <Link className="df-button df-button--secondary" to={"/designers/" + work.author_id}>Профиль автора ↗</Link>
          {user && (user.id === work.author_id || user.role === "admin") && <Link className="df-button df-button--primary" to={"/works/" + id + "/edit"}>Редактировать</Link>}
        </div>
      </div>

      <div className="df-work-detail-layout">
        <div className="df-work-detail-main">
          <div className="df-work-cover">
            {cover ? <img src={cover} alt={work.title} /> : <div className="df-work-cover-placeholder"><span>{categoryName}</span><strong>{work.title}</strong><i>DF / {String(work.id).padStart(3, "0")}</i></div>}
          </div>
          <section className="df-description-panel">
            <p className="df-eyebrow">О ПРОЕКТЕ</p>
            <h2>Идея и процесс</h2>
            <p>{work.description || "Автор пока не добавил описание к этому проекту."}</p>
            <div className="df-project-tags"><span>{categoryName}</span><span>DesignFolio</span></div>
          </section>
        </div>

        <aside className="df-work-detail-aside">
          <section className="df-author-panel">
            <span className="df-author-avatar">{String(work.author_id).slice(-2).padStart(2, "0")}</span>
            <div><p className="df-eyebrow">АВТОР ПРОЕКТА</p><h2>Автор #{work.author_id}</h2><p>Автор портфолио DesignFolio</p></div>
            <Link className="df-button df-button--secondary df-button--full" to={"/designers/" + work.author_id}>Все работы автора ↗</Link>
          </section>
          <section className="df-comments-panel">
            <div className="df-section-title-row"><div><p className="df-eyebrow">ОБРАТНАЯ СВЯЗЬ</p><h2>Комментарии <span>{comments.length}</span></h2></div></div>
            <ErrorNotice>{commentError}</ErrorNotice>
            {comments.length ? comments.map((comment) => (
              <article className="df-comment" key={comment.id}>
                <div className="df-comment-avatar">{String(comment.user_id).slice(-2).padStart(2, "0")}</div>
                <div><strong>Пользователь #{comment.user_id}</strong><p>{comment.content}</p>
                  {user && (user.id === comment.user_id || user.id === work.author_id || user.role === "admin") && <button className="df-text-button" type="button" onClick={() => deleteComment(comment.id)}>Удалить</button>}
                </div>
              </article>
            )) : <p className="df-muted-copy">Комментариев пока нет. Будь первым, кто оставит отзыв.</p>}
            <form className="df-comment-form" onSubmit={submitComment}>
              <label className="df-field"><span>Твой комментарий</span><textarea required maxLength={2000} value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Что тебе понравилось в проекте?" /></label>
              <button className="df-button df-button--primary df-button--full" disabled={sending}>{sending ? "Отправляем…" : "Отправить комментарий"}</button>
            </form>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="df-related-section">
          <PageHeading eyebrow="DISCOVER MORE" title="Похожие работы" description="Другие проекты из каталога DesignFolio." />
          <div className="df-work-grid">{related.map((item, index) => <WorkCard key={item.id} work={item} index={index} categoryName={categories.find((entry) => String(entry.id) === String(item.category_id))?.name || "Работа"} />)}</div>
        </section>
      )}
    </SiteLayout>
  );
}
