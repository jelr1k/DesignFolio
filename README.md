# DesignFolio

Платформа для публикации и просмотра дизайнерских работ. Пользователи могут изучать каталог проектов, открывать страницы работ и профили авторов, а зарегистрированные дизайнеры — управлять своими публикациями.

**Сайт:** [design-folio-practise7.vercel.app](https://design-folio-practise7.vercel.app)


## Возможности

- Каталог работ с поиском, категориями и сортировкой.
- Страницы работ с описанием и изображениями.
- Регистрация и вход по электронной почте или имени пользователя.
- Профили дизайнеров и редактирование профиля.
- Создание и редактирование публикаций.
- Лайки и комментарии.
- Панель администратора для управления пользователями, работами и комментариями.
- Загрузка изображений работ в Supabase Storage. Поддерживаются JPEG, PNG и WebP; максимальный размер одного файла — 5 МБ.

## Технологии

| Часть проекта | Технологии |
| --- | --- |
| Frontend | React, Vite, React Router |
| Backend | Python, FastAPI, Uvicorn |
| Работа с базой | SQLAlchemy, Alembic, psycopg |
| База данных | PostgreSQL (для размещённой версии используется Supabase) |
| Хранение изображений | Supabase Storage |
| Размещение | Vercel (frontend), Render (API) |

## Скриншоты

Скриншоты интерфейса пока не добавлены в репозиторий. Перед сдачей проекта сохраните изображения в `docs/screenshots/` и добавьте сюда, например:

- `docs/screenshots/homepage.png` — главная страница;
- `docs/screenshots/work-page.png` — страница отдельной работы;
- `docs/screenshots/designer-profile.png` — профиль дизайнера.

После добавления файлов можно встроить их в README с помощью Markdown: `![Главная страница](docs/screenshots/homepage.png)`.

## Структура репозитория

```text
DesignFolio/
├── designfolio/
│   ├── frontend/       # React-приложение и стили
│   ├── backend/        # FastAPI, модели, маршруты и миграции
│   ├── docs/           # Документация проекта и ER-диаграмма
│   ├── .gitignore      # Исключения для секретов и генерируемых файлов
│   └── README.md       # Краткая справка по приложению
├── docs/               # Техническое задание проекта
└── archive/            # Архив учебных материалов и предыдущих документов
```

## Запуск локально

Для запуска потребуются Python 3.10 или новее, Node.js и npm, а также доступная база PostgreSQL. Для загрузки изображений дополнительно нужны URL проекта Supabase и серверный секретный ключ Supabase.

### 1. Настройка backend

Из корня репозитория перейдите в каталог backend:

```powershell
cd designfolio/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Создайте файл `designfolio/backend/.env` со своими настройками:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SIDE_SUPABASE_SECRET_KEY
```

Замените значения примерами из собственного окружения. `DATABASE_URL` должен указывать на доступную базу PostgreSQL. `SUPABASE_URL` и `SUPABASE_SECRET_KEY` используются сервером для загрузки изображений; секретный ключ нельзя помещать во frontend-код, коммитить в Git или публиковать.

Примените миграции:

```powershell
alembic upgrade head
```

Запустите API:

```powershell
uvicorn app.main:app --reload
```

После запуска API будет доступен по адресу `http://localhost:8000`, интерактивная документация — `http://localhost:8000/docs`, а проверка состояния — `http://localhost:8000/api/health`.

### 2. Настройка frontend

Откройте второй терминал и перейдите в каталог frontend:

```powershell
cd designfolio/frontend
npm install
```

Создайте файл `designfolio/frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:8000
```

Запустите интерфейс:

```powershell
npm run dev
```

Vite напечатает локальный адрес frontend в терминале. Откройте этот адрес в браузере.

### 3. Демонстрационные данные (необязательно)

В backend есть скрипт `seed.py` для заполнения базы демонстрационными данными. Запускайте его только после настройки базы и применения миграций. Скрипт требует явно заданный пароль через переменную `SEED_PASSWORD`; он не использует общий пароль по умолчанию.

В PowerShell из каталога `designfolio/backend`:

```powershell
$env:SEED_PASSWORD = "YOUR_LOCAL_DEMO_PASSWORD"
python seed.py
```

Используйте только отдельный локальный демонстрационный пароль. Не запускайте заполнение демоданными в production-базе без предварительной проверки действий скрипта.

## Сборка frontend

Из каталога `designfolio/frontend` выполните:

```powershell
npm run build
```

Готовая сборка будет создана в `designfolio/frontend/dist/`. Для локального просмотра production-сборки можно выполнить `npm run preview`.

## Размещение

- Frontend: [Vercel](https://vercel.com/).
- Backend API: [Render](https://dashboard.render.com/).
- База данных и хранилище изображений: [Supabase](https://supabase.com/).

Настройки подключения и секретные значения задаются в переменных окружения соответствующих платформ. Не добавляйте файлы `.env`, токены, пароли или серверные ключи в Git.

## Документация

- [Техническое задание](docs/TZ_DesignFolio.docx)
- [ER-диаграмма и структура данных](designfolio/docs/ER.md)
