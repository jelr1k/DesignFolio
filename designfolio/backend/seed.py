"""Idempotently seed DesignFolio with demo content.

Run from the backend directory after setting SEED_PASSWORD:
    # PowerShell
    $env:SEED_PASSWORD = "choose-a-unique-password"
    python seed.py

The seed adds data; it does not delete or overwrite existing user works.
"""
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from passlib.context import CryptContext
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal
from app.models import Category, Tag, User, Work, WorkImage, WorkTag

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SEED_PASSWORD = os.getenv("SEED_PASSWORD", "").strip()

CATEGORIES = [
    ("UI/UX", "ui-ux", "Интерфейсы, пользовательский опыт и цифровые продукты."),
    ("3D", "3d", "Трёхмерная графика и визуализация."),
    ("Иллюстрация", "illustration", "Цифровые и авторские иллюстрации."),
    ("Брендинг", "branding", "Визуальные системы и айдентика брендов."),
    ("Моушн-дизайн", "motion", "Анимация, динамическая графика и титры."),
    ("Типографика", "typography", "Шрифтовые композиции, редакционный и плакатный дизайн."),
]

TAGS = [
    ("Web", "web"), ("Mobile", "mobile"), ("Branding", "branding"), ("3D", "3d"),
    ("Illustration", "illustration"), ("Typography", "typography"), ("Figma", "figma"),
    ("Dashboard", "dashboard"), ("E-commerce", "ecommerce"), ("App design", "app-design"),
    ("Editorial", "editorial"), ("Packaging", "packaging"), ("Motion", "motion"),
    ("Identity", "identity"), ("Landing page", "landing-page"), ("Poster", "poster"),
    ("Blender", "blender"), ("After Effects", "after-effects"),
]

DEMO_USERS = [
    ("mira.design", "mira.design@example.com", "designer"),
    ("alex.studio", "alex.studio@example.com", "designer"),
    ("niko.visual", "niko.visual@example.com", "designer"),
    ("sofia.creative", "sofia.creative@example.com", "designer"),
    ("daniel.motion", "daniel.motion@example.com", "designer"),
    ("kate.type", "kate.type@example.com", "designer"),
    ("viewer_demo", "viewer-demo@example.com", "viewer"),
    ("df_admin", "df-admin@example.com", "admin"),
]

