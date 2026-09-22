# Product Discovery & Requirements Analysis
## Marziya Gold — Jewelry Catalog Site + Inquiry System + Admin Panel

> **Source of Truth:** [`docs/product/requirements.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/requirements.md)
>
> This document extracts, analyzes, and questions the specification. It does NOT modify the source specification.
> Every proposed change references the original requirement and is clearly marked.

---

# 1. Product Understanding

## What the product IS

A **catalog-style website** for a jewelry master/company. The site displays handmade jewelry items with detailed information, allows customers to build a selection (cart/подборка) of items with quantities, and submit an inquiry (заявка) to the seller. The seller manages everything through an admin panel.

## What the product is NOT

- Not an e-commerce store (no prices, no payments, no checkout)
- Not a marketplace
- Not a CMS/page builder
- Not a customer account system

## Core business model

1. All items are **made-to-order** (под заказ)
2. No inventory/stock model
3. No prices displayed on site
4. Customer submits inquiry → seller contacts customer offline (phone/Telegram) to discuss price, details, production
5. The site is a **lead generation and product showcase tool**

## Key actors

| Actor | Role |
|-------|------|
| **Customer** (anonymous) | Browses catalog, builds selection, submits inquiry, contacts seller via Telegram/phone |
| **Administrator** (master/seller) | Manages products, categories, stone types, inquiries, contact info via admin panel |
| **Developer** | Controls site structure, layout, UX, business logic, API, DB schema |

---

# 2. Explicit Requirements

## 2.1 Product/Catalog Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-PROD-01 | Each product has: name, SKU (артикул), category, description, images, 0..N dynamic characteristics, 0..N stones | §4 |
| R-PROD-02 | Dynamic characteristics are key-value pairs (name \| value), not fixed fields | §5 |
| R-PROD-03 | Characteristics support: add, delete, rename, re-value, reorder — all via admin panel | §5 |
| R-PROD-04 | Each product can have 0..N stones, each stone is a separate object | §6 |
| R-PROD-05 | Each stone has: type/name, 0..N dynamic characteristics, display order | §7 |
| R-PROD-06 | Stone characteristics are also key-value, not fixed fields | §7 |
| R-PROD-07 | Products have a visibility flag (show/hide), not stock status | §28 |
| R-PROD-08 | Multiple images per product, one primary image, ordered, add/delete/drag-and-drop sort | §27 |
| R-PROD-09 | No price field on product | §3 |
| R-PROD-10 | No stock/inventory fields | §1, §10 |

## 2.2 Category Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-CAT-01 | Categories are data-driven, not hardcoded enums | §22 |
| R-CAT-02 | Admin can: create, rename, hide, reorder categories | §22 |
| R-CAT-03 | Flat structure only — no nested/hierarchical categories | §22 |

## 2.3 Stone Type Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-STONE-01 | Stone types are data-driven, not enums | §23 |
| R-STONE-02 | Admin can add new stone types | §23 |
| R-STONE-03 | ProductStone + StoneCharacteristic mechanism is fixed (developer-controlled) | §23 |

## 2.4 Cart/Selection Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-CART-01 | Cart is for building inquiry, not for payment | §11 |
| R-CART-02 | Cart contains: image, name, SKU, quantity, remove, change quantity | §11 |
| R-CART-03 | Customer selects quantity before adding to cart (stepper: [-] N [+]) | §10 |
| R-CART-04 | Quantity can be changed after adding to cart | §10 |
| R-CART-05 | No stock validation on quantity | §10 |

## 2.5 Inquiry Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-INQ-01 | Inquiry is created from cart contents | §12 |
| R-INQ-02 | Customer provides: name, phone, comment (optional) | §12 |
| R-INQ-03 | Inquiry appears in admin panel (primary notification channel) | §13 |
| R-INQ-04 | No Telegram Bot, WhatsApp, or email as primary notification | §13 |
| R-INQ-05 | Statuses: NEW, CONTACTED, IN_PROGRESS, REJECTED, COMPLETED | §15 |
| R-INQ-06 | Status change requires explicit save action | §16 |
| R-INQ-07 | Admin can change status back (correct mistakes) | §15, §16 |
| R-INQ-08 | Unsaved changes warning on page leave | §16 |
| R-INQ-09 | Status change history: oldStatus, newStatus, changedBy, changedAt | §17 |
| R-INQ-10 | Snapshot data in InquiryItem — minimum: productId, name at time of inquiry, SKU, quantity | §32 |

## 2.6 Search Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-SEARCH-01 | Search must cover at minimum: name, SKU | §18 |
| R-SEARCH-02 | May also cover: description, category, stone type | §18 |
| R-SEARCH-03 | Must be fast and convenient | §18 |

## 2.7 Filter Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-FILTER-01 | Filter by: category, material, purity, color, collection, has stone, stone type | §19 |
| R-FILTER-02 | Filter architecture must account for dynamic characteristics | §19 |
| R-FILTER-03 | Cannot hardcode each characteristic as a Java field | §19 |

## 2.8 UI/UX Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-UX-01 | Product page: left = gallery/zoom/swipe; right = info/cart/contacts; below = description | §8 |
| R-UX-02 | Stone info blocks: conditional rendering (0, 1, N stones) | §9 |
| R-UX-03 | Premium/elegant minimal visual style | §34 |
| R-UX-04 | Photography is a primary UI element | §34 |
| R-UX-05 | Inquiry submission should require minimum steps | §34 |
| R-UX-06 | Responsive/mobile design is mandatory | §35 |
| R-UX-07 | Telegram and phone contact buttons on product page | §2 |

## 2.9 Admin Panel Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-ADMIN-01 | Sections: Dashboard, Catalog, Inquiries, Categories, Stone Types, Master Info, Contacts | §20 |
| R-ADMIN-02 | Full CRUD for products with all sub-entities | §21 |
| R-ADMIN-03 | Inquiry management with status workflow | §14-17 |
| R-ADMIN-04 | Admin manages DATA only, not layout/UX | §24, §26 |
| R-ADMIN-05 | Not a page builder, not a block builder | §24 |
| R-ADMIN-06 | Responsive admin panel | §35 |

## 2.10 Security Requirements

| ID | Requirement | Source |
|----|------------|--------|
| R-SEC-01 | Closed admin panel with authentication/authorization | §33 |
| R-SEC-02 | Password security | §33 |
| R-SEC-03 | Session/token strategy | §33 |
| R-SEC-04 | Protected admin API endpoints | §33 |
| R-SEC-05 | Input validation | §33 |
| R-SEC-06 | File upload security | §33 |
| R-SEC-07 | Rate limiting where sensible | §33 |
| R-SEC-08 | Audit trail for critical operations | §33 |

## 2.11 Technical Requirements (Already Specified)

| ID | Requirement | Source |
|----|------------|--------|
| R-TECH-01 | Backend: Java 21, Spring Boot 4.1.1, Spring Security, PostgreSQL, Flyway, REST API | §30 |
| R-TECH-02 | Frontend: to be decided (React, Next.js, or other — must be compared) | §30 |
| R-TECH-03 | Monolithic architecture (no microservices unless justified) | §37 (rule H) |
| R-TECH-04 | Images not stored as binary in PostgreSQL | §27 |
| R-TECH-05 | Realtime inquiry notifications — MVP-rational approach (polling/SSE/WebSocket) | §13 |

---

# 3. Business Rules

| ID | Rule | Source |
|----|------|--------|
| BR-01 | All products are made-to-order; there is no concept of stock, availability, or sold-out | §1 |
| BR-02 | No prices displayed anywhere on the public site | §3 |
| BR-03 | No payment processing of any kind | §3 |
| BR-04 | No customer accounts or registration | §29 |
| BR-05 | A single inquiry can contain multiple products, each with a specified quantity | §11, §12 |
| BR-06 | The seller receives inquiries exclusively through the admin panel | §13 |
| BR-07 | Telegram/phone on product pages are direct contact channels, separate from the inquiry mechanism | §2 |
| BR-08 | Historical inquiries must not change meaning when product data is later modified | §32 |
| BR-09 | Status transitions are not restricted to a forward-only flow; admin can correct mistakes | §15, §16 |
| BR-10 | Adding a new product characteristic must never require developer involvement | §5 |
| BR-11 | Categories are flat (single level), no arbitrary nesting | §22 |

---

# 4. User Journeys

## 4.1 Customer: Browse & Inquire (Primary Flow)

```
Landing Page
  → Catalog (all products or by category)
    → Search / Filter
      → Product Detail Page
        → View images (gallery, zoom, swipe on mobile)
        → View characteristics
        → View stone information
        → Select quantity
        → Add to cart/selection
          → (continue browsing, add more items)
      → Cart/Selection page
        → Review items, adjust quantities, remove items
        → Fill contact form (name, phone, optional comment)
        → Submit inquiry
          → Confirmation/thank-you feedback
```

## 4.2 Customer: Direct Contact (Alternate)

```
Product Detail Page
  → Click Telegram button → opens Telegram
  → Click Phone button → initiates call
```

## 4.3 Admin: Manage Inquiry

```
Admin Dashboard
  → View new inquiry count/list
  → Open inquiry detail
    → Review customer info + product snapshot
    → Change status (select new → save)
    → View status history
```

## 4.4 Admin: Manage Product

```
Admin Catalog
  → Create new product
    → Set name, SKU, category, description
    → Upload images, set primary, reorder
    → Add dynamic characteristics (name/value pairs), reorder
    → Add stones (select type, add characteristics), reorder
    → Set visibility
    → Save
  → Edit existing product (same fields)
  → Hide/show product
  → Delete product
```

## 4.5 Admin: Manage Categories / Stone Types / Settings

```
Admin → Categories → CRUD + reorder + visibility
Admin → Stone Types → CRUD + active/inactive
Admin → Master Info → Edit name, description, photo
Admin → Contacts → Edit phone, Telegram
```

---

# 5. Admin Capabilities

## 5.1 What Admin CAN Do (§25)

| Area | Capabilities |
|------|-------------|
| **Products** | Full CRUD, visibility toggle, image management, dynamic characteristics CRUD+reorder, stones CRUD+reorder, stone characteristics CRUD+reorder |
| **Categories** | Create, rename, reorder, hide/show |
| **Stone Types** | Create, rename, activate/deactivate |
| **Master Info** | Edit name, description, photo |
| **Contacts** | Edit phone, Telegram, other contact data |
| **Inquiries** | View list, view detail (with snapshot), change status (with explicit save), view status history |

## 5.2 What Admin CANNOT Do (§24)

- Change logo, hero image, banners
- Modify site layout/structure
- Rearrange page blocks
- Change navigation structure
- Modify product card/page format
- Alter cart mechanics or inquiry mechanism
- Create arbitrary page hierarchy
- Create nested category trees

---

# 6. Fixed vs Configurable Boundaries

| Element | Controlled By | Source |
|---------|--------------|--------|
| Logo, hero, banners | Developer (fixed) | §24 |
| Main heading, subheading | Developer (fixed) | §24 |
| Page structure, block layout | Developer (fixed) | §24 |
| Navigation structure | Developer (fixed) | §24 |
| UI components, design | Developer (fixed) | §24 |
| Product card/page format | Developer (fixed) | §24 |
| Cart mechanics | Developer (fixed) | §24 |
| Inquiry mechanism | Developer (fixed) | §24 |
| API structure, DB schema | Developer (fixed) | §24 |
| Access control/permissions | Developer (fixed) | §24 |
| Business logic | Developer (fixed) | §24 |
| Product data (names, SKUs, descriptions, images) | Admin (configurable) | §25 |
| Dynamic characteristics | Admin (configurable) | §25 |
| Stones and stone characteristics | Admin (configurable) | §25 |
| Categories (names, order, visibility) | Admin (configurable) | §25 |
| Stone types (names, active/inactive) | Admin (configurable) | §25 |
| Master info (name, description, photo) | Admin (configurable) | §25 |
| Contact info (phone, Telegram) | Admin (configurable) | §25 |
| Inquiry statuses | Admin (change status per inquiry) | §25 |

---

# 7. Contradictions

## C-01: Inquiry snapshot depth vs simplicity

- **§32** defines minimum snapshot: productId, name, SKU, quantity
- **§32** also asks to decide whether to also save characteristics, stones, etc.
- **§34** says "user should not have to ask the master for basic characteristics"
- **§14** shows the inquiry detail with only name, SKU, quantity — no characteristics

**Problem:** If the inquiry snapshot stores only name+SKU+quantity, and the master later edits the product, the admin reviewing an old inquiry loses context about *what exactly* the customer saw. But storing full characteristics + stones as a snapshot adds significant data model complexity.

**This is not a contradiction per se, but an explicit open question acknowledged by the spec itself (§32).**

## C-02: "Cart" naming vs product concept

- **§11** says the cart is not for payment but for inquiry building
- **§11** suggests maybe calling it "Моя подборка" (My Selection) instead
- **§34** says "корзина/подборка должна быть простой"

**Problem:** The spec uses "корзина" (cart) throughout but notes this may not be the right UI term. This is a UX decision that affects copy across the entire site (button labels, page titles, empty states, etc.) and needs to be resolved before frontend development.

**Status: Explicitly flagged as unresolved by the spec.**

## C-03: Realtime notifications vs MVP simplicity

- **§13** says the primary notification channel is the admin panel
- **§13** suggests considering polling/SSE/WebSocket for realtime
- **§37 rule 4** says "don't add complexity just for production-grade"

**Problem:** These are not contradictory but represent a tension. The spec acknowledges this and asks for a "rational MVP approach."

## C-04: Filterable dynamic characteristics

- **§19** lists specific filter fields: category, material, purity, color, collection, stone type
- **§5** says characteristics must be fully dynamic key-value pairs
- **§19** says "cannot turn each characteristic into a hardcoded Java field"
- But **§19** also asks to solve: "how to determine which dynamic characteristics participate in filtering"

**Problem:** The listed filter fields (material, purity, color, collection) are specific named characteristics, but the data model stores them as generic key-value pairs. This creates a tension: either the admin must explicitly mark certain characteristics as "filterable" (adding admin complexity), or the system must rely on well-known characteristic names (reducing dynamism), or the system must dynamically aggregate all distinct characteristic names and values (performance concern).

**This is a core architectural question that must be resolved.**

---

# 8. Ambiguities / Open Questions

## Q-01: Frontend technology stack
**Source:** §30
**Question:** React, Next.js, or another framework? The spec explicitly asks for a comparison before deciding.
**Impact:** Affects SEO, SSR/SSG strategy, image optimization, build/deploy pipeline, developer experience.

## Q-02: Cart persistence mechanism
**Source:** §11
**Not addressed in spec.**
**Question:** Where is the cart stored? Options:
- Browser localStorage (simplest, lost on device change)
- Session-based server-side (requires session management for anonymous users)
- Cookie-based
**Impact:** If the customer closes the browser and returns, is the cart still there? If they open on another device?

## Q-03: Cart terminology
**Source:** §11
**Question:** "Корзина" or "Моя подборка" or another term? This affects all UI copy.

## Q-04: Inquiry snapshot depth
**Source:** §32
**Question:** Beyond minimum (productId, name, SKU, quantity), should we also store:
- Product characteristics at time of inquiry?
- Stone information at time of inquiry?
- Primary image URL/reference?
**Trade-off:** Data duplication vs historical accuracy.

## Q-05: Which dynamic characteristics are filterable?
**Source:** §19
**Question:** How does the system know which of the many possible dynamic characteristics should appear as filters?
Options:
- Admin explicitly marks certain characteristics as "filterable" (UI and data model addition)
- Developer configures a whitelist of well-known characteristic names
- System auto-aggregates all distinct characteristic names that have enough products
**Impact:** Core architecture decision for filtering.

## Q-06: Single admin user or multiple admin users?
**Source:** §20, §33
**Question:** The spec mentions "administrator = master / seller" (singular). Is this always one person, or could there be multiple admin accounts?
**Impact:** Affects User model, audit trail (changedBy), and role/permission complexity.

## Q-07: Image storage backend
**Source:** §27
**Question:** Local filesystem, S3/MinIO object storage, or cloud CDN?
**Impact:** Deployment architecture, cost, performance, backup strategy.

## Q-08: Image optimization pipeline
**Source:** §27
**Question:** Server-side processing (thumbnails, WebP/AVIF conversion) — when does it happen?
- On upload (eager)?
- On first request (lazy)?
- External service?
**Impact:** Upload UX, server resource requirements, frontend strategy.

## Q-09: Post-inquiry customer feedback
**Source:** §2, §12
**Not addressed in spec.**
**Question:** After submitting an inquiry, what does the customer see?
- A simple "thank you" message?
- An inquiry number for reference?
- Any email/SMS confirmation?
**Impact:** Customer experience and trust.

## Q-10: Inquiry deduplication / spam prevention
**Source:** §12, §33
**Not explicitly addressed.**
**Question:** Can the same person submit the same inquiry multiple times? Is there rate limiting on inquiry submission?
**Impact:** Admin inbox clutter, potential abuse.

## Q-11: Product deletion vs. soft delete
**Source:** §21
**Question:** When admin deletes a product, is it hard-deleted or soft-deleted?
**Impact:** If hard-deleted, and an inquiry references it (even via snapshot), orphaned data issues arise. Soft delete is safer but adds complexity.

## Q-12: Category deletion
**Source:** §22
**Not addressed.**
**Question:** What happens when a category is deleted/hidden and products are still assigned to it?
**Impact:** Orphaned products, broken catalog filtering.

## Q-13: Language / localization
**Source:** Not addressed.
**Question:** The spec is written in Russian; the site appears to target a Russian/Uzbek-speaking audience. Is the site single-language or multilingual?
**Impact:** If multilingual, the entire data model and admin panel change dramatically. If single-language (Russian), this can be deferred.

## Q-14: SEO requirements
**Source:** §30 mentions SEO as a frontend comparison criterion, §38 lists SEO in the final deliverable structure.
**Question:** How important is SEO for this site? Does the master rely on organic search traffic or primarily on direct/social traffic?
**Impact:** Frontend technology choice (SSR vs SPA), meta tags strategy, structured data (schema.org for Products).

## Q-15: Dashboard content
**Source:** §20 lists "Dashboard" as a section.
**Question:** What does the dashboard show? Options:
- New inquiry count
- Recent inquiries
- Total products
- Quick stats
**Impact:** API design, real-time data requirements.

## Q-16: Sorting in catalog
**Source:** Not explicitly addressed.
**Question:** How should products be sorted in the catalog? By date added? Manually ordered? Alphabetically? Most recent first?
**Impact:** Product model may need a `sortOrder` or `createdAt` field; API needs sort parameters.

## Q-17: Admin notes on inquiries
**Source:** §25 mentions "комментарии / заметки, если агент считает это полезным"
**Question:** Does the admin need to add internal notes/comments to inquiries (visible only in admin, not to customer)?
**Impact:** Additional data model (InquiryNote entity) or a simple notes field on Inquiry.

## Q-18: Pagination strategy
**Source:** Not addressed.
**Question:** How should the catalog paginate — infinite scroll, load-more button, or traditional page numbers?
**Impact:** API design (offset vs cursor pagination), UX, mobile experience.

## Q-19: Max quantity per item
**Source:** §10 says "нет ограничения по доступному количеству"
**Question:** Should there be any reasonable upper bound (e.g., max 999) to prevent absurd values, or truly unlimited?
**Impact:** Validation rules, UI stepper component design.

## Q-20: Empty states
**Source:** Not addressed.
**Question:** What happens when:
- Catalog has no products?
- Search returns no results?
- Cart is empty?
- No inquiries in admin?
**Impact:** UX polish, frontend development.

---

# 9. Architectural Decisions Already Made

| ID | Decision | Source |
|----|----------|--------|
| AD-01 | Backend: Java 21 + Spring Boot 4.1.1 + Spring Security | §30 |
| AD-02 | Database: PostgreSQL | §30 |
| AD-03 | Migrations: Flyway | §30 |
| AD-04 | API style: REST | §30 |
| AD-05 | Architecture: monolith (no microservices) | §37 (rule H) |
| AD-06 | Dynamic characteristics: key-value pairs, not fixed schema fields | §5, §7 |
| AD-07 | Categories: flat (single level), data-driven | §22 |
| AD-08 | Stone types: data-driven, not enum | §23 |
| AD-09 | No customer authentication/registration | §29 |
| AD-10 | No pricing, payments, stock, delivery, discounts, promo codes | §3, §29 |
| AD-11 | Images: not stored as binary in PostgreSQL | §27 |
| AD-12 | Admin panel: closed, authenticated | §33 |
| AD-13 | Inquiry statuses: NEW, CONTACTED, IN_PROGRESS, REJECTED, COMPLETED | §15 |
| AD-14 | Status changes: explicit save required, not auto-save | §16 |
| AD-15 | Status history: tracked with old/new/who/when | §17 |
| AD-16 | Site layout/UX: developer-controlled, not admin-configurable | §24 |

---

# 10. Architectural Decisions Still Required

| ID | Decision Needed | Options | Impact |
|----|----------------|---------|--------|
| NEED-01 | Frontend technology | React SPA, Next.js (SSR/SSG), Nuxt.js, etc. | SEO, performance, image handling, deployment |
| NEED-02 | Dynamic attributes storage | EAV tables, JSONB column, hybrid | Query performance, filtering, search, data model complexity |
| NEED-03 | Filterable characteristics mechanism | Admin-marked, developer-whitelisted, auto-aggregated | Admin UX, filtering architecture, performance |
| NEED-04 | Cart persistence | localStorage, server session, cookie | UX, API design, data model |
| NEED-05 | Image storage backend | Local filesystem, S3/MinIO, cloud CDN | Deployment, cost, scalability, backup |
| NEED-06 | Image optimization strategy | On-upload processing, lazy generation, external service | Upload UX, server resources |
| NEED-07 | Search implementation | PostgreSQL full-text search, trigram (pg_trgm), ILIKE, external (Elasticsearch) | Performance, relevance, complexity |
| NEED-08 | Inquiry snapshot depth | Minimum only, or include characteristics/stones/images | Data duplication vs historical accuracy |
| NEED-09 | Realtime notifications for admin | Polling, SSE, WebSocket | Complexity, infrastructure |
| NEED-10 | Product deletion strategy | Hard delete, soft delete | Data integrity, inquiry references |
| NEED-11 | Pagination strategy | Offset-based, cursor-based | API design, performance |
| NEED-12 | Auth strategy | JWT stateless, session-based, Spring Security default | Security, frontend integration |
| NEED-13 | Admin user model | Single admin, multiple admins, role-based | Auth complexity, audit trail |
| NEED-14 | Inquiry submission confirmation | Simple message, inquiry number, email/SMS | Customer trust, additional infrastructure |
| NEED-15 | Product catalog sorting | Manual order, creation date, alphabetical, configurable | Data model, API |

---

# 11. UX Risks

## UX-RISK-01: Catalog — Dynamic filter overload
**Area:** Catalog filtering (§19)
**Risk:** If all dynamic characteristics become filter options, the filter panel could become extremely long and confusing. Different categories may have completely different characteristics, making a universal filter panel impractical.
**Mitigation:** Limit filterable characteristics; consider category-dependent filter panels.

## UX-RISK-02: Product page — Characteristic information density
**Area:** Product page (§8, §9)
**Risk:** A product with many characteristics (6+) and multiple stones (each with 5+ characteristics) could create an extremely long right-side panel on desktop and very long scroll on mobile.
**Mitigation:** Consider collapsible sections for stone details; separate "Characteristics" and "Stones" into tabs on mobile.

## UX-RISK-03: Cart — Anonymous cart loss
**Area:** Cart (§11)
**Risk:** If cart is localStorage only, customer loses selection when switching devices or clearing browser data. No way to recover.
**Mitigation:** This may be acceptable for MVP given no customer accounts exist. Consider showing a warning or providing a "share cart link" feature in future.

## UX-RISK-04: Inquiry form — Minimal fields could lose context
**Area:** Inquiry submission (§12)
**Risk:** Only name + phone + optional comment. If the customer wants to discuss a specific item from the selection, there's no structured way to annotate individual items in the inquiry.
**Mitigation:** The optional comment field may suffice. Per-item notes would add UX complexity that contradicts §34 (minimum steps).

## UX-RISK-05: No post-inquiry tracking for customer
**Area:** Inquiry (§12, §13)
**Risk:** Customer submits inquiry and has no way to check its status. No inquiry number, no status page, no email notification. Customer must wait for the seller to call.
**Mitigation:** At minimum, display a "thank you" screen with an inquiry number. Consider a simple status-check page (by inquiry number + phone) — but this adds scope.

## UX-RISK-06: Mobile gallery — Zoom interaction
**Area:** Product page mobile (§8, §35)
**Risk:** Pinch-to-zoom on mobile can conflict with page scroll and swipe-between-images gestures.
**Mitigation:** Use a proven mobile gallery library with proper gesture handling.

## UX-RISK-07: Admin — Dynamic characteristics editing UX
**Area:** Admin product editor (§21, §5)
**Risk:** Adding/removing/reordering arbitrary key-value pairs in the admin panel can be confusing if the UI is not well-designed. Reordering via drag-and-drop on mobile admin is particularly challenging.
**Mitigation:** Provide clear inline editing with drag handles; consider mobile-optimized reordering (up/down buttons instead of drag-and-drop).

## UX-RISK-08: Admin — Inquiry status save vs auto-save
**Area:** Admin inquiry management (§16)
**Risk:** The explicit save requirement is good for preventing mistakes, but if the admin changes status and navigates away without saving, they lose the change silently. The spec requests an unsaved-changes warning, which helps, but browser beforeunload events are unreliable on mobile.
**Mitigation:** Implement the warning; consider a visual "dirty" indicator on the status selector.

## UX-RISK-09: Search — Bilingual content
**Area:** Search (§18)
**Risk:** Product names and characteristics may be in Russian, English, or mixed. Search must handle Cyrillic properly, including case-insensitive matching.
**Mitigation:** PostgreSQL handles Cyrillic natively; ensure collation is correct; pg_trgm works with Cyrillic.

## UX-RISK-10: Empty cart → inquiry submission
**Area:** Cart (§11)
**Risk:** Can a customer reach the inquiry form with an empty cart? This should be prevented.
**Mitigation:** Disable "Submit inquiry" button when cart is empty; show empty-state message.

---

# 12. Technical Risks

## TECH-RISK-01: Dynamic attributes filtering performance
**Area:** §19, §5
**Risk:** If using EAV pattern for dynamic characteristics, filtering across multiple characteristics simultaneously requires multiple JOINs or subqueries, which can degrade performance as product count grows.
**Mitigation:** JSONB with GIN indexes may perform better for this use case; consider materialized views or denormalized filter columns for high-traffic filters.

## TECH-RISK-02: Image storage and delivery performance
**Area:** §27
**Risk:** Large, unoptimized jewelry photos (often 3000x4000px, 5-10MB each) served directly from the application server will cause slow page loads.
**Mitigation:** Image optimization pipeline (resize, compress, WebP/AVIF conversion) is essential. CDN or reverse-proxy caching is recommended.

## TECH-RISK-03: Snapshot data model bloat
**Area:** §32
**Risk:** If full product snapshots (characteristics + stones + images) are stored per InquiryItem, the data grows quickly with many inquiries.
**Mitigation:** Store snapshots as JSONB blobs rather than normalized tables; this is appropriate since snapshot data is read-only and not queried/filtered.

## TECH-RISK-04: File upload security
**Area:** §27, §33
**Risk:** Image upload endpoints are attack vectors (path traversal, oversized files, non-image files disguised as images, EXIF data leaks).
**Mitigation:** Validate file type (magic bytes, not just extension), enforce size limits, strip EXIF data, store files outside web root with generated names.

## TECH-RISK-05: Rate limiting on inquiry submission
**Area:** §33
**Risk:** Without rate limiting, automated scripts could flood the admin panel with fake inquiries.
**Mitigation:** Rate limit by IP and/or phone number on the inquiry submission endpoint. Consider CAPTCHA for high-risk scenarios (but this contradicts "minimum steps" UX goal).

## TECH-RISK-06: Search relevance
**Area:** §18
**Risk:** Simple ILIKE search provides poor relevance ranking. PostgreSQL full-text search requires proper configuration for Russian language (morphology, stop words).
**Mitigation:** Use `pg_trgm` for fuzzy matching and `to_tsvector('russian', ...)` for full-text search; combine for best results.

## TECH-RISK-07: Database migration complexity
**Area:** §30 (Flyway)
**Risk:** Dynamic attributes strategy choice (EAV vs JSONB vs hybrid) heavily affects migration complexity and future schema evolution.
**Mitigation:** Decide on the strategy before writing any migration; JSONB is simpler to migrate but harder to enforce constraints.

---

# 13. Recommended Decisions

These are recommendations flagged for discussion. They do NOT modify the source specification.

## REC-01: Inquiry snapshot — store as JSONB blob
**For Q-04 (§32)**
Store a JSON snapshot in InquiryItem containing: product name, SKU, category name, all characteristics, all stones with their characteristics, and primary image URL. This is read-only data, never queried/filtered, so JSONB is appropriate. Reference `productId` is kept separately for potential linking back to the current product.

**Rationale:** The spec states "historical inquiry must not unexpectedly change meaning" (§32). A minimal snapshot (name+SKU only) risks losing the exact context the customer saw. Full snapshot as JSONB is low-cost and high-value.

## REC-02: Dynamic attributes — EAV tables (not JSONB on Product)
**For NEED-02 (§5, §7)**
Use dedicated `product_characteristic` and `stone_characteristic` tables with columns: `id, parent_id, name, value, sort_order`. This gives:
- Easy admin CRUD and reordering
- Standard relational queries for filtering
- Index-friendly structure
- Clean Spring Data JPA mapping

**Rationale:** The spec requires sorting, filtering, searching on characteristics. EAV is better suited for these query patterns than JSONB. The JSONB approach makes filtering significantly harder in PostgreSQL.

## REC-03: Filterable characteristics — admin-marked with developer defaults
**For NEED-03 (§19)**
Add a `filterable` boolean to product characteristics or maintain a separate `filterable_attribute` table. Pre-seed with known values (material, purity, color, collection). Admin can toggle which characteristics appear as filters.

**Rationale:** Pure auto-aggregation creates noisy filter panels. Pure developer-whitelisting contradicts the dynamic nature requirement. A hybrid approach respects both concerns.

## REC-04: Cart — localStorage only for MVP
**For NEED-04 (§11)**
Store cart in browser localStorage. No server-side cart for anonymous users.

**Rationale:** No customer accounts exist (§29), so server-side cart would require anonymous session management — complexity that contradicts the project's simplicity goal.

## REC-05: Product deletion — soft delete
**For NEED-10 (§21)**
Use a `deleted` boolean (or `deletedAt` timestamp) on products. Soft-deleted products are hidden from catalog and admin list (unless filtered), but InquiryItem snapshots and references remain valid.

**Rationale:** §32 requires inquiry integrity. Hard delete could orphan snapshot references.

## REC-06: Search — pg_trgm + simple ILIKE
**For NEED-07 (§18)**
For MVP, use `pg_trgm` extension with GIN index for fuzzy search on product name and SKU. This handles typos, partial matches, and Cyrillic well. Full-text search with Russian dictionary can be added later if needed.

**Rationale:** The catalog is likely small (hundreds, not millions of products). pg_trgm is simple to implement, requires no external service, and performs well at this scale.

## REC-07: Admin notifications — simple polling for MVP
**For NEED-09 (§13)**
Poll for new inquiry count every 30-60 seconds from the admin dashboard/header. No WebSocket or SSE infrastructure needed for MVP.

**Rationale:** One admin user, low inquiry frequency. Polling is trivially simple and sufficient.

## REC-08: Auth — JWT with httpOnly cookie
**For NEED-12 (§33)**
Spring Security with JWT token stored in httpOnly, secure, SameSite cookie. Stateless backend, no server-side sessions to manage.

**Rationale:** Simple, secure, works well with REST API and SPA admin panels.

---

# 14. Pre-Architecture Checklist

These items must be resolved or confirmed before architectural design and implementation can begin.

## Must-Resolve (Blocking)

- [ ] **Frontend technology** — React SPA vs Next.js vs other (§30, Q-01)
- [ ] **Dynamic attributes storage strategy** — EAV vs JSONB vs hybrid (§5, §7, NEED-02)
- [ ] **Filterable characteristics mechanism** — how to determine which characteristics are filterable (§19, NEED-03)
- [ ] **Image storage backend** — local filesystem vs object storage (§27, NEED-05)
- [ ] **Inquiry snapshot depth** — minimum only vs full characteristics+stones (§32, NEED-08)
- [ ] **Cart persistence** — localStorage vs server-side (§11, NEED-04)
- [ ] **Product deletion strategy** — hard vs soft delete (§21, NEED-10)
- [ ] **Admin user model** — single admin or multiple (§20, NEED-13)

## Should-Resolve (High Priority)

- [ ] **Cart terminology** — "Корзина" vs "Моя подборка" (§11, Q-03)
- [ ] **Catalog sort order** — manual, by date, alphabetical (Q-16)
- [ ] **Pagination style** — infinite scroll, load-more, page numbers (Q-18)
- [ ] **Post-inquiry confirmation** — what does the customer see? (Q-09)
- [ ] **Dashboard content** — what widgets/stats to show (Q-15)
- [ ] **Max quantity validation** — any upper bound? (Q-19)
- [ ] **Language** — single-language (Russian) or multilingual? (Q-13)
- [ ] **SEO importance level** — organic search priority? (Q-14)

## Can-Defer (Nice to Have)

- [ ] **Realtime notifications approach** — can start with polling (Q-03 / NEED-09)
- [ ] **Admin internal notes on inquiries** — useful but not blocking (Q-17)
- [ ] **Empty state designs** — UX polish, can iterate (Q-20)
- [ ] **Rate limiting / anti-spam details** — important but implementable later (TECH-RISK-05)
- [ ] **Image optimization pipeline details** — can start simple, optimize later (Q-08)
