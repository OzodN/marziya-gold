# Architecture Research — Marziya Gold
## Jewelry Catalog + Inquiry System + Admin Panel

> **Source of Truth:** [`docs/product/requirements.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/requirements.md)
> **Discovery:** [`docs/product/discovery.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/discovery.md)
>
> This document presents architecture PROPOSALS based on research.
> Nothing here is an approved decision until explicit human approval.

---

# 1. Executive Summary

Marziya Gold is a **made-to-order jewelry catalog website** with an inquiry system and admin panel. It is NOT an e-commerce store. The architecture must support:

- **Image-heavy catalog** (~100–500 products, 3–8 photos each)
- **Dynamic product characteristics** (key-value, admin-managed, filterable)
- **Dynamic stone characteristics** (key-value, per-stone, admin-managed)
- **Anonymous inquiry submission** (cart → contact form → submit)
- **Admin panel** (product CRUD, inquiry management, status workflow)
- **Historical inquiry integrity** (snapshots that survive product edits/deletion)

**Proposed stack:**

| Layer | Technology |
|-------|-----------|
| Backend | Java 21 + Spring Boot 4.1.1 + Spring Security |
| Database | PostgreSQL (with JSONB, pg_trgm) |
| Migrations | Flyway |
| API | REST (JSON) |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS + Shadcn/UI |
| Image Storage | Local filesystem (MVP) → S3-compatible (future) |
| Auth | JWT in httpOnly cookie |

---

# 2. Frontend Architecture

## Decision: Next.js (App Router) with TypeScript

### Alternatives Considered

| Option | SEO | Image Optimization | Deployment | Complexity |
|--------|-----|-------------------|------------|------------|
| **Next.js (App Router)** | SSR/SSG built-in | `next/image` auto-optimization | Node.js container | Medium |
| React SPA (Vite) | Requires prerendering | Manual optimization | Static hosting | Low |
| Remix | SSR built-in | No built-in image | Node.js container | Medium |
| Astro | SSG-first | Manual | Static/Node.js | Low-Medium |

### Why Next.js

1. **SEO matters for jewelry catalogs.** Product and category pages will be shared via Telegram/WhatsApp (common in the +998 region). Next.js generates proper Open Graph tags server-side, ensuring rich link previews with product images and titles.

2. **`next/image` eliminates the need for backend image processing variants.** It auto-converts to WebP/AVIF, resizes per device, and lazy-loads — critical for a photography-heavy site.

3. **SSG/ISR for catalog pages.** Product and category pages can be statically generated and incrementally regenerated, giving near-instant load times without per-request SSR cost.

4. **Admin panel integration.** Single Next.js app with route groups: `(public)` for the catalog and `(admin)` for the admin panel. Shares TypeScript types, UI components, and API client.

### Trade-offs

- Requires a Node.js container for deployment (vs. static hosting for SPA)
- `next/image` uses server memory for on-demand image optimization
- App Router has a steeper learning curve than classic React SPA

### Consequences

- Two containers in production: Spring Boot 4.1.1 (Java) + Next.js (Node.js)
- Must configure Next.js middleware for admin route protection
- TypeScript types should mirror Java API DTOs for end-to-end type safety

### UI Framework

- **Shadcn/UI** — copy-paste components built on Radix UI primitives
- **Tailwind CSS** — utility-first styling
- **Embla Carousel** — lightweight, gesture-friendly gallery component for product images

---

# 3. Product Data Model Strategy

## Decision: JSONB columns for dynamic characteristics

### Approaches Researched

| Approach | Query Simplicity | Filter Performance | Admin CRUD | JPA Mapping | N+1 Risk |
|----------|-----------------|-------------------|------------|-------------|----------|
| **JSONB column** | ★★★★★ | ★★★★ (GIN index) | ★★★★ | ★★★★ (Hibernate 6) | None |
| EAV tables | ★★★ | ★★★ (multiple JOINs) | ★★★★★ | ★★★★★ | High |
| Normalized (Definition + Value) | ★★★ | ★★★★ | ★★★ | ★★★★ | Moderate |
| Hybrid (EAV + JSONB) | ★★★★ | ★★★★ | ★★ | ★★★ | Moderate |

### Why JSONB

1. **Read-heavy workload.** Catalog browsing dominates writes. JSONB fetches product + all characteristics in a single query with zero JOINs.

2. **Filtering via `@>` operator.** PostgreSQL's containment operator with a GIN index handles multi-attribute AND filtering efficiently:
   ```sql
   SELECT * FROM product
   WHERE characteristics @> '{"Материал": "Золото", "Проба": "585"}'::jsonb;
   ```

