import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  drivers,
  providers,
  riders,
  vehicles,
  type Driver,
  type Provider,
  type Ride,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { TierBadge } from "@/components/StatusBadge";
import { evaluateDriverForRide } from "@/lib/fit-score";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Navigation,
  Radar,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { clickableSurface } from "@/components/ClickableSurface";

export const Route = createFileRoute("/app/broker")({
  component: () => (
    <RoleGate allow={["broker"]}>
      <Broker />
    </RoleGate>
  ),
});

type Layer =
  | { type: "driver"; id: string }
  | { type: "provider"; id: string }
  | { type: "ride"; id: string }
  | { type: "vehicle"; id: string }
  | { type: "rider"; id: string }
  | { type: "fit"; rideId: string; driverId: string }
  | { type: "warning"; title: string; detail: string };

function Broker() {
  const { incidents, rides, updateRide, addAudit, driverTelemetry } = useStore();
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
  const [assignmentState, setAssignmentState] = useState<
    Record<string, { ok: boolean; text: string }>
  >({});
  const [layer, setLayer] = useState<Layer | null>(null);

  const activeRides = rides.filter((r) =>
    ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
  );
  const assignable = useMemo(
    () => rides.filter((r) => r.status === "scheduled").slice(0, 9),
    [rides],
  );
  const totalRides = providers.reduce((s, p) => s + p.completedRides, 0);
  const networkOnTime = providers.reduce((s, p) => s + p.onTimeRate, 0) / providers.length;
  const overspeed = driverTelemetry.filter((t) => t.speedMph > t.speedLimitMph);
  const gpsExceptions = driverTelemetry.filter(
    (t) => !t.gpsLocked || t.deviceStatus !== "live" || t.gpsPermission !== "accepted",
  );

  const candidateVehicle = (driver: Driver) =>
    vehicles.find((v) => v.assignedDriverId === driver.id) ??
    vehicles.find((v) => v.providerId === driver.providerId);

  const driverFit = (ride: Ride, driver: Driver) => {
    const rider = riders.find((x) => x.id === ride.riderId);
    const vehicle = candidateVehicle(driver);
    const provider = providers.find((p) => p.id === driver.providerId);
    if (!rider || !vehicle || !provider) return null;
    return evaluateDriverForRide(ride, rider, driver, vehicle, provider, rides, incidents);
  };

  const recommendedDrivers = (ride: Ride) =>
    drivers
      .map((driver) => ({
        driver,
        vehicle: candidateVehicle(driver),
        fit: driverFit(ride, driver),
      }))
      .filter(
        (
          entry,
        ): entry is {
          driver: Driver;
          vehicle: NonNullable<ReturnType<typeof candidateVehicle>>;
          fit: NonNullable<ReturnType<typeof driverFit>>;
        } => !!entry.fit && !!entry.vehicle,
      )
      .sort((a, b) =>
        a.fit.hardFails.length !== b.fit.hardFails.length
          ? a.fit.hardFails.length - b.fit.hardFails.length
          : b.fit.score - a.fit.score,
      );

  const assignDriver = (ride: Ride, driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    const vehicle = driver ? candidateVehicle(driver) : undefined;
    const fit = driver ? driverFit(ride, driver) : null;
    if (!driver || !vehicle || !fit) return;
    if (fit.hardFails.length) {
      const text = fit.hardFails[0];
      setAssignmentState((p) => ({ ...p, [ride.id]: { ok: false, text } }));
      toast.error(text);
      return;
    }
    updateRide(ride.id, {
      driverId,
      providerId: driver.providerId,
      vehicleId: vehicle.id,
      etaConfidence: "high",
      etaReasons: ["Broker assigned after hard-rule pass", "GPS lock required before route start"],
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "broker@network-demo",
      action: "broker.driver_assigned",
      entityId: ride.id,
      details: `${driver.name} assigned after fit score ${fit.score}`,
    });
    setAssignmentState((p) => ({
      ...p,
      [ride.id]: { ok: true, text: `${driver.name} assigned successfully. Hard rules passed.` },
    }));
    toast.success(`${driver.name} assigned to ${ride.id}`);
  };

  const pingProviders = (ride: Ride) =>
    providers.map((provider) => {
      const providerDrivers = drivers.filter((d) => d.providerId === provider.id);
      const ranked = providerDrivers
        .map((driver) => ({ driver, fit: driverFit(ride, driver) }))
        .filter(
          (entry): entry is { driver: Driver; fit: NonNullable<ReturnType<typeof driverFit>> } =>
            !!entry.fit,
        )
        .sort((a, b) => b.fit.score - a.fit.score);
      const eligible = ranked.filter((r) => r.fit.pass);
      const blockedReason = !providerDrivers.length
        ? "No drivers in provider roster"
        : eligible.length
          ? "Eligible drivers available"
          : (ranked[0]?.fit.hardFails[0] ?? "No availability");
      return { provider, ranked, eligible, blockedReason };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Broker network command center
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Layered Transportation Broker Administration OS
          </h1>
          <p className="text-sm text-muted-foreground">
            Every object opens a deeper demo layer. Rider privacy is protected with initials and
            accommodation labels only.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Lock className="h-3.5 w-3.5" /> Broker-admin role: full accountability access
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Rides this month" value={totalRides.toLocaleString()} to="/app/dispatch" />
        <Metric
          label="Network on-time"
          value={`${(networkOnTime * 100).toFixed(0)}%`}
          to="/app/providers"
        />
        <Metric label="Active rides" value={activeRides.length} to="/app/dispatch" />
        <Metric
          label="Speed flags"
          value={overspeed.length}
          tone={overspeed.length ? "danger" : "normal"}
          to="/app/details/$topic"
          params={{ topic: "speed-flags" }}
        />
        <Metric
          label="GPS exceptions"
          value={gpsExceptions.length}
          tone={gpsExceptions.length ? "danger" : "normal"}
          to="/app/details/$topic"
          params={{ topic: "stale-gps" }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.2fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" /> Clickable GPS driver layer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative h-[360px] overflow-hidden rounded-lg border bg-slate-950">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="absolute left-5 top-5 rounded-md bg-white/95 px-3 py-2 shadow-sm">
                <div className="text-xs font-semibold text-slate-900">Mock GPS map</div>
                <div className="text-[11px] text-slate-600">
                  Demo coordinates and location types only.
                </div>
              </div>
              {driverTelemetry.map((t, index) => {
                const driver = drivers.find((d) => d.id === t.driverId);
                const flagged =
                  t.speedMph > t.speedLimitMph || t.deviceStatus !== "live" || !t.gpsLocked;
                return (
                  <button
                    key={t.driverId}
                    type="button"
                    aria-label={`Open ${driver?.name} GPS layer`}
                    onClick={() => driver && setLayer({ type: "driver", id: driver.id })}
                    className="absolute text-left"
                    style={{
                      left: `${12 + ((index * 19) % 74)}%`,
                      top: `${28 + ((index * 13) % 54)}%`,
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg",
                        flagged
                          ? "border-red-300 bg-red-500 text-white"
                          : "border-emerald-300 bg-emerald-500 text-white",
                      )}
                    >
                      <Navigation
                        className="h-4 w-4"
                        style={{ transform: `rotate(${t.heading}deg)` }}
                      />
                    </div>
                    <div className="mt-1 min-w-36 rounded-md bg-white px-2 py-1 text-[11px] shadow">
                      <div className="font-semibold text-slate-900 underline">{driver?.name}</div>
                      <div
                        className={cn(
                          "font-medium",
                          t.speedMph > t.speedLimitMph ? "text-red-600" : "text-slate-600",
                        )}
                      >
                        {t.speedMph} mph / {t.speedLimitMph} limit
                      </div>
                      <div className="text-slate-500">
                        GPS {t.deviceStatus} · {t.gpsLastUpdateMin} min
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {driverTelemetry.map((t) => (
                <GpsCard key={t.driverId} telemetry={t} rides={rides} open={setLayer} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Rider assignment queue with hard-rule
              Assign Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignable.map((ride) => {
              const rider = riders.find((r) => r.id === ride.riderId);
              const options = recommendedDrivers(ride).slice(0, 5);
              const selected = pendingAssignments[ride.id] ?? options[0]?.driver.id ?? "";
              const selectedFit = options.find((o) => o.driver.id === selected)?.fit;
              const state = assignmentState[ride.id];
              return (
                <div key={ride.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        className="text-sm font-medium underline"
                        onClick={() => setLayer({ type: "ride", id: ride.id })}
                      >
                        {ride.id}
                      </button>{" "}
                      <span className="text-sm">·</span>{" "}
                      <button
                        className="text-sm font-medium underline"
                        onClick={() => rider && setLayer({ type: "rider", id: rider.id })}
                      >
                        {rider?.name}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {ride.appointmentTime} · {ride.pickupLocationType} to{" "}
                        {ride.dropoffLocationType}
                      </div>
                    </div>
                    {selectedFit && (
                      <button
                        onClick={() =>
                          setLayer({ type: "fit", rideId: ride.id, driverId: selected })
                        }
                      >
                        <FitBadge fit={selectedFit} />
                      </button>
                    )}
                  </div>
                  <AccommodationBadges ride={ride} />
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={selected}
                      onChange={(e) =>
                        setPendingAssignments((p) => ({ ...p, [ride.id]: e.target.value }))
                      }
                    >
                      {options.map(({ driver, fit }) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - fit {fit.score}
                          {fit.hardFails.length ? " - blocked" : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selected}
                      onClick={() => setLayer({ type: "driver", id: selected })}
                    >
                      Driver Profile
                    </Button>
                    <Button
                      size="sm"
                      disabled={!selected}
                      onClick={() => assignDriver(ride, selected)}
                    >
                      Assign Driver
                    </Button>
                  </div>
                  {selectedFit?.hardFails.length ? (
                    <div className="mt-2 text-xs text-red-700 flex items-start gap-1">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {selectedFit.hardFails[0]}
                    </div>
                  ) : selectedFit ? (
                    <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Eligible: no hard-rule failures detected.
                    </div>
                  ) : null}
                  {state && (
                    <button
                      onClick={() =>
                        setLayer({
                          type: "warning",
                          title: state.ok ? "Assignment success" : "Assignment blocked",
                          detail: state.text,
                        })
                      }
                      className={cn(
                        "mt-2 rounded-md border px-2 py-1 text-xs underline",
                        state.ok
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-red-300 bg-red-50 text-red-800",
                      )}
                    >
                      {state.text}
                    </button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulated online ride request ping system</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignable.slice(0, 3).map((ride) => (
            <div key={ride.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <button
                    className="font-medium underline"
                    onClick={() => setLayer({ type: "ride", id: ride.id })}
                  >
                    Ride request created: {ride.id}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    Eligible providers notified for {ride.appointmentTime}; candidates ranked by fit
                    score.
                  </div>
                </div>
                <Badge>Auto dispatch demo</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {pingProviders(ride).map(({ provider, ranked, eligible, blockedReason }) => {
                  const top = ranked[0];
                  return (
                    <div
                      key={provider.id}
                      className={cn(
                        "rounded-md border p-2",
                        eligible.length
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-amber-200 bg-amber-50/40",
                      )}
                    >
                      <button
                        className="font-medium text-sm underline"
                        onClick={() => setLayer({ type: "provider", id: provider.id })}
                      >
                        {provider.name}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {eligible.length ? `${eligible.length} available driver(s)` : blockedReason}
                      </div>
                      {top && (
                        <button
                          className="mt-1 text-xs underline"
                          onClick={() => setLayer({ type: "driver", id: top.driver.id })}
                        >
                          Top: {top.driver.name} · fit {top.fit.score}
                        </button>
                      )}
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        variant={eligible.length ? "default" : "secondary"}
                        disabled={!eligible.length}
                        onClick={() => eligible[0] && assignDriver(ride, eligible[0].driver.id)}
                      >
                        {eligible.length ? "Accept ride" : "No eligible match"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provider accountability profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setLayer({ type: "provider", id: p.id })}
                className={clickableSurface(
                  "flex w-full items-center justify-between rounded-md border p-2 text-left",
                )}
              >
                <div>
                  <div className="text-sm font-medium underline">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Score {p.accountabilityScore} · Complaints {(p.complaintRate * 100).toFixed(1)}%
                  </div>
                </div>
                <TierBadge tier={p.tier} />
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role privacy matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <SecurityRow
              label="Broker admin"
              detail="Provider/driver profiles, accountability logs, incidents, GPS, conflicts."
            />
            <SecurityRow
              label="Provider admin"
              detail="Own company, drivers, vehicles, assigned rides, own incident logs."
            />
            <SecurityRow
              label="Driver"
              detail="Assigned rides, workflow, limited accommodation labels, no full rider profile."
            />
            <SecurityRow
              label="Caregiver/Rider"
              detail="Booked rides, ETA, driver display name, vehicle type, complaint option."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Broker alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ...overspeed.map((t) => ({
                title: `${drivers.find((d) => d.id === t.driverId)?.name} speed flag`,
                detail: `${t.speedMph} mph in ${t.speedLimitMph} mph zone`,
              })),
              ...gpsExceptions.map((t) => ({
                title: `${drivers.find((d) => d.id === t.driverId)?.name} GPS issue`,
                detail: `${t.deviceStatus}; permission ${t.gpsPermission}; lock ${t.gpsLocked ? "on" : "off"}`,
              })),
            ].map((a) => (
              <button
                key={a.title}
                onClick={() => setLayer({ type: "warning", ...a })}
                className={clickableSurface("w-full rounded-md text-left")}
              >
                <AlertRow title={a.title} detail={a.detail} />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
      <LayerDialog
        layer={layer}
        setLayer={setLayer}
        rides={rides}
        incidents={incidents}
        driverFit={driverFit}
      />
    </div>
  );
}

function AccommodationBadges({ ride }: { ride: Ride }) {
  const rider = riders.find((r) => r.id === ride.riderId);
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {rider?.sensorySensitivity === "high" && (
        <DefinitionBadge
          term="High sensory support"
          className="bg-amber-100 text-amber-800 border border-amber-300"
        >
          High sensory support
        </DefinitionBadge>
      )}
      {rider?.ageGroup === "child" && (
        <DefinitionBadge term="Pediatric-certified driver required">
          Pediatric-certified driver required
        </DefinitionBadge>
      )}
      {ride.noSharedRideRequired && (
        <DefinitionBadge term="No shared ride">No shared ride</DefinitionBadge>
      )}
      {(ride.extraPassengers ?? 0) > 0 && (
        <DefinitionBadge term="Caregiver attending">Caregiver attending</DefinitionBadge>
      )}
      {rider?.needsQuietRide && (
        <DefinitionBadge term="Quiet ride preferred">Quiet ride preferred</DefinitionBadge>
      )}
      {rider?.motionSicknessRisk && (
        <DefinitionBadge term="Motion sensitive">Motion sensitive</DefinitionBadge>
      )}
      {rider?.walkerRequired && (
        <DefinitionBadge term="Door-to-door handoff required">
          Door-to-door handoff required
        </DefinitionBadge>
      )}
    </div>
  );
}

function FitBadge({ fit }: { fit: NonNullable<ReturnType<typeof evaluateDriverForRide>> }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        fit.hardFails.length
          ? "border-red-300 text-red-700"
          : fit.score >= 85
            ? "border-emerald-300 text-emerald-700"
            : "border-amber-300 text-amber-700",
      )}
    >
      Fit {fit.score}
      {fit.hardFails.length ? " · hard fail" : ""}
    </Badge>
  );
}

function GpsCard({
  telemetry,
  rides,
  open,
}: {
  telemetry: {
    driverId: string;
    currentRideId?: string;
    speedMph: number;
    speedLimitMph: number;
    gpsLastUpdateMin: number;
    gpsLocked: boolean;
    deviceStatus: string;
    gpsPermission: string;
  };
  rides: Ride[];
  open: (layer: Layer) => void;
}) {
  const driver = drivers.find((d) => d.id === telemetry.driverId);
  const ride = rides.find((r) => r.id === telemetry.currentRideId);
  const provider = providers.find((p) => p.id === driver?.providerId);
  const vehicle = driver ? vehicles.find((v) => v.assignedDriverId === driver.id) : undefined;
  const rider = ride ? riders.find((r) => r.id === ride.riderId) : undefined;
  const warning =
    telemetry.speedMph > telemetry.speedLimitMph ||
    !telemetry.gpsLocked ||
    telemetry.deviceStatus !== "live";
  return (
    <div className={cn("rounded-lg border p-3", warning && "border-red-300 bg-red-50/40")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <button
            className="font-medium text-sm underline"
            onClick={() => driver && open({ type: "driver", id: driver.id })}
          >
            {driver?.name}
          </button>
          <div className="text-xs text-muted-foreground">
            <button
              className="underline"
              onClick={() => provider && open({ type: "provider", id: provider.id })}
            >
              {provider?.name}
            </button>{" "}
            ·{" "}
            <button
              className="underline"
              onClick={() => vehicle && open({ type: "vehicle", id: vehicle.id })}
            >
              {vehicle?.id}
            </button>
          </div>
        </div>
        <button
          onClick={() =>
            open({
              type: "warning",
              title: warning ? "Active warning" : "Live GPS",
              detail: warning
                ? "Speed or GPS compliance warning requires broker review."
                : "GPS is live and compliant.",
            })
          }
        >
          {warning ? (
            <Badge variant="destructive">Warning</Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
              Live
            </Badge>
          )}
        </button>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Current trip:{" "}
        {ride ? (
          <button className="underline" onClick={() => open({ type: "ride", id: ride.id })}>
            {ride.id}
          </button>
        ) : (
          "No active ride"
        )}{" "}
        · Rider {rider?.name ?? "—"}
      </div>
      <div className="text-xs text-muted-foreground">
        {ride?.pickupLocationType ?? "Mock pickup"} → {ride?.dropoffLocationType ?? "Mock dropoff"}{" "}
        · ETA {telemetry.gpsLastUpdateMin + 8} min
      </div>
    </div>
  );
}

function LayerDialog({
  layer,
  setLayer,
  rides,
  incidents,
  driverFit,
}: {
  layer: Layer | null;
  setLayer: (layer: Layer | null) => void;
  rides: Ride[];
  incidents: ReturnType<typeof useStore>["incidents"];
  driverFit: (ride: Ride, driver: Driver) => ReturnType<typeof evaluateDriverForRide> | null;
}) {
  const title =
    layer?.type === "driver"
      ? "Driver profile"
      : layer?.type === "provider"
        ? "Provider profile"
        : layer?.type === "ride"
          ? "Ride details"
          : layer?.type === "fit"
            ? "Fit score logic"
            : layer?.type === "vehicle"
              ? "Vehicle profile"
              : layer?.type === "rider"
                ? "Rider accommodation layer"
                : layer?.type === "warning"
                  ? layer.title
                  : "Detail";
  return (
    <Dialog open={!!layer} onOpenChange={(o) => !o && setLayer(null)}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {layer?.type === "driver" && (
          <DriverProfile id={layer.id} rides={rides} incidents={incidents} open={setLayer} />
        )}
        {layer?.type === "provider" && (
          <ProviderProfile
            id={layer.id}
            rides={rides}
            incidents={incidents}
            open={setLayer}
            driverFit={driverFit}
          />
        )}
        {layer?.type === "ride" && (
          <RideProfile id={layer.id} rides={rides} open={setLayer} driverFit={driverFit} />
        )}
        {layer?.type === "vehicle" && <VehicleProfile id={layer.id} open={setLayer} />}
        {layer?.type === "rider" && <RiderLayer id={layer.id} />}
        {layer?.type === "fit" && (
          <FitLayer
            rideId={layer.rideId}
            driverId={layer.driverId}
            rides={rides}
            driverFit={driverFit}
          />
        )}
        {layer?.type === "warning" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {layer.detail}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DriverProfile({
  id,
  rides,
  incidents,
  open,
}: {
  id: string;
  rides: Ride[];
  incidents: ReturnType<typeof useStore>["incidents"];
  open: (layer: Layer) => void;
}) {
  const d = drivers.find((x) => x.id === id);
  if (!d) return null;
  const provider = providers.find((p) => p.id === d.providerId);
  const vehicle = vehicles.find((v) => v.assignedDriverId === d.id);
  const booked = rides.filter((r) => r.driverId === d.id);
  const openIncidents = incidents.filter((i) => i.driverId === d.id);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Driver" value={`${d.name} (${d.id})`} />
        <button onClick={() => provider && open({ type: "provider", id: provider.id })}>
          <Info label="Provider" value={provider?.name ?? "—"} />
        </button>
        <button onClick={() => vehicle && open({ type: "vehicle", id: vehicle.id })}>
          <Info label="Vehicle" value={`${vehicle?.id} · ${vehicle?.type} · ${vehicle?.plate}`} />
        </button>
        <Info
          label="Availability"
          value={`${d.availability} · ${d.shiftStart}-${d.shiftEnd} · ${d.serviceRadiusMiles} mi`}
        />
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <Info label="On-time" value={`${(d.onTimeRate * 100).toFixed(0)}%`} />
        <Info label="Complaints" value={d.complaintCount ?? 0} />
        <Info
          label="Missed / late / no-show"
          value={`${d.missedRideCount}/${d.latePickupCount}/${d.noShowCount}`}
        />
        <Info label="Certifications" value={d.certifications?.join(", ")} />
      </div>
      <Tabs defaultValue="rides">
        <TabsList>
          <TabsTrigger value="rides">Booked rides</TabsTrigger>
          <TabsTrigger value="history">Ride history</TabsTrigger>
          <TabsTrigger value="incidents">Incident history</TabsTrigger>
          <TabsTrigger value="accountability">Accountability log</TabsTrigger>
          <TabsTrigger value="fit">Fit score history</TabsTrigger>
        </TabsList>
        <TabsContent value="rides">
          <MiniTable
            rows={booked.map((r) => [r.id, r.appointmentTime, r.status])}
            onRow={(row) => open({ type: "ride", id: String(row[0]) })}
          />
        </TabsContent>
        <TabsContent value="history">
          <MiniTable
            rows={booked
              .concat(rides.filter((r) => r.status === "completed").slice(0, 3))
              .map((r) => [r.id, r.appointmentType, r.status])}
            onRow={(row) => open({ type: "ride", id: String(row[0]) })}
          />
        </TabsContent>
        <TabsContent value="incidents">
          <MiniTable rows={openIncidents.map((i) => [i.id, i.issueType, i.status])} />
        </TabsContent>
        <TabsContent value="accountability">
          <MiniTable
            rows={["Broker review", d.reviewNotes ?? "No notes", "Demo only"].map((x) => [x])}
          />
        </TabsContent>
        <TabsContent value="fit">
          <MiniTable
            rows={(d.fitScoreHistory ?? []).map((s, i) => [
              `Fit run ${i + 1}`,
              s,
              d.hardFailHistory?.[i] ?? "No hard fail",
            ])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderProfile({
  id,
  rides,
  incidents,
  open,
  driverFit,
}: {
  id: string;
  rides: Ride[];
  incidents: ReturnType<typeof useStore>["incidents"];
  open: (layer: Layer) => void;
  driverFit: (ride: Ride, driver: Driver) => ReturnType<typeof evaluateDriverForRide> | null;
}) {
  const p = providers.find((x) => x.id === id);
  if (!p) return null;
  const roster = drivers.filter((d) => d.providerId === p.id);
  const fleet = vehicles.filter((v) => v.providerId === p.id);
  const active = rides.filter((r) => r.providerId === p.id && r.status !== "completed");
  const providerIncidents = incidents.filter((i) => i.providerId === p.id);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Provider" value={`${p.name} (${p.id})`} />
        <Info label="Mock business address" value={p.businessAddress} />
        <Info label="Service area" value={p.coveredServiceArea} />
        <Info label="Compliance" value={`${p.complianceStatus} · ${p.contractStatus}`} />
        <Info label="Contact" value={`${p.contactPhone} · ${p.contactEmail}`} />
        <Info
          label="Licenses"
          value={`${p.companyLicenseNumber} · exp ${p.licenseExpirationDate}`}
        />
        <Info label="Insurance exp." value={p.insuranceExpirationDate} />
        <Info label="Accountability" value={`${p.accountabilityScore} / 100`} />
      </div>
      <div className="grid gap-2 md:grid-cols-7">
        {[
          ["Drivers", roster.length],
          ["Vehicles", fleet.length],
          ["Active rides", active.length],
          ["Incidents", providerIncidents.length],
          ["Complaints", Math.round(p.complaintRate * 100)],
          ["Documents", p.complianceStatus],
          ["Service area", "Open"],
        ].map(([label, value]) => (
          <button
            key={String(label)}
            onClick={() =>
              open({
                type: "warning",
                title: String(label),
                detail: `${label}: ${value}. This card is an inspectable demo layer.`,
              })
            }
            className="rounded-md border p-2 text-left text-xs hover:bg-muted"
          >
            <div className="font-medium underline">{label}</div>
            <div>{value}</div>
          </button>
        ))}
      </div>
      <h3 className="font-medium">Provider driver list</h3>
      <MiniTable
        rows={roster.map((d) => {
          const current = active.find((r) => r.driverId === d.id) ?? active[0];
          const fit = current ? driverFit(current, d) : null;
          const v = vehicles.find((x) => x.assignedDriverId === d.id);
          return [
            d.name,
            d.availability,
            d.currentRideStatus,
            d.certifications?.join(" / "),
            v?.id,
            fit?.score ?? "—",
            incidents.filter((i) => i.driverId === d.id && i.status !== "resolved").length,
            rides.filter(
              (r) =>
                r.driverId === d.id && r.appointmentDate === new Date().toISOString().slice(0, 10),
            ).length,
            d.acceptingRides ? "Accepting" : "Blocked",
          ];
        })}
        onRow={(row) => {
          const d = roster.find((x) => x.name === row[0]);
          if (d) open({ type: "driver", id: d.id });
        }}
      />
    </div>
  );
}

function RideProfile({
  id,
  rides,
  open,
  driverFit,
}: {
  id: string;
  rides: Ride[];
  open: (layer: Layer) => void;
  driverFit: (ride: Ride, driver: Driver) => ReturnType<typeof evaluateDriverForRide> | null;
}) {
  const r = rides.find((x) => x.id === id);
  if (!r) return null;
  const rider = riders.find((x) => x.id === r.riderId);
  const provider = providers.find((p) => p.id === r.providerId);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Ride" value={r.id} />
        <Info label="Rider initials" value={rider?.name} />
        <button onClick={() => provider && open({ type: "provider", id: provider.id })}>
          <Info label="Provider" value={provider?.name} />
        </button>
        <Info label="Locations" value={`${r.pickupLocationType} → ${r.dropoffLocationType}`} />
      </div>
      <AccommodationBadges ride={r} />
      <MiniTable
        rows={drivers
          .slice(0, 8)
          .map((d) => [
            d.name,
            d.providerId,
            driverFit(r, d)?.score ?? "—",
            driverFit(r, d)?.hardFails[0] ?? "Eligible",
          ])}
        onRow={(row) => {
          const d = drivers.find((x) => x.name === row[0]);
          if (d) open({ type: "fit", rideId: r.id, driverId: d.id });
        }}
      />
    </div>
  );
}
function FitLayer({
  rideId,
  driverId,
  rides,
  driverFit,
}: {
  rideId: string;
  driverId: string;
  rides: Ride[];
  driverFit: (ride: Ride, driver: Driver) => ReturnType<typeof evaluateDriverForRide> | null;
}) {
  const ride = rides.find((r) => r.id === rideId);
  const driver = drivers.find((d) => d.id === driverId);
  const fit = ride && driver ? driverFit(ride, driver) : null;
  if (!fit) return null;
  return (
    <div className="space-y-3">
      <FitBadge fit={fit} />
      {fit.hardFails.map((f) => (
        <AlertRow key={f} title="Hard fail" detail={f} />
      ))}
      <MiniTable rows={fit.factors.map((f) => [f.label, `${f.earned}/${f.weight}`])} />
      <div className="rounded-md border bg-muted/40 p-3 text-xs">
        Hard fails override score, including pediatric certification, sensory training, service
        radius, overbooking, vehicle type, unresolved safety incidents, provider compliance, and the
        high sensory no-overcrowding/no-extra-passenger rule.
      </div>
    </div>
  );
}
function VehicleProfile({ id, open }: { id: string; open: (layer: Layer) => void }) {
  const v = vehicles.find((x) => x.id === id);
  const d = drivers.find((x) => x.id === v?.assignedDriverId);
  if (!v) return null;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Info label="Vehicle ID" value={v.id} />
      <Info label="License plate" value={v.plate} />
      <Info label="Type / capacity" value={`${v.type} · ${v.capacity}`} />
      <Info label="Features" value={v.features.join(", ")} />
      <button onClick={() => d && open({ type: "driver", id: d.id })}>
        <Info label="Assigned driver" value={d?.name ?? "—"} />
      </button>
    </div>
  );
}
function RiderLayer({ id }: { id: string }) {
  const r = riders.find((x) => x.id === id);
  if (!r) return null;
  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/40 p-3 text-sm">
        Broker/admin accommodation layer for rider initials {r.name}. No full rider profile or
        sensitive medical detail is shown on the ride board.
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>High sensory: {r.sensorySensitivity}</Badge>
        {r.needsQuietRide && <Badge>Quiet ride preferred</Badge>}
        {r.motionSicknessRisk && <Badge>Motion sensitive</Badge>}
        {r.caregiverRequired && <Badge>Caregiver attending</Badge>}
        {r.noLoudMusic && <Badge>No loud music</Badge>}
      </div>
    </div>
  );
}

function MiniTable({
  rows,
  onRow,
}: {
  rows: (string | number | undefined)[][];
  onRow?: (row: (string | number | undefined)[]) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      {rows.length ? (
        rows.map((row, i) => (
          <button
            key={i}
            disabled={!onRow}
            onClick={() => onRow?.(row)}
            className="grid w-full grid-cols-3 gap-2 border-b p-2 text-left text-xs last:border-b-0 hover:bg-muted disabled:hover:bg-transparent md:grid-cols-4"
          >
            {row.map((cell, j) => (
              <span key={j} className={j === 0 ? "font-medium underline" : "text-muted-foreground"}>
                {cell ?? "—"}
              </span>
            ))}
          </button>
        ))
      ) : (
        <div className="p-3 text-xs text-muted-foreground">No demo records.</div>
      )}
    </div>
  );
}
function Info({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-md border p-2 text-left">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}
function Metric({
  label,
  value,
  tone = "normal",
  to,
  params,
}: {
  label: string;
  value: string | number;
  tone?: "normal" | "danger";
  to?: "/app/dispatch" | "/app/providers" | "/app/details/$topic";
  params?: { topic: string };
}) {
  const card = (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-2xl font-semibold", tone === "danger" && "text-destructive")}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
  if (!to) return card;
  if (to === "/app/details/$topic") {
    return (
      <Link
        to="/app/details/$topic"
        params={params ?? { topic: "provider-roster" }}
        aria-label={`Open ${label}`}
        className={clickableSurface("block rounded-lg")}
      >
        {card}
      </Link>
    );
  }
  if (to === "/app/providers") {
    return (
      <Link
        to="/app/providers"
        aria-label={`Open ${label}`}
        className={clickableSurface("block rounded-lg")}
      >
        {card}
      </Link>
    );
  }
  return (
    <Link
      to="/app/dispatch"
      aria-label={`Open ${label}`}
      className={clickableSurface("block rounded-lg")}
    >
      {card}
    </Link>
  );
}
function SecurityRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex gap-2">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}
function AlertRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50/60 p-2">
      <div className="flex items-center gap-1 text-sm font-medium text-red-800">
        <AlertTriangle className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="text-xs text-red-700">{detail}</div>
    </div>
  );
}
