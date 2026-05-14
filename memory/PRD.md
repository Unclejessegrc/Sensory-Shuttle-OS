# Sensory Shuttle OS — PRD

## Original problem statement (verbatim summary)

Import the existing GitHub repo `Unclejessegrc/Sensory-Shuttle-OS` as-is and continue building. The app is a **care-aware NEMT (Non-Emergency Medical Transportation) accountability operating system** — not a ride-booking clone. It serves brokers, providers, dispatchers, member-services agents, upper management, drivers, caregivers, and facility viewers, and is designed to surface accountability problems in MTM-style transportation networks (unreliable ETAs, false no-show disputes, unsafe vehicle assignments, weak complaint tracking, poor rider-to-driver matching, lack of caregiver transparency).

User-selected scope: **Phase 1+2** (import + close UI gaps), **mock-data only** (defer Supabase persistence to Phase 3), **appointment types option A** (extend existing list, don't replace).

## Architecture

| Layer       | Tech                                                                                    |
| ----------- | --------------------------------------------------------------------------------------- |
| Frontend    | Vite + React 19 + TypeScript + TanStack Start/Router + Tailwind 4 + shadcn/ui            |
| Auth        | Supabase auth wired in code (placeholder env in this sandbox; not active for demo)       |
| Database    | **Mock data only for Phase 1+2** (in-memory store in `src/lib/store.tsx`)                |
| Deployment  | Existing Netlify + Cloudflare Workers configs preserved                                  |
| Sandbox run | Supervisor `frontend` proxies `yarn start` → `vite dev --port 3000 --host 0.0.0.0`       |

## User personas (8 roles defined; 7 personas implemented)

| Role label                                  | Hash override     | Access scope                                                       |
| ------------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| Upper Management (Payer/Plan)               | `system_admin`    | Full network + sensitive data + all overrides                      |
| Transportation Broker Administrator         | `broker_admin`    | Network performance, provider rankings, escalations, audits        |
| Transportation Provider Administrator       | `provider_admin`  | Own drivers / vehicles / rides / incidents                         |
| Member Services / Ride Booking Agent        | `dispatcher`      | Ride booking desk + operational rider view                         |
| Driver                                      | `driver`          | Today's route + ride-specific instructions only                    |
| Caregiver                                   | `caregiver`       | Their own rider's ride status only                                 |
| Facility Viewer                             | `facility_viewer` | Read-only transportation status                                    |

> Note: spec also lists a separate "Dispatcher (limited view)" role, currently merged with Member Services / Ride Booking Agent in this codebase. Splitting into a distinct persona is deferred to Phase 3.

## What's been implemented

### Inherited from the imported repo (~12,600 LOC, NOT touched)
- Full role-based access control with field-level visibility (`src/lib/access-control.ts`)
- 6 mock registered-rider profiles with 50+ fields each (`src/lib/registered-riders.ts`)
- Fit Score Engine (hard fails + soft warnings) (`src/lib/fit-score.ts`)
- AI Dispatch Intelligence — Fit Score, Gap-Time Feasibility, 15-mile Radius rule, internal/external/manual recommendation modes (`src/lib/ai-dispatch.ts`)
- Pages: dispatch live board, registered-riders directory, rider profile, riders, book ride, driver dashboard, caregiver dashboard, incidents + evidence packet, audit log, provider scorecards, broker dashboard, facility view, payer dashboard, accountability engine, live-gps per ride, admin user management
- Supabase migrations for `user_roles` table + RLS + first-signup-becomes-admin trigger
- Demo persona switcher (sidebar + URL hash + localStorage)

### Added/fixed in this iteration (Jan 2026 — Phase 1+2)
1. **Supervisor shim** — `/app/frontend/package.json` + `/app/backend/server.py` stub so the Vite app runs on port 3000 under the Emergent supervisor.
2. **Calendar ride scheduling** — Book Ride date input replaced with a clickable shadcn `Calendar` popover. Disables past dates. Shows the selected rider's other rides on the chosen date directly inside the popover AND below the field. Detects duplicates (same time + pickup) and blocks submission until ack'd; the override is audited as `ride.duplicate_override`.
3. **Insurance section** — New `Insurance` card on Book Ride with required dropdown (Medicaid / Medicare / Private Insurance / CHIP / Self-pay / VA Benefits / Other) plus 5 conditionally-revealed fields (company, member ID, group, policy holder, authorization). Pre-fills from rider profile.
4. **Appointment types** — Extended `APPOINTMENT_TYPES` with the 4 missing items from spec (Medical, Occupational Therapy, Speech Therapy, Other), keeping existing 19 types.
5. **Flag interactions on Registered Riders directory** — New `RiderFlagList` component shows first 3 flags inline + a `+N more` Popover dropdown. Each flag is clickable and opens a dialog with a "Why this rider has this flag" rider-specific reason (via new `flagReason()` helper) plus the existing What/Booking/Accountability definitions.
6. **Eyeball view → rider profile** — Fixed a pre-existing routing bug (parent route `app.registered-riders.tsx` had no `<Outlet />`, so detail page never rendered). Refactored: parent is now a layout-only file rendering `<Outlet />`; the directory list moved to `app.registered-riders.index.tsx`. Detail and `/new` pages now mount correctly.
7. **Profile-view audit log** — New `rider.profile_viewed` audit entry emitted on mount when a sensitive-data role opens a full rider profile.
8. **RoleGate hash override race fix** — `RoleGate` now uses `useRouterState({select: s => s.location.hash})` so the `#demoRole=` hash is re-derived on every SPA navigation (previously only `hashchange` events worked, which broke programmatic navigation). Persona override now reliably wins over `localStorage`.
9. **Evidence Packet button** — Added `data-testid` attributes; confirmed dialog opens correctly with all required fields.
10. **data-testid coverage** — Added throughout: rider rows, eyeball, flag list, flag dropdown, flag dialogs, book-* fields, evidence-packet buttons/dialogs, audit rows.

### Testing
- Iteration 1: ~90% pass, 2 real issues found
- Iteration 2 (post-fix): **100% pass** across regression + both fixes

## Prioritized backlog (P0 / P1 / P2)

### P0 (must-have for production)
- **Persistent database (Supabase schema + RLS for everything)** — riders, rides, ride_events, gps_pings, vehicles, drivers, providers, incidents, incident_evidence, audit_logs. Wire `StoreProvider` to TanStack Query hooks against Supabase.
- **Real auth flow active** — supply real Supabase env vars + user→role mapping + per-role redirect after login

### P1 (high-value next)
- **Dedicated Driver Scorecards** — currently provider page lists drivers; add per-driver scorecard view with the 11 metrics from spec (on-time, complaints, completed, late, missed, false-no-show disputes, stale GPS, incident history, training, blocks, preferred matches)
- **15-mile Radius override dialog** — capture reason + write `radius_override` audit log (Upper Mgmt only)
- **Incident status change audit + GPS log view audit + report export audit + permission change audit** — fill in remaining audit hooks from spec
- **Split Dispatcher (limited operational view) from Member Services / Booking Agent (full profile access)** into two personas
- **Incident evidence photo upload** — Supabase Storage bucket + signed URLs
- **GPS ping log table** — real per-ride GPS history, render in Evidence Packet and Live GPS

### P2 (polish / fast follow)
- ETA Truth Engine model — currently uses static placeholders for traffic; integrate a real traffic provider or refined heuristic
- Driver app: real geolocation broadcast back to server every 30s, status-change endpoint
- Caregiver messaging → Dispatch (currently a static "Message dispatch" button)
- Exportable reports (CSV/PDF) for broker dashboard
- Flag bar consistency: profile shows 6 inline + dropdown vs. directory's 3 + dropdown — decide single rule

### Carry-over data quality notes (LOW)
- Insurance Member ID autofills as masked literal `•••• 4421` — decide if persisted value should be raw + only masked on render
- Group number field auto-fills empty (rider profile has no such field) — either add to profile schema or default placeholder

## Next tasks list

1. **(Phase 3 P0)** Author Supabase migrations for the 10 new tables + RLS policies that mirror `access-control.ts`. Generate seed SQL from current mock data.
2. **(Phase 3 P0)** Replace in-memory `StoreProvider` with TanStack Query hooks against Supabase. Preserve the demo persona switcher as a development tool but route writes through DB.
3. **(P1)** Driver Scorecards view + 15-mile override dialog + remaining audit hooks (in parallel).

## Files of note

- `/app/src/routes/app.book.tsx` — Book Ride (calendar + insurance + AI dispatch)
- `/app/src/routes/app.registered-riders.tsx` — layout (Outlet)
- `/app/src/routes/app.registered-riders.index.tsx` — directory list
- `/app/src/routes/app.registered-riders.$riderId.tsx` — profile detail + view audit
- `/app/src/components/RiderFlagList.tsx` — collapse + dropdown
- `/app/src/components/DefinitionBadge.tsx` — rider-specific reason support
- `/app/src/components/RoleGate.tsx` — hash override fix
- `/app/src/lib/registered-riders.ts` — `flagReason()` helper
- `/app/src/lib/mock-data.ts` — APPOINTMENT_TYPES, INSURANCE_TYPES, InsuranceDetails
- `/app/memory/test_credentials.md` — demo persona reference
