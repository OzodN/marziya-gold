# Approved Architecture — Marziya Gold
## Утверждённые архитектурные решения

> **Статус:** APPROVED
> **Дата утверждения:** 2026-09-22
> **Источник требований:** [`docs/product/requirements.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/requirements.md)
> **Исследование:** [`docs/product/architecture-research.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/architecture-research.md)
> **Discovery:** [`docs/product/discovery.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/discovery.md)
>
> Этот документ содержит **только утверждённые** решения. Ничего не добавляется сверх того, что было явно одобрено.

---

# 1. Frontend: Next.js App Router + TypeScript

## Decision

Frontend построен на **Next.js (App Router)** с **TypeScript**.

## Rationale

- SSR/SSG обеспечивают SEO для каталога ювелирных изделий (product pages, category pages)
- `next/image` автоматически оптимизирует изображения (WebP/AVIF, lazy loading, responsive sizes)
- Open Graph теги генерируются server-side — критично для Telegram/WhatsApp шеринга
- TypeScript обеспечивает типобезопасность и согласованность с Java backend DTOs

## Consequences

- Требуется Node.js контейнер для deployment (рядом с Spring Boot 4.1.1)
- App Router определяет routing и rendering strategy
- Конкретные UI-библиотеки (Tailwind, Shadcn/UI и т.д.) — implementation detail, не часть архитектурного решения

---

# 2. Dynamic Product Characteristics: PostgreSQL JSONB

## Decision

Динамические характеристики товаров и камней хранятся в **PostgreSQL JSONB** колонках.

**Ключи характеристик** должны контролироваться и нормализоваться на уровне **application/admin layer**, чтобы избежать дублирования семантически одинаковых характеристик (например, "Цвет" vs "цвет" vs "Цвет ").

## Rationale

- Один запрос возвращает товар со всеми характеристиками (без JOIN'ов, без N+1)
- PostgreSQL `@>` оператор с GIN индексом эффективно фильтрует по нескольким характеристикам одновременно
- Hibernate 6 нативно поддерживает JSONB mapping (`@JdbcTypeCode(SqlTypes.JSON)`)
- Формат JSONB совместим со snapshot-стратегией для заявок

## Key Constraint

Application layer (admin panel / backend) **обязан** нормализовать ключи характеристик:
- Trim пробелов
- Нормализация регистра
- Autocomplete / dropdown из существующих ключей в admin UI
- Предотвращение создания дублирующих ключей

Без этого контроля JSONB-подход приведёт к фрагментации данных и некорректной фильтрации.

## Consequences

- Product table содержит JSONB колонку для характеристик
- ProductStone содержит JSONB колонку для характеристик камня
- GIN индекс на characteristics для фильтрации
- Admin UI предоставляет контролируемый ввод для имён характеристик
- Обновление одной характеристики перезаписывает весь JSONB документ (приемлемо для admin-only операций)

---

# 3. Search: PostgreSQL + pg_trgm

## Decision

Поиск реализуется средствами **PostgreSQL** с расширением **pg_trgm** для MVP.

**Elasticsearch / OpenSearch не используется.**

Архитектура **не должна препятствовать** будущей замене search implementation.

## Rationale

- Каталог содержит 100–2000 товаров — pg_trgm справляется без проблем
- pg_trgm обеспечивает нечёткий поиск (typo tolerance) и поддержку Cyrillic
- GIN индекс ускоряет ILIKE-запросы
- Отсутствие внешней инфраструктуры (нет JVM для ES, нет синхронизации данных)

## Key Constraint

Search implementation должна быть **заменяемой**. Application/domain code не должен быть жёстко привязан к конкретному механизму поиска PostgreSQL. Это позволит в будущем добавить Elasticsearch или другой поисковый движок без рефакторинга бизнес-логики.

## Consequences

- Расширение `pg_trgm` включается в PostgreSQL
- GIN индексы на `product.name`, `product.sku` (gin_trgm_ops)
- Search logic инкапсулирована за интерфейсом/портом

---

# 4. Image Storage: Local Filesystem (MVP) + Abstraction

## Decision

Для MVP используется **local filesystem** для хранения изображений.

Storage **абстрагирован** через application-level **ImageStorage interface/port**.

Domain/application code **не зависит** напрямую от filesystem.

## Rationale

- Масштаб MVP тривиален (~500 товаров × 8 изображений × 3 варианта = ~12,000 файлов, ~20–40 GB)
- Local filesystem не требует внешних зависимостей и дополнительной инфраструктуры
- Абстракция через интерфейс позволяет в будущем добавить S3-compatible implementation без изменения бизнес-логики

## Key Constraint

**Обязательная абстракция:**
```
ImageStoragePort (interface)
  ├── LocalFileSystemImageStorage (MVP implementation)
  └── S3ImageStorage (future implementation)
```

Domain и application слои работают **только** через `ImageStoragePort`. Прямые вызовы `java.io.File`, `java.nio.file.Path` и т.д. допустимы **только** внутри `LocalFileSystemImageStorage`.

## Consequences

- В БД хранится только `file_identifier` (UUID), не полный путь и не URL
- Frontend/backend формирует полный URL из конфигурируемого `IMAGE_BASE_URL`
- Nginx отдаёт статические файлы напрямую (не через Spring Boot 4.1.1)
- Миграция на S3: копирование файлов + новая implementation + смена конфигурации

---

# 5. Inquiry Snapshot: Full JSONB

## Decision

InquiryItem хранит **полный JSONB snapshot** товара на момент создания inquiry.

Snapshot сохраняет **историческое состояние** товара.

## Rationale

- Требование §32: "историческая заявка не должна неожиданно менять смысл"
- Self-contained запись, которая выживает при любых изменениях/удалениях товара
- Read-only данные, не требуют индексации/фильтрации — JSONB идеально подходит
- Объём хранения пренебрежимо мал (~2 KB на item)

## Snapshot Contents

Snapshot включает состояние товара **на момент создания inquiry**:
- Название, артикул, категория, описание
- Все характеристики (key-value)
- Все камни с их характеристиками
- Ссылка на основное изображение

## Consequences

- Backend создаёт snapshot-mapper при создании inquiry
- Admin panel отображает inquiry details из `snapshot_data`, не из live Product
- `product_id` сохраняется как nullable FK для потенциальной обратной ссылки

---

# 6. Cart: localStorage (Frontend-Only)

## Decision

Cart хранится в **localStorage** на frontend.

Server-side persistent cart **не создаётся**.

Backend **обязан валидировать** данные товаров при создании inquiry.

## Rationale

- Нет аккаунтов клиентов (§29) — server-side cart требует anonymous session management без пользы
- Stateless backend — cart не существует на сервере до момента отправки заявки
- Простота реализации

## Key Constraint

**Server-side валидация обязательна** при создании inquiry:
- Все product IDs существуют в БД
- Все товары `visible = true` и `deleted = false`
- Количество > 0 и в пределах допустимого лимита
- Минимум 1 item в заявке
- Backend **НЕ доверяет** frontend для product details — самостоятельно получает данные из БД

## Consequences

- Нет cart-related таблиц в БД
- Нет cart API endpoints (кроме inquiry submission)
- Cart теряется при очистке browser data или смене устройства (приемлемо)
- Frontend хранит только `[{productId, quantity}]` — product details подгружаются из API

---

# 7. Authentication: JWT in httpOnly Cookie

## Decision

Аутентификация через **JWT**, хранящийся в **httpOnly cookie**.

**Не добавлять** token blacklist или дополнительную инфраструктуру без отдельного архитектурного решения.

## Rationale

- Stateless backend — нет server-side session storage
- httpOnly cookie защищает от XSS (JavaScript не имеет доступа к токену)
- `SameSite=Strict` защищает от CSRF
- Соответствует REST API архитектуре

## Key Constraint

- **Никакого token blacklist** без отдельного утверждённого решения
- Никакого Redis для сессий
- Никакого OAuth2/OIDC
- Revocation происходит только через expiration токена

## Consequences

- Spring Security конфигурация с JWT filter
- Access token + Refresh token flow
- Конкретные TTL значения — implementation detail
- Пароль admin'а — BCrypt hash

---

# 8. Product Lifecycle: Soft Delete

## Decision

Product использует **soft delete**.

Historical Inquiry data **не должна зависеть** от существования активного Product.

## Rationale

- InquiryItem имеет FK на Product — soft delete сохраняет FK валидным
- Двойная защита: soft delete + JSONB snapshot в InquiryItem
- Возможность восстановления удалённого товара
- §32: историческая целостность заявок

## Key Constraint

Inquiry data — autonomous:
- Даже если product будет hard-deleted в будущем, inquiry snapshot содержит всю необходимую информацию
- `product_id` в InquiryItem — **nullable FK** (не обязательная зависимость)

## Consequences

- Product table: `deleted` boolean (или `deleted_at` timestamp)
- Product table: `visible` boolean (отдельно от deleted)
- Все public запросы фильтруют `WHERE deleted = false`
- PostgreSQL partial unique index для SKU: `WHERE deleted = false`
- Hibernate `@SQLRestriction` для автоматической фильтрации

---

# 9. Admin Panel: Single Next.js Application

## Decision

Public storefront и Admin Panel находятся в **одном Next.js application**.

Admin использует **отдельный route group** (например, `(admin)`).

Отдельное frontend-приложение для admin **не создаётся**.

## Rationale

- Единая кодовая база — shared TypeScript types, shared API client, shared UI components
- Упрощённый CI/CD pipeline — один build, один deploy
- Route-based code splitting — admin код не загружается на public страницах

## Consequences

- Next.js middleware обеспечивает route-level protection для `/admin`
- Admin routes доступны только аутентифицированным пользователям
- Shared types между public и admin частями

---

# 10. Admin UX: Responsive

## Decision

Admin Panel **должна быть responsive**.

## Rationale

- Требование §35: responsive design обязателен, включая admin panel
- Мастер/продавец может управлять заявками и товарами с мобильного устройства

## Consequences

- Admin UI компоненты должны корректно отображаться на mobile
- Формы редактирования, таблицы, и навигация — адаптивные

---

# Open Architectural Questions

Следующие вопросы **не решены** и требуют уточнения перед implementation. Решения по ним **не приняты**.

## OAQ-01: Структура JSONB для характеристик

Как именно хранить характеристики в JSONB? Варианты:

**A) Flat key-value object:**
```json
{"Материал": "Золото", "Проба": "585"}
```
- Простая фильтрация через `@>`
- Порядок отображения требует отдельную колонку/массив

**B) Array of objects:**
```json
[{"name": "Материал", "value": "Золото", "sortOrder": 1, "filterable": true}]
```
- Порядок и filterability встроены в структуру
- Фильтрация через `@>` с массивом сложнее

Нужно определить конкретный формат перед implementation.

## OAQ-02: Механизм нормализации ключей характеристик

Утверждено: ключи должны нормализоваться на application layer. Но конкретный механизм не определён:

- Отдельная таблица `characteristic_key` (нормализованные ключи)?
- Или динамический autocomplete из существующих JSONB данных?
- Или whitelist в application config?

## OAQ-03: Абстракция поиска

Утверждено: архитектура не должна препятствовать замене search implementation. Но конкретный уровень абстракции не определён:

- Интерфейс `ProductSearchPort` на уровне application layer?
- Или достаточно изолировать search queries в отдельный Repository?

## OAQ-04: Image processing pipeline

Утверждено: local filesystem + абстракция через ImageStoragePort. Но не определено:

- Количество и размеры image variants (thumbnail, medium, full)
- Формат (WebP only? WebP + original?)
- Когда обрабатывать (eager on upload? lazy on request?)
- Какая Java-библиотека для обработки

## OAQ-05: Конкретная JWT token strategy

Утверждено: JWT в httpOnly cookie, без blacklist. Но не определено:

- Access token TTL
- Refresh token TTL и механизм ротации
- Формат refresh token (JWT или opaque)

## OAQ-06: API versioning и URL structure

Утверждено: REST API. Но конкретная структура не определена:

- `/api/v1/public/...` vs `/api/v1/admin/...` — или другая схема?
- Versioning strategy (URL path vs header)

## OAQ-07: Pagination strategy

Не определено:

- Offset-based vs cursor-based
- Формат ответа (Spring `Page<T>` vs custom)
- Default page size

## OAQ-08: Конкретная стратегия для filterable characteristics

Утверждено: JSONB + нормализация ключей. Но не определено:

- Как определять, какие характеристики показывать как фильтры в каталоге?
- `is_filterable` флаг в JSONB? В отдельной таблице? В admin UI?

## OAQ-09: Error response format

Не определён единый формат ошибок API:

- Standard Spring problem detail (RFC 7807)?
- Custom format?

## OAQ-10: Rate limiting конкретика

Утверждено: Bucket4j (или аналог). Но не определено:

- Конкретные лимиты для inquiry submission
- Конкретные лимиты для login
- По IP? По другим параметрам?