3. **Native Hibernate 6 support.** `@JdbcTypeCode(SqlTypes.JSON)` maps JSONB cleanly to Java POJOs.

4. **Snapshot alignment.** Since inquiry snapshots will also be JSONB, the same format is used for both live data and historical snapshots.

### JSONB Format

**Product characteristics** stored as a flat JSON object on the `product` table:
```json
{"Материал": "Золото", "Проба": "585", "Цвет": "Жёлтое золото"}
```

**Display order** stored as a separate JSONB array:
```json
["Материал", "Проба", "Цвет", "Коллекция", "Производство"]
```

**Stone characteristics** stored as JSONB on each `product_stone` row, same pattern.

### Filterable Characteristics

**Problem:** Not all characteristics should appear as catalog filters. The spec (§19) asks how to determine which are filterable.

**Proposal:** Include an `is_filterable` flag per characteristic entry. The admin panel allows toggling which characteristics appear in catalog filters. To prevent data entry fragmentation (typos in key names), the admin UI should offer a predefined/autocomplete list of known characteristic names.

### Trade-offs

- Updating a single characteristic requires rewriting the entire JSONB document (acceptable for low-write admin operations)
- No foreign key enforcement on characteristic names — typos create separate filter keys
- Bulk renaming a characteristic across all products requires a migration script or admin bulk-update feature

### Consequences

- Product table has a `characteristics` JSONB column and a `characteristics_order` JSONB array
- `product_stone` table has `characteristics` JSONB column and `characteristics_order` JSONB array
- GIN index on `product.characteristics` for filtering
- Admin UI must provide controlled input for characteristic names (autocomplete/dropdown from existing keys)

---

# 4. Search & Filtering

## Decision: PostgreSQL pg_trgm + ILIKE (no Elasticsearch)

### Search Strategy

| Approach | Typo Tolerance | Cyrillic | Morphology | Complexity | Scale Limit |
|----------|---------------|----------|-----------|------------|-------------|
| **pg_trgm + ILIKE** | ★★★★ | ★★★★★ | ★★ | ★★ | ~50K rows |
| Full-Text Search (tsvector) | ★ | ★★★★★ | ★★★★★ | ★★★ | ~1M rows |
| Simple ILIKE (no index) | ★ | ★★★★★ | ★ | ★ | ~5K rows |
| Elasticsearch | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ | Unlimited |

### Why pg_trgm

1. **Scale is small.** 100–2000 products. pg_trgm handles this trivially.
2. **Typo tolerance.** Trigram similarity catches "кальцо" → "кольцо" — valuable for a Cyrillic audience.
3. **ILIKE acceleration.** pg_trgm GIN index accelerates `ILIKE '%term%'` queries.
4. **No external infrastructure.** Zero operational overhead vs. Elasticsearch.

### Why NOT Elasticsearch

- Adds a JVM service (~1–2 GB RAM), data sync pipeline, and operational complexity
- For 2000 products, PostgreSQL is orders of magnitude simpler
- The project would only outgrow PostgreSQL search at ~100K+ products

### Filtering Strategy

Since characteristics are JSONB, catalog filtering uses the `@>` containment operator:

```sql
-- Multi-attribute AND filter
SELECT * FROM product
WHERE visible = true
  AND deleted = false
  AND category_id = :categoryId
  AND characteristics @> '{"Материал": "Золото", "Проба": "585"}'::jsonb;
```

### Faceted Filter Aggregation

To build dynamic filter panels (show available values per characteristic):

```sql
SELECT key, value, COUNT(*)
FROM product p, jsonb_each_text(p.characteristics)
WHERE p.category_id = :categoryId AND p.visible = true AND p.deleted = false
GROUP BY key, value
ORDER BY key, value;
```

### Category-Dependent Filters

Filter options should change based on selected category. When a user selects "Rings", only characteristics relevant to rings appear in the filter panel. This is achieved naturally by the aggregation query above — it only returns characteristics that exist on products in that category.

### Trade-offs

- No deep Russian morphology (stemming) — "золотое" won't match "золото" without full-text search
- If morphological search becomes critical, add `to_tsvector('russian', ...)` later without schema changes

### Consequences

- Enable `pg_trgm` extension in PostgreSQL
- GIN index on `product.name`, `product.sku` using `gin_trgm_ops`
- GIN index on `product.characteristics` using `jsonb_path_ops`
- Search endpoint combines ILIKE on name/SKU with optional full-text on description

---

# 5. Image Storage

## Decision: Local filesystem (MVP) with abstraction for future S3 migration

### Approaches Researched

