# Sensory Shuttle OS

Sensory Shuttle OS is a care-aware NEMT operating system and accountability platform demo for payers, health plans, transportation brokers, providers, drivers, riders, caregivers, and facility users.

## Demo Focus

- Health Plan / Payer Administrator view for transportation performance, member access risk, missed ride patterns, provider performance, complaints, compliance, and cost-driving failure points.
- Transportation Broker Administrator view for network operations, active trips, GPS accountability, ETA confidence, provider tiers, incidents, audit logs, and network performance.
- Member Services / Ride Booking Agent view for ride booking, rider lookup, trip status, caregiver support, driver details, and issue handling.
- Transportation Provider Administrator view for assigned drivers, rides, vehicle readiness, GPS compliance, incidents, and provider scorecard.
- Driver view locked to assigned rides, route status, GPS lock, pre-trip checklist, and issue reporting.
- Rider / Caregiver view for requesting rides, day-of driver ETA, support instructions, return ride options, and report/support actions.
- Facility / Care Team Viewer read-only view for arrival windows and appointment transportation status.

## Local Setup

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:8080/demo
```

## Build

```powershell
npm run build
```

## Netlify

This TanStack Start app is configured for Netlify using `@netlify/vite-plugin-tanstack-start`.

- Build command: `npm run build`
- Publish directory: `dist/client`

The demo uses mock data only. Do not commit real rider information, PHI, production credentials, or private `.env` files.
