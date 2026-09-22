# Implementation Plan: Architecture Research & Proposal

## Status: APPROVED ✅

Human review completed 2026-09-22. All 10 architecture decisions approved.

## Approved Architecture Decisions

| # | Decision | Approved Choice | Key Constraints |
|---|----------|----------------|-----------------|
| 1 | Frontend | Next.js App Router + TypeScript | — |
| 2 | Dynamic Characteristics | PostgreSQL JSONB | Keys normalized at application/admin layer |
| 3 | Search | PostgreSQL + pg_trgm | Architecture must allow future search engine swap |
| 4 | Image Storage | Local filesystem (MVP) | Abstracted via ImageStoragePort interface |
| 5 | Inquiry Snapshot | Full JSONB in InquiryItem | Historical state preserved |
| 6 | Cart | localStorage (frontend) | Backend validates on inquiry creation |
| 7 | Authentication | JWT in httpOnly cookie | No token blacklist without separate decision |
| 8 | Product Lifecycle | Soft delete | Inquiry data independent of active Product |
| 9 | Admin Panel | Single Next.js app, admin route group | No separate admin app |
| 10 | Admin UX | Responsive | — |

## Deliverables

- [x] [`docs/product/architecture-research.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/architecture-research.md) — full research
- [x] [`docs/product/approved-architecture.md`](file:///d:/ozod/coding/java/marziya-gold.uz/docs/product/approved-architecture.md) — approved decisions + open questions
- [x] Human approval received

## Open Architectural Questions

10 open questions documented in `approved-architecture.md` that require resolution before or during implementation. These are NOT resolved — they require separate decisions.

## Next Steps

Implementation has NOT started. Next task should address open architectural questions and/or begin foundation implementation.