| Approach | Complexity | Cost | Scalability | Backup | Deployment |
|----------|-----------|------|-------------|--------|------------|
| **Local filesystem + Nginx** | ★ (simplest) | Free | Single-server | Manual | Stateful |
| S3-compatible (AWS/DO/Yandex) | ★★★ | \$5–50/mo | Unlimited | Built-in | Stateless |
| MinIO (self-hosted S3) | ★★★★ | Free | Limited | Manual | Extra container |

### Why Local Filesystem for MVP

1. **Scale is trivial.** 500 products × 8 images × 3 variants = ~12,000 files, ~20–40 GB total.
2. **Zero external dependencies.** No cloud vendor, no SDK, no network latency.
3. **Nginx direct serving.** Nginx serves static files orders of magnitude faster than Spring Boot 4.1.1.

### Image Processing Pipeline

**When:** Eager (on upload). Admin uploads are infrequent; processing 3–8 images during upload is acceptable.

**What:**
- 3 variants per image: thumbnail (300px), gallery (800px), full/zoom (1600px)
- Convert to WebP format
- Strip EXIF data
- Use Java library: Thumbnailator or imgscalr

**Storage layout:**
```
/data/images/
  {product-uuid}/
    {image-uuid}_thumb.webp
    {image-uuid}_medium.webp
    {image-uuid}_full.webp
    {image-uuid}_original.jpg  (preserved for re-processing)
```

### Database Model

```
ProductImage:
  id (UUID)
  product_id (FK → Product)
  file_identifier (UUID)    -- NOT full path, NOT absolute URL
  sort_order (INT)
  is_primary (BOOLEAN)
  content_type (VARCHAR)
  original_size (BIGINT)
```

**Critical:** Store only `file_identifier`, NOT the full URL/path. Frontend/backend constructs the full URL from a configurable base URL (`IMAGE_BASE_URL`). This makes future S3 migration a single config change.

### Upload Security

- Validate file type via magic bytes (Apache Tika)
- Enforce size limit (10 MB per file)
- Discard original filenames, use UUID-based names
- Serve images from a directory outside the application root

### Future Migration Path

When the project outgrows local storage:
1. Copy files to S3 bucket
2. Change `IMAGE_BASE_URL` environment variable to S3/CDN URL
3. No code changes needed (file identifiers remain the same)

### Trade-offs

- Application is stateful (Docker volume required)
- Backup requires manual cron job (rsync/tar)
- No built-in CDN caching (add Cloudflare if needed)

### Consequences

- Docker Compose maps a host volume for image storage
- Nginx configuration serves `/images/` directly
- Daily backup script needed for the image volume

---

# 6. Inquiry Snapshot

## Decision: Full JSONB snapshot in InquiryItem

### Approaches Researched

| Approach | Historical Accuracy | Storage | Complexity | Survives Deletion |
|----------|-------------------|---------|-----------|-------------------|
| **Full JSONB snapshot** | ★★★★★ | ~1–2 KB/item | ★★ | ★★★★★ |
| Minimum fields only | ★★ | ~100 B/item | ★ | ★★ (depends on FK) |
| Normalized snapshot tables | ★★★★★ | ~1–2 KB/item | ★★★★★ | ★★★★★ |
| Version-based | ★★★★★ | None (reference) | ★★★★★ | ★★★★★ |

### Why Full JSONB Snapshot

1. **Requirement §32 is explicit:** "Historical inquiry must NOT change meaning when product data changes."
2. **Self-contained.** The snapshot contains everything the admin needs to understand what the customer requested, even if the product is later deleted or completely changed.
3. **Read-only data.** Snapshot is never queried/filtered/searched — it's purely for display in the admin panel. JSONB is ideal for this.
4. **Storage is negligible.** ~2 KB per item × 3 items × 1000 inquiries = ~6 MB total.

### Snapshot Structure

```json
{
  "name": "Кольцо Multibrand",
  "sku": "GLD-0052-ULX",
  "category": "Кольца",
  "description": "...",
  "characteristics": {"Материал": "Золото", "Проба": "585", ...},
  "stones": [
    {
      "type": "Бриллиант",
      "characteristics": {"Вес": "0.50 ct", "Форма": "Round", ...}
    }
  ],
  "primaryImagePath": "abc-123_medium.webp"
}
```

### Image References in Snapshot

- Store only the primary image `file_identifier` in the snapshot
- If images are later deleted from storage, the snapshot image will 404
- Acceptable trade-off: old inquiries having broken image thumbnails is a minor cosmetic issue for a lead management tool

### InquiryItem Table

