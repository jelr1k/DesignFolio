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
          <span>02 / FIGMA</span><strong>Дизайн и прототип</strong>
          <p>Макеты экранов и визуальная концепция платформы.</p>
          <a className="df-table-link" href="https://www.figma.com/design/HohoPtvMrGudVojDiC7ROl/DesignFolio-%E2%80%94-%D0%93%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F-%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0?node-id=22-25" target="_blank" rel="noreferrer">Открыть макет ↗</a>
        </article>
        <article className="df-metric-card">
          <span>03 / FEEDBACK</span><strong>Обратная связь</strong>
          <p>Открой работу и оставь комментарий после входа. Автор работы может модерировать обсуждение под своим проектом.</p>
          <Link className="df-table-link" to="/works">Перейти к работам ↗</Link>
        </article>
      </div>
      <section className="df-settings-card df-contact-note">
        <p className="df-eyebrow">О ПРОЕКТЕ</p>
        <h2>Студенческая платформа портфолио</h2>
        <p>Сайт создан в рамках учебной практики УП.08. Если ты нашёл ошибку, сообщи о ней через репозиторий проекта. Не отправляй пароли и другие личные данные в комментариях.</p>
      </section>
    </SiteLayout>
  );
}