DEMO_WORKS = [
    ("Aurora Finance Dashboard", "Концепция финансовой панели: ясная аналитика, спокойная палитра и короткий путь к ключевым действиям.", "ui-ux", "photo-1460925895917-afdab827c52f", "mira.design", ("figma", "dashboard", "web")),
    ("Pulse Fitness App", "Мобильный продукт для тренировок с заметным прогрессом, расписанием и понятными состояниями.", "ui-ux", "photo-1510017803434-a899398421b3", "alex.studio", ("mobile", "app-design", "web")),
    ("Noma Coffee Identity", "Айдентика небольшой кофейни: система знаков, фирменная упаковка и правила применения.", "branding", "photo-1442512595331-e89e73853f31", "niko.visual", ("branding", "identity", "packaging")),
    ("Orbit Headphones 3D", "Предметная 3D-визуализация наушников со студийным светом и акцентом на форму.", "3d", "photo-1505740420928-5e560c06d30e", "sofia.creative", ("3d", "blender", "web")),
    ("Garden Notes Illustration", "Серия ботанических иллюстраций для цифрового ежедневника и печатных открыток.", "illustration", "photo-1490750967868-88aa4486c946", "kate.type", ("illustration", "poster", "editorial")),
    ("Type in Motion", "Короткая типографическая заставка, построенная на ритме, масштабе и контрасте.", "motion", "photo-1550745165-9bc0b252726f", "daniel.motion", ("motion", "after-effects", "typography")),
    ("Mellow Skincare", "Визуальная система ухода за кожей с мягкой типографикой и минимальной упаковкой.", "branding", "photo-1608248543803-ba4f8c70ae0b", "mira.design", ("branding", "identity", "packaging")),
    ("Metro Wayfinding", "Навигационная система городской станции: контраст, пиктограммы и маршрутная логика.", "ui-ux", "photo-1519501025264-65ba15a82390", "alex.studio", ("figma", "web", "typography")),
    ("Neon Room Render", "Атмосферный интерьерный рендер с выразительным светом и материалами.", "3d", "photo-1600210492486-724fe5c67fb0", "niko.visual", ("3d", "blender", "illustration")),
    ("Sunday Market Poster", "Плакат для локального маркета с крупной типографикой и энергичной композицией.", "illustration", "photo-1541701494587-cb58502866ab", "sofia.creative", ("poster", "illustration", "typography")),
    ("Fintech Onboarding", "Сценарий первого запуска финансового приложения с короткими шагами и доступными формулировками.", "ui-ux", "photo-1551288049-bebda4e38f71", "mira.design", ("mobile", "app-design", "figma")),
    ("Lumen Studio Identity", "Айдентика дизайн-студии: знак, сетка, палитра и набор цифровых носителей.", "branding", "photo-1497366754035-f200968a6e72", "alex.studio", ("branding", "identity", "web")),
    ("Glass Material Study", "Исследование прозрачных материалов и света в серии минималистичных 3D-объектов.", "3d", "photo-1618005182384-a83a8bd57fbe", "niko.visual", ("3d", "blender", "illustration")),
    ("Little City Characters", "Персонажи и объекты вымышленного города для детского редакционного проекта.", "illustration", "photo-1513364776144-60967b0f800f", "sofia.creative", ("illustration", "editorial", "poster")),
    ("Type Specimen No. 04", "Шрифтовой specimen, показывающий характер гарнитуры через наборы и крупные формы.", "typography", "photo-1494438639946-1ebd1d20bf85", "kate.type", ("typography", "editorial", "poster")),
    ("Motion Brand Toolkit", "Набор коротких анимационных правил для фирменного знака и социальных форматов.", "motion", "photo-1550745165-9bc0b252726f", "daniel.motion", ("motion", "after-effects", "branding")),
    ("Study Buddy Web App", "Адаптивный интерфейс планировщика учёбы с фокусом на небольшие ежедневные задачи.", "ui-ux", "photo-1498050108023-c5249f4df085", "mira.design", ("web", "dashboard", "figma")),
    ("Terra Packaging", "Упаковка для линейки экологичных продуктов с тактильной фактурой и сдержанной палитрой.", "branding", "photo-1602143407151-7111542de6e8", "alex.studio", ("packaging", "branding", "identity")),
    ("Retro Console Model", "Стилизованная 3D-модель портативной игровой консоли с ретро-настроением.", "3d", "photo-1593305841991-05c297ba4575", "niko.visual", ("3d", "blender", "illustration")),
    ("Abstract Color Atlas", "Цифровые композиции для цветового атласа: слои, текстуры и цветовые пары.", "illustration", "photo-1549490349-8643362247b5", "sofia.creative", ("illustration", "poster", "web")),
    ("Magazine Grid System", "Редакционная сетка журнала с вариативными колонками и крупными заголовками.", "typography", "photo-1504711434969-e33886168f5c", "kate.type", ("editorial", "typography", "web")),
    ("Cinema App Redesign", "Концепт выбора сеанса и места с акцентом на скорость принятия решения.", "ui-ux", "photo-1489599849927-2ee91cede3ba", "mira.design", ("mobile", "app-design", "figma")),
    ("Citrus Soda Launch", "Ключевой визуал запуска лимонада: форма, сочный цвет и система рекламных носителей.", "branding", "photo-1532634896-26909d0d4b56", "alex.studio", ("branding", "packaging", "poster")),
    ("Soft Fabric Shader", "Набор шейдеров ткани для предметных сцен с разными фактурами и отражениями.", "3d", "photo-1529139574466-a303027c1d8b", "niko.visual", ("3d", "blender", "web")),
    ("Botanical Motion Cards", "Анимационные карточки с органичными переходами для коллекции растений.", "motion", "photo-1497250681960-ef046c08a56e", "daniel.motion", ("motion", "after-effects", "illustration")),
    ("Festival Visual Language", "Графическая система музыкального фестиваля для афиш, билетов и социальных сетей.", "illustration", "photo-1459749411175-04bf5292ceea", "sofia.creative", ("poster", "illustration", "branding")),
    ("Mono Type Poster", "Постер, где одна гарнитура создаёт структуру, напряжение и иерархию.", "typography", "photo-1494438639946-1ebd1d20bf85", "kate.type", ("typography", "poster", "editorial")),
    ("Task Flow Mobile", "Поток создания задачи для мобильного продукта с понятными ошибками и подтверждением.", "ui-ux", "photo-1551650975-87deedd944c3", "mira.design", ("mobile", "app-design", "figma")),
    ("Northwind Brand Book", "Небольшой брендбук технологического проекта с правилами логотипа и компонентов.", "branding", "photo-1558655146-9f40138edfeb", "alex.studio", ("identity", "branding", "web")),
    ("Product Launch Titles", "Пакет титров для продуктового ролика: аккуратная типографика и динамичные переходы.", "motion", "photo-1492619375914-88005aa9e8fb", "daniel.motion", ("motion", "after-effects", "typography")),
]