```
InquiryItem:
  id (UUID)
  inquiry_id (FK → Inquiry)
  product_id (FK → Product, nullable)  -- nullable for hard-deleted products
  quantity (INT)
  snapshot_data (JSONB)                 -- full product snapshot
```

### Trade-offs

- Data duplication (same product info copied into every inquiry that references it)
- If primary image file is deleted from storage, snapshot image URL breaks
- JSONB snapshot is opaque — cannot query "all inquiries containing gold rings"

### Consequences

- Backend needs a snapshot mapper that serializes the full Product aggregate to JSONB at inquiry creation time
- Admin panel renders inquiry details from `snapshot_data`, not from the live Product record
- `product_id` is kept as a nullable FK for potential "view current product" linking

---

# 7. Cart Architecture

## Decision: localStorage + server-side validation on submission

### Approaches Researched

| Approach | Complexity | Cross-Device | Persistence | Server State |
|----------|-----------|-------------|-------------|-------------|
| **localStorage + server validation** | ★ (simplest) | None | Browser session | Stateless |
| Server-side anonymous cart | ★★★★ | Via cookie | Session-scoped | Stateful |
| URL-encoded cart | ★★ | Shareable | None (in URL) | Stateless |

### Why localStorage + Server Validation

1. **No customer accounts** (§29). Server-side cart requires anonymous session management — complexity without benefit.
2. **Stateless backend.** Cart does not exist on the server until inquiry submission.
3. **Natural flow.** Frontend manages cart state; server validates and creates snapshot at submission time.

### Cart Data Structure (Frontend)

```typescript
interface CartItem {
  productId: string;  // UUID
  quantity: number;
}
// Stored as JSON in localStorage key "marziya-cart"
```

Product details (name, image, SKU) are fetched from the API when rendering the cart page, not stored in localStorage. This ensures the customer always sees current product information.

### Submission Flow

1. Customer clicks "Submit Inquiry"
2. Frontend sends: `{ name, phone, comment?, items: [{productId, quantity}] }`
3. Server validates:
   - All product IDs exist in DB
   - All products are `visible = true` and `deleted = false`
   - Quantities are > 0 and ≤ max limit (e.g., 999)
   - At least 1 item in the list
4. If validation fails: return `400` with specific error codes per item
5. If valid: create Inquiry + InquiryItems with JSONB snapshots
6. Return `201` with inquiry number

### Edge Cases

- **Product deleted/hidden after adding to cart:** Server rejects with item-specific error. Frontend removes invalid items and shows notification.
- **Empty cart submission:** Prevented client-side (disabled button) AND server-side (validation).
- **Cart size limits:** Max 50 unique items, max 999 quantity per item.

### Trade-offs

- Cart lost on browser clear or device switch (acceptable given no customer accounts)
- No abandoned cart analytics (acceptable — no customer contact info anyway)

### Consequences

- No cart-related database tables or API endpoints (except inquiry submission)
- Frontend needs resilient error handling for `400` responses on submission
- Product detail API must be fast (called when rendering cart page)

---

# 8. Authentication & Admin

## Decision: JWT in httpOnly cookie, single User table, ROLE_ADMIN

### Auth Strategy

| Approach | Statelessness | Revocation | Complexity | CSRF Protection |
|----------|-------------|-----------|-----------|----------------|
| **JWT in httpOnly cookie** | ★★★★★ | ★★ (needs blacklist) | ★★★ | SameSite=Strict |
| Session-based | ★★ | ★★★★★ | ★★ | CSRF token |
| OAuth2/OIDC | ★★★★ | ★★★★★ | ★★★★★ | Provider-managed |

### Why JWT in httpOnly Cookie

1. **Stateless backend.** No server-side session storage needed.
2. **XSS protection.** httpOnly cookie prevents JavaScript access to the token.
3. **CSRF protection.** `SameSite=Strict` attribute prevents cross-site request forgery.
4. **Aligns with REST API architecture.**

### Token Strategy

- **Access token:** Short-lived (15–30 min), stored in httpOnly cookie
- **Refresh token:** Longer-lived (7 days), stored in httpOnly cookie, rotated on use
- **Revocation:** For single-admin MVP, immediate revocation is not critical. If needed later, add a token blacklist table.

### User Model

**Decision:** Design for multiple admins, launch with one.

```
User:
  id (UUID)
  username (VARCHAR, unique)
  password_hash (VARCHAR)  -- BCrypt
  role (VARCHAR)           -- 'ADMIN'
  is_active (BOOLEAN)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)
```

**Why multiple-ready:** The `changedBy` field in inquiry status history needs a stable user identifier. A single hardcoded admin in config prevents proper audit trails.

### Authorization

