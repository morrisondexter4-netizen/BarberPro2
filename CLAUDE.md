# CLAUDE.md — BarberPro2
# Client: Aiden Leone — Barbershop Management App
# Last updated: 2026-03-13

---

## Project Overview

A full-featured barbershop management and public booking app. Two interfaces:
- **Staff dashboard** — schedule, queue, CRM, metrics, shop settings
- **Public booking** — customer-facing appointment booking + join queue flow

**Current state:** Feature-complete UI, fully runnable. No backend — all data in localStorage. No auth.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14.1.0 (App Router) |
| Language | TypeScript 5.3.0 |
| UI | React 18.2.0 + Tailwind CSS 3.4.0 |
| Drag/drop | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| Data | Browser localStorage (no backend) |
| Linting | ESLint with Next.js config |

---

## Directory Structure

```
BarberPro2/
├── app/
│   ├── (barber)/              # Staff routes (layout with AppShell)
│   │   ├── dashboard/         # Daily queue + drag-drop scheduling
│   │   ├── overview/          # Metrics/revenue analytics
│   │   ├── schedule/          # Weekly calendar view
│   │   ├── customers/         # CRM list + detail pages
│   │   ├── shop-settings/     # Barbers, services, shop hours
│   │   ├── messages/          # PLACEHOLDER — empty
│   │   ├── queue/             # PLACEHOLDER — empty
│   │   └── more/              # PLACEHOLDER — empty
│   ├── book/                  # Public booking routes
│   │   ├── page.tsx           # Landing: Book or Join Queue
│   │   ├── appointment/       # 5-step booking wizard
│   │   └── queue/             # Join queue flow
│   ├── layout.tsx
│   ├── page.tsx               # Redirects to /overview
│   └── globals.css
├── components/
│   ├── crm/                   # Customer form, table, visit history
│   ├── dashboard/             # Queue panel, calendar panel, popovers
│   ├── metrics/               # Metric cards, filters, calculations
│   ├── schedule/              # Weekly grid, appointment popups
│   ├── shell/                 # AppShell, Sidebar, TopBar, BottomNav
│   ├── shop-settings/         # Barber/service/shop management modals
│   ├── customers/             # CustomerProfilePopup
│   └── ui/                    # Button, Card, Input, Modal, Select, etc.
├── lib/
│   ├── types.ts               # Core types: Appointment, QueueEntry, Barber, Service
│   ├── mock-data.ts           # Mock barbers (Marcus, Devon, Jaylen), services, appointments
│   ├── settings.ts            # localStorage helpers for all entities
│   ├── barberpro-context.tsx  # React Context: appointments + queue state
│   ├── barber-colors.ts       # Color mappings per barber
│   └── crm/
│       ├── types.ts           # Customer, Visit, Outcome, Source types
│       ├── store.ts           # Pub/sub state management + localStorage sync
│       ├── mock.ts            # 18 sample customers, 60 sample visits
│       └── selectors.ts       # Query helpers (getById, search, getVisits)
├── package.json
├── tailwind.config.js
└── next.config.mjs
```

---

## Data Model

All data lives in browser localStorage under these keys:

| Key | Contents |
|---|---|
| `barberpro.shopSettings` | Shop name, address, phone, hours |
| `barberpro.shopSettings.barbers` | Barber list |
| `barberpro.services` | Service list |
| `barberpro.appointments` | All appointments |
| `barberpro.queue` | Queue entries |
| `barberpro.crm.v2` | Customers + visit history |

Core types are in `lib/types.ts` and `lib/crm/types.ts`. Don't modify these without checking all consumers — they're used throughout.

---

## Key Files

| File | Why it matters |
|---|---|
| `lib/barberpro-context.tsx` | Global state for appointments + queue — edit with care |
| `lib/crm/store.ts` | Pub/sub CRM store — pub/sub pattern, localStorage sync |
| `lib/settings.ts` | All localStorage read/write helpers |
| `app/(barber)/dashboard/page.tsx` | Most complex file — drag/drop queue↔timeline logic (358 lines) |
| `app/(barber)/schedule/page.tsx` | Weekly schedule with collision detection (320 lines) |
| `app/book/appointment/page.tsx` | 5-step booking wizard with availability calculation (405 lines) |
| `components/metrics/metrics-utils.ts` | Revenue/appointment calculation helpers |

---

## What's Built vs. What's Not

### Done
- [x] Staff dashboard with drag-drop queue → appointment conversion
- [x] Weekly schedule view with collision detection (overlaps, lunch, shop hours)
- [x] CRM — customer list, search, detail view, visit history, notes
- [x] Shop settings — barbers, services, hours, lunch breaks
- [x] Metrics/overview — revenue, appointments, no-shows by barber/period
- [x] Public booking — 5-step wizard (barber → date → time → service → info)
- [x] Join queue — 2-step flow
- [x] Appointment status flow: scheduled → checked-in → paid / no-show / cancelled

### Not Built
- [ ] Backend/database (localStorage only — not production-ready)
- [ ] User authentication
- [ ] Messages page (placeholder)
- [ ] Notifications (component exists, no real implementation)
- [ ] SMS/email notifications
- [ ] Staff-side queue page (placeholder)

---

## How to Run

```bash
cd /Users/dexterm/BarberPro2
npm install
npm run dev
# Opens at http://localhost:3000 (or next available port)
# Redirects to /overview on load
```

---

## Development Rules

1. **Always confirm which folder is active** — BarberPro (older) vs BarberPro2 (active). Default to BarberPro2.
2. **Don't touch `lib/types.ts` or `lib/crm/types.ts`** without understanding all consumers first — type changes ripple everywhere.
3. **The dashboard page is the most complex file** — drag/drop logic is delicate. Test thoroughly after any changes.
4. **localStorage is the only persistence** — clearing browser data wipes everything. Not a bug, it's the current architecture.
5. **Mock data is in `lib/mock-data.ts` and `lib/crm/mock.ts`** — used as seed data, not hardcoded in components.
6. **Before adding a backend:** The data layer is cleanly separated in `settings.ts` and `crm/store.ts`. Swap those out first.

---

## Next Steps (as of 2026-03-13)

- Backend integration (Firebase or Supabase recommended)
- Authentication (barber login)
- Real SMS/email notifications (Twilio or similar)
- Complete Messages page
- Mobile-responsive polish

---

*Maintained by R2. Update this file after any significant architectural changes.*
