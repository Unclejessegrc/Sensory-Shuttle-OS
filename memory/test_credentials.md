# Sensory Shuttle OS — Test Credentials

This is a **mock-data, demo-only build** for Phase 1+2. Authentication via Supabase is wired in code but disabled in this sandbox (placeholder env vars). Demo access is provided through the **Persona Switcher** in the left sidebar.

## How to access the app

1. Visit `/demo` (auto-redirected from `/`)
2. Click any role card to enter the app — OR
3. Use the **"View demo as"** dropdown in the top of the left sidebar to switch between roles at any time

The persona is stored in `localStorage` (`ss-demo-persona`) and also accepts a URL hash override:
`/app/dashboard#demoRole=broker_admin`

## Available demo personas

| Persona (UI label)                          | Hash override value | Access scope                                                    |
| ------------------------------------------- | ------------------- | --------------------------------------------------------------- |
| Upper Management (Payer/Plan)               | `system_admin`      | Full network · sensitive data · all overrides                   |
| Transportation Broker Administrator         | `broker_admin`      | Network performance · provider rankings · escalations · audits  |
| Transportation Provider Administrator       | `provider_admin`    | Own drivers / vehicles / rides / incidents                      |
| Member Services / Ride Booking Agent        | `dispatcher`        | Ride booking desk · operational rider view                      |
| Driver                                      | `driver`            | Today's route + ride-specific instructions only                 |
| Caregiver                                   | `caregiver`         | Their own rider's ride status only                              |
| Facility Viewer                             | `facility_viewer`   | Read-only transportation status                                 |

## Notes

- Supabase auth (`/login`) requires real `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` — sandbox uses placeholders, so login will not succeed. Use persona switcher instead.
- All data is in-memory mock data (seed in `src/lib/mock-data.ts` + `src/lib/registered-riders.ts`). State resets on page reload.
- Phase 3 will wire Supabase persistence — at that point real login + DB-backed audit logs will work.