- **ROLE_ADMIN** — full access to all admin endpoints
- **Anonymous** — access to public catalog, search, inquiry submission
- **API path segregation:** `/api/v1/public/**` (anonymous) vs `/api/v1/admin/**` (ROLE_ADMIN)

### Password Security

- BCrypt hashing (Spring Security default)
- Rate limiting on `/api/v1/auth/login` via Bucket4j
- No account lockout (risk of admin locking themselves out)
- Password reset: manual DB update by developer (acceptable for single-admin MVP)

### Rate Limiting

- `/api/v1/public/inquiries` — rate limit by IP (e.g., 5/minute)
- `/api/v1/auth/login` — rate limit by IP (e.g., 10/minute)
- Implemented via Bucket4j filter in Spring Boot 4.1.1

### Audit Trail

- **Inquiry status changes:** Dedicated `inquiry_status_history` table (spec §17)
- **Entities:** `@CreatedDate`, `@LastModifiedDate` via Spring Data JPA Auditing
- **No full entity versioning** (Envers not justified for this scale)

### Future Extensibility

- **Multi-tenancy:** Deferred. No `shop_id` or `tenant_id` columns.
- **UUIDs for primary keys:** Used everywhere, enabling future distributed scenarios.
- **Decision:** YAGNI. Build for single-master now, migrate if business model changes.

### Trade-offs

- JWT revocation is eventual (token expires naturally) — acceptable for single admin
- No self-service password reset — admin contacts developer
- No granular permissions — all admins have full access

### Consequences

- Spring Security filter chain with two security configurations: public and admin
- Bucket4j dependency for rate limiting
- Pre-seeded admin user via Flyway migration or application startup

---

# 9. Product Lifecycle

## Decision: Soft delete with `deleted` boolean + separate `visible` boolean

### Deletion Strategy

| Approach | Data Safety | Query Complexity | Inquiry Integrity | Unique Constraints |
|----------|-----------|-----------------|-------------------|-------------------|
| **Soft delete (boolean)** | ★★★★★ | ★★★ (WHERE clause) | ★★★★★ | Partial index |
| Hard delete | ★ | ★★★★★ | ★★ (breaks FK) | Standard |
| Archive table | ★★★★ | ★★★★ | ★★★ | Separate table |

### Why Soft Delete

1. **Inquiry integrity.** InquiryItem has a FK to Product. Soft delete keeps the FK valid.
2. **Combined with JSONB snapshot.** Double safety — even if soft-deleted product data changes, the snapshot preserves the original.
3. **Undo capability.** Admin can potentially "undelete" a product.

### State Matrix

| State | `visible` | `deleted` | In Catalog | In Admin | In Inquiry |
|-------|----------|----------|-----------|---------|-----------|
| Active + Visible | `true` | `false` | ✅ | ✅ | ✅ |
| Active + Hidden | `false` | `false` | ❌ | ✅ | ✅ |
| Deleted | any | `true` | ❌ | ❌ (unless filtered) | ✅ (via snapshot) |

### Unique SKU with Soft Delete

Standard UNIQUE constraint breaks when a deleted product's SKU needs to be reused.

**Solution:** PostgreSQL partial unique index:
```sql
CREATE UNIQUE INDEX idx_product_sku_unique ON product(sku) WHERE deleted = false;
```

### JPA Implementation

Use Hibernate 6.3+ `@SQLRestriction("deleted = false")` on the Product entity to automatically filter deleted products from all queries.

### Category Lifecycle

- **Hiding:** Hidden category removed from navigation, but products in it remain searchable/accessible via direct link (unless individually hidden)
- **Deletion:** RESTRICT foreign key. Admin cannot delete a category while products are assigned to it. Must reassign products first.

### Stone Type Lifecycle

- **Deactivation:** `is_active = false`. Deactivated type doesn't appear in admin dropdown for new stones, but existing product stones with that type remain valid and visible.
- **Deletion:** RESTRICT. Cannot delete a stone type if any ProductStone references it.

### Cascading Effects

| Trigger | ProductImages | ProductCharacteristics | ProductStones | StoneCharacteristics |
|---------|-------------|---------------------|-------------|-------------------|
| Product soft-deleted | Remain (parent filtered) | Remain (parent filtered) | Remain (parent filtered) | Remain (parent filtered) |
| Product hard-deleted | CASCADE delete | N/A (JSONB on product) | CASCADE delete | N/A (JSONB on stone) |
| Category hidden | No cascade | — | — | — |
| Stone type deactivated | — | — | No cascade | — |

### Audit Fields