def now():
    return datetime.now(timezone.utc)


def slugify(value: str) -> str:
    return "-".join(value.lower().replace("/", " ").split()).replace(" ", "-")


def unique_work_slug(db, base: str) -> str:
    slug = slugify(base)
    candidate = slug
    index = 2
    while db.scalar(select(Work).where(Work.slug == candidate)):
        candidate = f"{slug}-{index}"
        index += 1
    return candidate


def get_or_create_catalog(db):
    categories = {}
    for name, slug, description in CATEGORIES:
        item = db.scalar(select(Category).where(Category.slug == slug))
        if item is None:
            item = Category(name=name, slug=slug, description=description)
            db.add(item)
            db.flush()
        categories[slug] = item

    tags = {}
    for name, slug in TAGS:
        item = db.scalar(select(Tag).where(Tag.slug == slug))
        if item is None:
            item = Tag(name=name, slug=slug)
            db.add(item)
            db.flush()
        tags[slug] = item
    return categories, tags


def get_or_create_users(db):
    if not SEED_PASSWORD:
        raise RuntimeError("Set SEED_PASSWORD before running the demo seed; a public default password is disabled.")
    users = {}
    password_hash = pwd_context.hash(SEED_PASSWORD)
    for username, email, role in DEMO_USERS:
        user = db.scalar(select(User).where(User.username == username))
        if user is None:
            user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                role=role,
                created_at=now(),
                updated_at=now(),
            )
            db.add(user)
            db.flush()
        users[username] = user
    return users


def seed_works(db, users, categories, tags):
    target = 30
    current_total = db.scalar(select(func.count()).select_from(Work)) or 0
    if current_total >= target:
        return 0

    created = 0
    for index in range(current_total, target):
        title, description, category_slug, image_id, author_name, tag_slugs = DEMO_WORKS[index]
        author = users[author_name]
        category = categories[category_slug]
        image_url = f"https://images.unsplash.com/{image_id}?auto=format&fit=crop&w=1200&q=82"
        work = Work(
            author_id=author.id,
            category_id=category.id,
            title=title,
            slug=unique_work_slug(db, title),
            description=description,
            cover_url=image_url,
            is_hidden=False,
            created_at=now(),
            updated_at=now(),
        )
        db.add(work)
        db.flush()
        db.add(WorkImage(work_id=work.id, image_url=image_url, sort_order=0, created_at=now()))
        for tag_slug in tag_slugs:
            tag = tags.get(tag_slug)
            if tag is not None:
                db.add(WorkTag(work_id=work.id, tag_id=tag.id))
        created += 1
    return created


def main():
    db = SessionLocal()
    try:
        categories, tags = get_or_create_catalog(db)
        users = get_or_create_users(db)
        created = seed_works(db, users, categories, tags)
        db.commit()
        print(
            f"Seed complete: users={db.scalar(select(func.count()).select_from(User))}, "
            f"categories={db.scalar(select(func.count()).select_from(Category))}, "
            f"tags={db.scalar(select(func.count()).select_from(Tag))}, "
            f"works_created={created}"
        )
        print("Generated demo users share SEED_PASSWORD; rotate it after a public demo.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
