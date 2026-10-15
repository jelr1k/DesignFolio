import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Breadcrumbs, EmptyState, ErrorNotice, SiteLayout, useCurrentUser } from "../components/SiteLayout";

export function WorkEditorPage() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [existingCover, setExistingCover] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(edit);

  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    let active = true;
    api("/api/categories").then((items) => { if (active) setCategories(items || []); }).catch(() => {});
    if (edit) {
      api("/api/works/" + id).then((work) => {
        if (!active) return;
        setTitle(work.title || "");
        setDescription(work.description || "");
        setCategory(String(work.category_id || ""));
        setExistingCover(work.cover_url || "");
      }).catch((requestError) => { if (active) setError(requestError.message || "Не удалось загрузить работу."); })
        .finally(() => { if (active) setInitialLoading(false); });
    } else {
      setInitialLoading(false);
    }
    return () => { active = false; };
  }, [edit, id]);

  async function save(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await api(edit ? "/api/works/" + id : "/api/works", {
        method: edit ? "PUT" : "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category_id: Number(category) })
      });
      if (file) {
        const form = new FormData();
        form.append("file", file);
        await api("/api/works/" + result.id + "/images", { method: "POST", body: form });
      }
      navigate("/works/" + result.id);
    } catch (requestError) {
      setError(requestError.message || "Не удалось сохранить работу.");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || initialLoading) return <SiteLayout><div className="df-loading-state">Проверяем доступ и загружаем редактор…</div></SiteLayout>;
  if (!user) return <SiteLayout><EmptyState title="Войди, чтобы публиковать работы" description="Публикация и редактирование доступны только после входа в аккаунт." action={<Link className="df-button df-button--primary" to="/login">Войти</Link>} /></SiteLayout>;
  if (user.role !== "designer" && user.role !== "admin") return <SiteLayout><EmptyState title="Публикация доступна дизайнерам" description="У этой учётной записи роль зрителя. Чужие работы нельзя редактировать." action={<Link className="df-button df-button--secondary" to="/dashboard">Вернуться в кабинет</Link>} /></SiteLayout>;

  return (
    <SiteLayout wide>
      <Breadcrumbs items={[{ label: "Кабинет", to: "/dashboard" }, { label: edit ? "Редактирование работы" : "Новая работа" }]} />
      <div className="df-editor-heading">
        <div><p className="df-eyebrow">WORKSPACE / PUBLISH</p><h1>{edit ? "Редактирование работы" : "Опубликовать работу"}</h1><p>Добавь обложку и расскажи, как создавался проект.</p></div>
        <Link className="df-button df-button--secondary" to="/dashboard">← В кабинет</Link>
      </div>

      <form className="df-editor-layout" onSubmit={save}>
        <div className="df-editor-form">
          <section className="df-editor-section">
            <div className="df-form-section-heading"><span>01</span><div><h2>Обложка проекта</h2><p>Лучше всего подходит горизонтальное изображение.</p></div></div>
            <label className={"df-upload-zone" + (file || existingCover ? " has-preview" : "")}>
              {preview ? <img src={preview} alt="Предпросмотр выбранной обложки" /> : existingCover ? <img src={existingCover} alt="Текущая обложка проекта" /> : (
                <span className="df-upload-placeholder"><span className="df-upload-icon">↑</span><strong>Перетащи изображение сюда</strong><small>PNG, JPG или WebP · до 5 МБ</small><em>Выбрать файл</em></span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
            {file && <p className="df-file-selected">Выбрано: {file.name} <button type="button" className="df-text-button" onClick={() => setFile(null)}>Убрать</button></p>}
          </section>

          <section className="df-editor-section">
            <div className="df-form-section-heading"><span>02</span><div><h2>О проекте</h2><p>Коротко опиши задачу и своё решение.</p></div></div>
            <label className="df-field"><span>Название проекта</span><input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, Aurora Dashboard" /></label>
            <label className="df-field"><span>Описание</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={6} placeholder="Расскажи о задаче, процессе и решении…" /></label>
            <label className="df-field"><span>Направление</span>
              <select required value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Выбери направление</option>
                {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
          </section>
          <ErrorNotice>{error}</ErrorNotice>
          <div className="df-editor-actions">
            <button className="df-button df-button--primary" disabled={saving}>{saving ? "Сохраняем…" : edit ? "Сохранить изменения" : "Опубликовать работу"} <span aria-hidden="true">↗</span></button>
            <Link className="df-button df-button--secondary" to="/dashboard">Отмена</Link>
          </div>
        </div>

        <aside className="df-editor-aside">
          <div className="df-editor-preview">
            <p className="df-eyebrow">ПРЕДПРОСМОТР</p>
            <div className="df-preview-cover">{preview || existingCover ? <img src={preview || existingCover} alt="" /> : <div><span>DESIGNFOLIO</span><strong>{title || "Название проекта"}</strong><i>{categories.find((item) => String(item.id) === category)?.name || "Направление"}</i></div>}</div>
            <h3>{title || "Название проекта"}</h3>
            <p>{description || "Описание твоей идеи появится здесь."}</p>
          </div>
          <div className="df-checklist">
            <h3>Перед публикацией</h3>
            <p><span className={title.trim() ? "is-done" : ""}>{title.trim() ? "✓" : "1"}</span> Заполни название</p>
            <p><span className={category ? "is-done" : ""}>{category ? "✓" : "2"}</span> Выбери направление</p>
            <p><span className={file || existingCover ? "is-done" : ""}>{file || existingCover ? "✓" : "3"}</span> Добавь обложку</p>
          </div>
          <p className="df-editor-note">Обложку можно загрузить в форматах PNG, JPG или WebP. Размер файла ограничен сервером до 5 МБ.</p>
        </aside>
      </form>
    </SiteLayout>
  );
}