| Entity | created_at | updated_at | created_by | updated_by | deleted_at |
|--------|-----------|-----------|-----------|-----------|-----------|
| Product | ✅ | ✅ | ✅ | ✅ | ✅ (or deleted boolean) |
| Category | ✅ | ✅ | — | — | — |
| StoneType | ✅ | ✅ | — | — | — |
| Inquiry | ✅ | ✅ | — | — | — |
| User | ✅ | ✅ | — | — | — |

### Trade-offs

- All public queries must include `WHERE deleted = false` (Hibernate `@SQLRestriction` automates this)
- Soft-deleted products consume storage indefinitely
- Partial unique index is PostgreSQL-specific (not portable to other DBs — acceptable since PostgreSQL is a fixed decision)

### Consequences

- `Product` table gets `deleted` (boolean) and `visible` (boolean) columns
- `Category` table gets `visible` (boolean)
- `StoneType` table gets `is_active` (boolean)
- Foreign keys use RESTRICT for lookups, CASCADE for composition

---

# 10. Cross-Cutting Concerns

## 10.1 API Design

```
Public API (anonymous):
  GET    /api/v1/public/categories
  GET    /api/v1/public/products             (search, filter, paginate)
  GET    /api/v1/public/products/{id}
  GET    /api/v1/public/contacts
  POST   /api/v1/public/inquiries

Admin API (ROLE_ADMIN):
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout

  GET    /api/v1/admin/dashboard/stats

  GET    /api/v1/admin/products              (paginated, include hidden/deleted)
  POST   /api/v1/admin/products
  GET    /api/v1/admin/products/{id}
  PUT    /api/v1/admin/products/{id}
  DELETE /api/v1/admin/products/{id}         (soft delete)
  PATCH  /api/v1/admin/products/{id}/visibility

  POST   /api/v1/admin/products/{id}/images
  DELETE /api/v1/admin/products/{id}/images/{imageId}
  PUT    /api/v1/admin/products/{id}/images/order

  GET    /api/v1/admin/categories
  POST   /api/v1/admin/categories
  PUT    /api/v1/admin/categories/{id}
  DELETE /api/v1/admin/categories/{id}
  PUT    /api/v1/admin/categories/order

  GET    /api/v1/admin/stone-types
  POST   /api/v1/admin/stone-types
  PUT    /api/v1/admin/stone-types/{id}

  GET    /api/v1/admin/inquiries             (paginated, filterable by status)
  GET    /api/v1/admin/inquiries/{id}
  PATCH  /api/v1/admin/inquiries/{id}/status
  GET    /api/v1/admin/inquiries/{id}/history

  GET    /api/v1/admin/settings/contacts
  PUT    /api/v1/admin/settings/contacts
  GET    /api/v1/admin/settings/master-info
  PUT    /api/v1/admin/settings/master-info
```

## 10.2 Pagination

- **Offset-based pagination** for catalog (products, inquiries)
- Standard format: `?page=0&size=20&sort=createdAt,desc`
- Spring Data `Pageable` support built-in
- Cursor-based pagination not needed at this scale

## 10.3 Internationalization

- **Single language: Russian** for MVP
- All product data in Russian
- Admin panel UI in Russian
- If multilingual is needed later, it's a significant data model change (defer)

## 10.4 Error Handling

- Standard error response format: `{ code, message, details }`
- Validation errors: `400` with field-level details
- Auth errors: `401` / `403`
- Not found: `404`
- Rate limited: `429`

## 10.5 CORS

- If Next.js and Spring Boot 4.1.1 are on different origins: configure CORS on Spring Security
- If same origin (reverse proxy): CORS not needed

---

# 11. Alternatives Considered

## 11.1 Rejected: Elasticsearch for Search

**Why rejected:** Massive operational overhead (JVM, data sync, memory) for a catalog of 100–2000 products. PostgreSQL pg_trgm + ILIKE handles this scale effortlessly.

## 11.2 Rejected: EAV Tables for Dynamic Characteristics

**Why rejected:** Multi-attribute AND filtering requires multiple JOINs or correlated subqueries. JSONB `@>` operator is significantly simpler and faster. EAV also introduces N+1 risks with JPA.

## 11.3 Rejected: Server-Side Anonymous Cart

**Why rejected:** No customer accounts means no stable identity for cart association. Session-based anonymous carts require cleanup jobs and add complexity without meaningful benefit.

## 11.4 Rejected: MinIO for Image Storage

**Why rejected:** Another stateful container to manage with no benefit over local filesystem for MVP scale. When the project outgrows local storage, go directly to managed S3, not MinIO.

## 11.5 Rejected: Normalized Snapshot Tables for Inquiries

