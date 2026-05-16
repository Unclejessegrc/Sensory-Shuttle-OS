import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  initialAuditLogs,
  initialDriverTelemetry,
  initialIncidents,
  initialRides,
  type AuditLog,
  type DriverTelemetry,
  type Incident,
  type Ride,
  type Role,
} from "./mock-data";
import {
  initialRegisteredRiders,
  computeRiskFlags,
  type BookingAgentNote,
  type RegisteredRider,
  type RiderAuditEntry,
} from "./registered-riders";

interface StoreCtx {
  role: Role;
  setRole: (r: Role) => void;
  rides: Ride[];
  addRide: (r: Ride) => void;
  updateRide: (id: string, patch: Partial<Ride>) => void;
  driverTelemetry: DriverTelemetry[];
  updateDriverTelemetry: (driverId: string, patch: Partial<DriverTelemetry>) => void;
  incidents: Incident[];
  addIncident: (i: Incident) => void;
  auditLogs: AuditLog[];
  addAudit: (a: AuditLog) => void;
  registeredRiders: RegisteredRider[];
  addRegisteredRider: (r: RegisteredRider) => void;
  updateRegisteredRider: (
    id: string,
    patch: Partial<RegisteredRider>,
    audit?: Omit<RiderAuditEntry, "id" | "ts" | "riderId">,
  ) => void;
  addBookingAgentNote: (riderId: string, note: Omit<BookingAgentNote, "id" | "createdAt">) => void;
  archiveRegisteredRider: (id: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

const DEMO_ROLES: Role[] = [
  "dispatcher",
  "driver",
  "caregiver",
  "provider_admin",
  "broker_admin",
  "facility_viewer",
  "system_admin",
];

function readDemoRoleFromHash(): Role | null {
  if (typeof window === "undefined") return null;
  const demoRole = window.location.hash.match(/demoRole=([^&]+)/)?.[1];
  return DEMO_ROLES.includes(demoRole as Role) ? (demoRole as Role) : null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("dispatcher");
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [driverTelemetry, setDriverTelemetry] = useState<DriverTelemetry[]>(initialDriverTelemetry);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [registeredRiders, setRegisteredRiders] =
    useState<RegisteredRider[]>(initialRegisteredRiders);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyDemoRole = () => {
      const demoRole = readDemoRoleFromHash();
      if (!demoRole) return false;
      setRoleState(demoRole);
      window.localStorage.setItem("ssos-role", demoRole);
      return true;
    };
    if (!applyDemoRole()) {
      const saved = window.localStorage.getItem("ssos-role") as Role | null;
      if (saved) setRoleState(saved);
    }
    window.addEventListener("hashchange", applyDemoRole);
    return () => window.removeEventListener("hashchange", applyDemoRole);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem("ssos-role", r);
  };

  const value = useMemo<StoreCtx>(
    () => ({
      role,
      setRole,
      rides,
      addRide: (r) => setRides((p) => [r, ...p]),
      updateRide: (id, patch) =>
        setRides((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      driverTelemetry,
      updateDriverTelemetry: (driverId, patch) => {
        const gpsLastUpdateISO = patch.gpsLastUpdateISO ?? new Date().toISOString();
        setDriverTelemetry((p) =>
          p.map((x) => {
            if (x.driverId !== driverId) return x;
            const next = { ...x, ...patch, gpsLastUpdateISO };
            const minutes = Math.max(
              0,
              Math.round((Date.now() - new Date(gpsLastUpdateISO).getTime()) / 60000),
            );
            return {
              ...next,
              gpsLastUpdateMin: patch.gpsLastUpdateMin ?? minutes,
              deviceStatus: patch.deviceStatus ?? (minutes > 10 ? "stale" : "live"),
            };
          }),
        );
      },
      incidents,
      addIncident: (i) => setIncidents((p) => [i, ...p]),
      auditLogs,
      addAudit: (a) => setAuditLogs((p) => [a, ...p]),
      registeredRiders,
      addRegisteredRider: (r) => {
        const withFlags = { ...r, riskFlags: computeRiskFlags(r) };
        setRegisteredRiders((p) => [withFlags, ...p]);
        setAuditLogs((p) => [
          {
            id: `L-${Date.now()}`,
            ts: new Date().toISOString(),
            actor: "admin@network-demo",
            action: "rider.profile_created",
            entityId: r.id,
            details: `Registered rider ${r.firstName} ${r.lastName} created`,
          },
          ...p,
        ]);
      },
      updateRegisteredRider: (id, patch, auditDetail) => {
        setRegisteredRiders((p) =>
          p.map((x) => {
            if (x.id !== id) return x;
            const merged = { ...x, ...patch, updatedAt: new Date().toISOString() };
            merged.riskFlags = computeRiskFlags(merged);
            if (auditDetail) {
              merged.audit = [
                {
                  id: `RA-${id}-${Date.now()}`,
                  ts: new Date().toISOString(),
                  riderId: id,
                  ...auditDetail,
                },
                ...x.audit,
              ];
            }
            return merged;
          }),
        );
        if (auditDetail) {
          setAuditLogs((p) => [
            {
              id: `L-${Date.now()}`,
              ts: new Date().toISOString(),
              actor: auditDetail.actor,
              action: `rider.${auditDetail.action}`,
              entityId: id,
              details: `${auditDetail.field}: ${auditDetail.oldValue} → ${auditDetail.newValue}`,
            },
            ...p,
          ]);
        }
      },
      addBookingAgentNote: (riderId, note) => {
        const createdAt = new Date().toISOString();
        const id = `BAN-${Date.now()}`;
        setRegisteredRiders((p) =>
          p.map((x) =>
            x.id === riderId
              ? {
                  ...x,
                  updatedAt: createdAt,
                  bookingAgentNotes: [{ ...note, id, createdAt }, ...(x.bookingAgentNotes ?? [])],
                }
              : x,
          ),
        );
        setAuditLogs((p) => [
          {
            id: `L-${Date.now()}`,
            ts: createdAt,
            actor: note.createdByRole,
            action: "rider.booking_agent_note_added",
            entityId: riderId,
            details: note.relatedIncidentId
              ? `Operational note linked to ${note.relatedIncidentId}`
              : "Operational note added for administrator review",
          },
          ...p,
        ]);
      },
      archiveRegisteredRider: (id) => {
        setRegisteredRiders((p) => p.map((x) => (x.id === id ? { ...x, archived: true } : x)));
      },
    }),
    [role, rides, driverTelemetry, incidents, auditLogs, registeredRiders],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
