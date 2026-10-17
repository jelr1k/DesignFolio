import { Link } from "react-router-dom";
import { Breadcrumbs, PageHeading, SiteLayout } from "../components/SiteLayout";

export function ContactsPage() {
  return (
    <SiteLayout wide>
      <Breadcrumbs items={[{ label: "Контакты" }]} />
      <PageHeading eyebrow="DESIGNFOLIO / CONTACTS" title="На связи с сообществом" description="DesignFolio помогает студентам-дизайнерам показывать проекты, получать обратную связь и находить вдохновение." />
      <div className="df-metric-grid df-contact-grid">
        <article className="df-metric-card df-metric-card--coral">
          <span>01 / GITHUB</span><strong>Код проекта</strong>
          <p>Исходный код, история изменений и задачи разработки.</p>
          <a className="df-table-link" href="https://github.com/jelr1k/DesignFolio" target="_blank" rel="noreferrer">Открыть репозиторий ↗</a>
        </article>
        <article className="df-metric-card">
          <span>02 / FEEDBACK</span><strong>Обратная связь</strong>
          <p>Открой работу и оставь комментарий после входа. Автор работы может модерировать обсуждение под своим проектом.</p>
          <Link className="df-table-link" to="/works">Перейти к работам ↗</Link>
        </article>
      </div>
      <section className="df-settings-card df-contact-note">
        <p className="df-eyebrow">СВЯЗАТЬСЯ</p>
        <h2>Есть вопрос или предложение?</h2>
        <p>Сообщи об ошибке или предложи улучшение через раздел Issues репозитория. Опиши проблему и шаги для её повторения, но не публикуй пароли, токены и другие личные данные.</p>
        <a className="df-table-link" href="https://github.com/jelr1k/DesignFolio/issues" target="_blank" rel="noreferrer">Написать в GitHub ↗</a>
      </section>
    </SiteLayout>
  );
}