**Why rejected:** Creates mirror tables (InquiryItemCharacteristic, InquiryItemStone, etc.) for read-only historical data. Massive schema complexity for data that is never queried or filtered.

## 11.6 Rejected: Product Versioning for Snapshots

**Why rejected:** Every product edit creates a version record. Overkill for a jewelry catalog where minor typo fixes are common.

## 11.7 Rejected: Session-Based Authentication

**Why rejected:** Requires server-side session storage (memory or Redis), adding statefulness. JWT + httpOnly cookie achieves the same security with stateless backend.

## 11.8 Rejected: Hard Delete for Products

**Why rejected:** Breaks foreign keys from InquiryItem. While JSONB snapshots survive deletion, keeping the FK valid via soft delete provides double safety.

## 11.9 Rejected: OAuth2/OIDC

**Why rejected:** Massive infrastructure overhead for a single-admin jewelry website.

## 11.10 Deferred: Multi-Tenancy

**Why deferred:** YAGNI. Current business model is single-master. Adding tenant columns now complicates every query without current benefit.

---

# 12. Recommended Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────┐
│              Nginx Reverse Proxy          │
│  - Static image serving (/images/)        │
│  - Proxy to Next.js (/)                   │
│  - Proxy to Spring Boot 4.1.1 (/api/)           │
│  - SSL termination                        │
└──────────┬────────────┬──────────────────┘
           │            │
     ┌─────▼─────┐  ┌──▼───────────┐
     │  Next.js   │  │ Spring Boot 4.1.1  │
     │  (Node.js) │  │  (Java 21)   │
     │            │  │              │
     │ - SSR/SSG  │  │ - REST API   │
     │ - Public   │  │ - Auth (JWT) │
     │ - Admin    │  │ - Business   │
     │ - Image    │  │ - Image      │
     │   optim.   │  │   processing │
     └────────────┘  └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  PostgreSQL  │
                     │              │
                     │ - Products   │
                     │ - JSONB      │
                     │ - pg_trgm    │
                     │ - Inquiries  │
                     └──────────────┘

  Image Storage: Local filesystem (Docker volume)
  Served by: Nginx (direct static file serving)
```

## Entity Model Overview

```
User (admin accounts)
  │
Category ────────── Product ──┬── ProductImage
  (flat, ordered,     │       └── ProductStone
   visible)           │             (stone_type FK, characteristics JSONB)
                      │
                      ├── characteristics (JSONB)
                      ├── visible (boolean)
                      └── deleted (boolean)

StoneType (data-driven, is_active)

SiteSettings (key-value for phone, telegram, master info)

Inquiry ──── InquiryItem (product_id nullable FK, quantity, snapshot_data JSONB)
  │
  ├── customer_name, customer_phone, comment
  ├── status (enum)
  └── InquiryStatusHistory (old_status, new_status, changed_by FK, changed_at)
```

## Deployment (Docker Compose)

```yaml
services:
  nginx:       # Reverse proxy + static image serving
  frontend:    # Next.js (Node.js)
  backend:     # Spring Boot 4.1.1 (Java 21)
  postgres:    # PostgreSQL 16
volumes:
  image-data:  # Persistent image storage
  pg-data:     # PostgreSQL data
```

---

# 13. Decisions Requiring Human Approval

These decisions are proposals, NOT approved architecture. Each requires explicit confirmation.

## DECISION-01: Next.js as Frontend Framework
- **Impact:** Deployment complexity, Node.js container requirement, SEO strategy
- **Alternative:** React SPA (Vite) — simpler deployment but no SSR/SEO

## DECISION-02: JSONB for Dynamic Characteristics
- **Impact:** Core data model, all filtering queries, admin CRUD patterns
- **Alternative:** EAV tables — more traditional but more complex queries

## DECISION-03: pg_trgm for Search (No Elasticsearch)
- **Impact:** Search quality, infrastructure simplicity
- **Alternative:** PostgreSQL FTS, or Elasticsearch for better relevance

## DECISION-04: Local Filesystem for Images (MVP)
- **Impact:** Deployment is stateful, backup needed
- **Alternative:** S3-compatible storage from day one

## DECISION-05: Full JSONB Snapshot in InquiryItem
- **Impact:** Data duplication, historical accuracy
- **Alternative:** Minimum fields only (name + SKU + quantity)

## DECISION-06: localStorage Cart (No Server-Side Cart)
- **Impact:** Cart lost on browser clear, no cross-device sync
- **Alternative:** Server-side anonymous cart with session cookie

## DECISION-07: JWT Authentication (Not Session-Based)
- **Impact:** Token revocation is eventual, stateless backend
- **Alternative:** Spring Security session-based auth

## DECISION-08: Soft Delete for Products
- **Impact:** All queries need WHERE clause, partial unique indexes
- **Alternative:** Hard delete (simpler queries but breaks FKs)

## DECISION-09: Single Next.js App for Public + Admin
- **Impact:** Shared codebase, shared deployment, larger bundle
- **Alternative:** Separate SPA for admin panel

## DECISION-10: Admin Panel Responsive (Not Desktop-Only)
- **Impact:** More frontend effort for admin
- **Alternative:** Desktop-only admin (spec §35 requires responsive admin)

---

# 14. Architecture Risks

## RISK-01: JSONB Characteristic Name Fragmentation
**Severity:** Medium
**Description:** Admin typing characteristic names manually can create duplicates (e.g., "Цвет" vs "Цвет " vs "цвет"). These become separate filter keys.
**Mitigation:** Admin UI provides autocomplete/dropdown from existing characteristic names. Server-side trim and normalization.

## RISK-02: Next.js Image Optimization Memory Usage
**Severity:** Low-Medium
**Description:** `next/image` on-demand optimization can spike Node.js memory usage under concurrent requests.
**Mitigation:** Pre-generate image variants on upload (backend); use `next/image` with `unoptimized` prop pointing to pre-optimized files. Or set appropriate memory limits on the container.

## RISK-03: JSONB Column Updates Are Full-Rewrites
**Severity:** Low
**Description:** Updating a single characteristic requires rewriting the entire JSONB document.
**Mitigation:** Acceptable for admin-only write operations. Catalog reads are unaffected.

## RISK-04: JWT Token Revocation Delay
**Severity:** Low
**Description:** If admin JWT is compromised, it remains valid until expiry (15-30 min).
**Mitigation:** Short access token TTL. For critical scenarios, add a token blacklist table checked on each request (adds statefulness).

## RISK-05: Image File Deletion Inconsistency
**Severity:** Low
**Description:** If an image file is deleted from filesystem but the ProductImage DB record remains (or vice versa), inconsistency occurs.
**Mitigation:** Transactional deletion (delete DB record + file together). Periodic consistency check script.

## RISK-06: Snapshot Image URL Breaking
**Severity:** Low
**Description:** If image files are deleted from storage after an inquiry references them, the inquiry snapshot shows a broken image.
**Mitigation:** Accept as minor cosmetic issue. Alternatively, never delete original image files (only soft-delete DB records).

---

# 15. Implementation Readiness

## Ready to Implement (After Approval)

| Component | Status | Blocking Decisions |
|-----------|--------|-------------------|
| Database schema (PostgreSQL + Flyway) | Ready to design | DECISION-02, DECISION-05, DECISION-08 |
| Spring Boot 4.1.1 project setup | Ready | DECISION-07 |
| REST API structure | Ready to design | All decisions |
| Next.js project setup | Ready | DECISION-01, DECISION-09 |
| Image upload pipeline | Ready | DECISION-04 |
| Auth system | Ready | DECISION-07 |
| Admin panel | Ready | DECISION-01, DECISION-09 |

## Recommended Implementation Order

1. **Phase 1: Foundation**
   - Spring Boot 4.1.1 project skeleton + PostgreSQL + Flyway
   - Core entities: User, Category, StoneType, Product, ProductImage, ProductStone
   - Auth: JWT login/logout
   - Basic admin CRUD APIs

2. **Phase 2: Catalog & Search**
   - Public catalog API (list, detail, search, filter)
   - pg_trgm search
   - JSONB characteristic filtering

3. **Phase 3: Frontend (Public)**
   - Next.js setup
   - Landing page, catalog, product detail
   - Gallery/zoom, responsive design
   - Cart (localStorage)

4. **Phase 4: Inquiry System**
   - Inquiry submission API
   - JSONB snapshot creation
   - Inquiry listing/detail in admin
   - Status workflow + history

5. **Phase 5: Admin Panel**
   - Product editor (full CRUD + images + characteristics + stones)
   - Category/stone type management
   - Settings (contacts, master info)
   - Dashboard

6. **Phase 6: Polish**
   - Rate limiting
   - Image optimization pipeline
   - SEO meta tags
   - Mobile UX refinement
   - Backup scripts

## Unresolved Questions (Deferred to Next Phase)

- Cart terminology: "Корзина" vs "Моя подборка" — UX decision, not architecture
- Dashboard widgets — design decision, not architecture
- Catalog sort order — configurable via API, implementation detail
- Post-inquiry customer feedback — UX copy decision
- Max quantity per item — validation rule, implementation detail
