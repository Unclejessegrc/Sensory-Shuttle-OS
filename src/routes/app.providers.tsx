import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { providers, drivers, riders } from "@/lib/mock-data";
import { TierBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { filterProvidersForScope, getAccessScope } from "@/lib/access-control";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Gauge,
  MapPin,
  MessageSquareWarning,
  Navigation,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clickableSurface } from "@/components/ClickableSurface";

export const Route = createFileRoute("/app/providers")({
  component: () => (
    <RoleGate allow={["provider", "broker"]}>
      <Providers />
    </RoleGate>
  ),
});

function Pct({ v, invert }: { v: number; invert?: boolean }) {
  const good = invert ? v < 0.05 : v > 0.9;
  return (
    <span
      className={
        good
          ? "text-success font-medium"
          : v > 0.7
            ? "text-warning-foreground font-medium"
            : "text-destructive font-medium"
      }
    >
      {(v * 100).toFixed(1)}%
    </span>
  );
}

function Providers() {
  const { rides, incidents, auditLogs, driverTelemetry, role } = useStore();
  const { roles } = useAuth();
  const navigate = useNavigate();
  const accessScope = getAccessScope(roles, role);
  const visibleProviders = filterProvidersForScope(accessScope, providers);
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const provider =
    visibleProviders.find((p) => p.id === providerId) ?? visibleProviders[0] ?? providers[0];

  useEffect(() => {
    if (!provider) return;
    if (!visibleProviders.some((p) => p.id === providerId)) setProviderId(provider.id);
  }, [provider, providerId, visibleProviders]);

  const providerDrivers = useMemo(
    () => drivers.filter((d) => d.providerId === provider.id),
    [provider.id],
  );
  const providerRides = rides.filter((r) => r.providerId === provider.id);
  const activeRides = providerRides.filter((r) =>
    ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
  );
  const providerIncidents = incidents.filter((i) => i.providerId === provider.id);
  const providerTelemetry = driverTelemetry.filter((t) =>
    providerDrivers.some((d) => d.id === t.driverId),
  );
  const installedDrivers = providerTelemetry.filter(
    (t) => t.gpsPermission === "accepted" && t.gpsLocked,
  );
  const speedFlags = providerTelemetry.filter((t) => t.speedMph > t.speedLimitMph);
  const gpsFlags = providerTelemetry.filter(
    (t) => t.gpsPermission !== "accepted" || !t.gpsLocked || t.deviceStatus !== "live",
  );

  const networkRemarks = [
    ...providerIncidents.map((i) => ({
      id: i.id,
      title: i.issueType,
      detail: i.reporterStatement,
      tone: "danger" as const,
    })),
    ...providerRides
      .filter((r) => r.etaConfidence === "low")
      .map((r) => ({
        id: `${r.id}-eta`,
        title: "ETA confidence dropped",
        detail: `${r.id}: ${r.etaReasons.join("; ")}`,
        tone: "warning" as const,
      })),
    ...auditLogs
      .filter((a) => providerRides.some((r) => r.id === a.entityId))
      .slice(0, 4)
      .map((a) => ({
        id: a.id,
        title: a.action,
        detail: a.details,
        tone: "neutral" as const,
      })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Driving company mirror
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Provider accountability portal</h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            The transportation company sees the same broker-visible GPS, speed, arrival, navigation,
            incident, and network remark data for its own drivers.
          </p>
        </div>
        {accessScope.network ? (
          <select
            className="h-9 min-w-64 rounded-md border bg-background px-3 text-sm"
            value={provider.id}
            onChange={(e) => setProviderId(e.target.value)}
          >
            {visibleProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant="outline" className="h-9 px-3 text-sm">
            {accessScope.scopeLabel}
          </Badge>
        )}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-1 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Network participation requirement</div>
                <p className="text-sm text-muted-foreground">
                  To stay active in the transportation network, each provider company must have
                  every active driver install the driver app, accept location settings, and keep GPS
                  locked during assigned rides.
                </p>
              </div>
            </div>
            <Badge
              className={cn(
                "justify-center",
                installedDrivers.length === providerDrivers.length
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300",
              )}
            >
              {installedDrivers.length}/{providerDrivers.length} drivers compliant
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric
          label="Company tier"
          value={<TierBadge tier={provider.tier} />}
          to="/app/details/$topic"
          topic="provider-roster"
        />
        <Metric label="Active rides" value={activeRides.length} to="/app/dispatch" />
        <Metric
          label="Driver app locks"
          value={`${installedDrivers.length}/${providerDrivers.length}`}
          to="/app/details/$topic"
          topic="provider-roster"
        />
        <Metric
          label="Speed flags"
          value={speedFlags.length}
          tone={speedFlags.length ? "danger" : "normal"}
          to="/app/details/$topic"
          topic="speed-flags"
        />
        <Metric
          label="GPS exceptions"
          value={gpsFlags.length}
          tone={gpsFlags.length ? "danger" : "normal"}
          to="/app/details/$topic"
          topic="stale-gps"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" /> Broker-visible driver operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providerDrivers.map((driver) => {
              const t = providerTelemetry.find((x) => x.driverId === driver.id);
              const currentRide = t?.currentRideId
                ? providerRides.find((r) => r.id === t.currentRideId)
                : providerRides.find((r) => r.driverId === driver.id);
              const rider = currentRide
                ? riders.find((r) => r.id === currentRide.riderId)
                : undefined;
              const speedFlag = !!t && t.speedMph > t.speedLimitMph;
              const gpsFlag =
                !t || t.gpsPermission !== "accepted" || !t.gpsLocked || t.deviceStatus !== "live";

              return (
                <div
                  key={driver.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${driver.name} driver operations detail`}
                  onClick={() =>
                    navigate({ to: "/app/details/$topic", params: { topic: "provider-roster" } })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate({
                        to: "/app/details/$topic",
                        params: { topic: "provider-roster" },
                      });
                    }
                  }}
                  className={cn(
                    clickableSurface("rounded-lg border p-3"),
                    (speedFlag || gpsFlag) && "border-red-300 bg-red-50/40",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{driver.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {currentRide?.id ?? "No assigned ride"} - {rider?.name ?? "No rider"} -{" "}
                        {currentRide?.status.replace(/_/g, " ") ?? "available"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {gpsFlag ? (
                        <Badge variant="destructive">GPS exception</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> App locked
                        </Badge>
                      )}
                      {speedFlag && <Badge variant="destructive">Over limit</Badge>}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-4 text-xs">
                    <MiniStat label="Speed" value={`${t?.speedMph ?? 0} mph`} bad={speedFlag} />
                    <MiniStat label="Limit" value={`${t?.speedLimitMph ?? 0} mph`} />
                    <MiniStat
                      label="GPS age"
                      value={`${t?.gpsLastUpdateMin ?? "-"} min`}
                      bad={gpsFlag}
                    />
                    <MiniStat
                      label="Source"
                      value={t?.locationSource.replace(/_/g, " ") ?? "not enrolled"}
                    />
                  </div>

                  {currentRide && (
                    <div className="mt-3 rounded-md border bg-background p-2 text-xs">
                      <div className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Navigation and arrival trail
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Pickup: {currentRide.pickupAddress} - Dropoff: {currentRide.dropoffAddress}
                      </div>
                      <div className="mt-1">
                        Status visible to network operations:{" "}
                        <span className="font-medium capitalize">
                          {currentRide.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  )}

                  {rider && (
                    <div
                      className="mt-3 flex flex-wrap gap-1"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {rider.sensorySensitivity === "high" && (
                        <DefinitionBadge
                          term="High sensory"
                          className="bg-warning text-warning-foreground"
                        >
                          High sensory
                        </DefinitionBadge>
                      )}
                      {rider.needsQuietRide && <DefinitionBadge term="Quiet ride" />}
                      {rider.noStrongScents && <DefinitionBadge term="No scents" />}
                      {rider.wheelchairRequired && <DefinitionBadge term="Wheelchair" />}
                      {rider.boosterSeatRequired && <DefinitionBadge term="Booster" />}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareWarning className="h-4 w-4 text-primary" /> Broker-visible remarks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {networkRemarks.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No negative remarks or ride exceptions.
              </div>
            )}
            {networkRemarks.map((remark) => (
              <Link
                key={remark.id}
                to="/app/incidents"
                className={cn(
                  clickableSurface("block rounded-md border p-3"),
                  remark.tone === "danger" && "border-red-200 bg-red-50/60",
                  remark.tone === "warning" && "border-amber-200 bg-amber-50/60",
                )}
              >
                <div className="flex items-center gap-1 text-sm font-medium">
                  {remark.tone !== "neutral" && <AlertTriangle className="h-3.5 w-3.5" />}
                  {remark.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{remark.detail}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {visibleProviders.map((p) => (
          <Link
            key={p.id}
            to="/app/details/$topic"
            params={{ topic: "provider-roster" }}
            aria-label={`Open ${p.name} provider profile detail`}
            className={clickableSurface("block rounded-lg")}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> {p.name}
                  </CardTitle>
                  <TierBadge tier={p.tier} />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Completed" value={p.completedRides} />
                <Field label="On-time" value={<Pct v={p.onTimeRate} />} />
                <Field label="Complaints" value={<Pct v={p.complaintRate} invert />} />
                <Field label="Canceled" value={p.canceledRides} />
                <Field label="Disputed no-shows" value={p.disputedNoShows} />
                <Field label="Stale GPS" value={p.staleGpsEvents} />
                <Field label="ETA accuracy" value={<Pct v={p.etaAccuracy} />} />
                <Field label="Satisfaction" value={`${p.riderSatisfaction.toFixed(1)} / 5`} />
                <Field label="Sensory failures" value={<Pct v={p.sensoryFailureRate} invert />} />
                <Field
                  label="High-sens. success"
                  value={<Pct v={p.highSensitivitySuccessRate} />}
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "normal",
  to,
  topic,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "normal" | "danger";
  to?: "/app/dispatch" | "/app/details/$topic";
  topic?: string;
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
        params={{ topic: topic ?? "provider-roster" }}
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

function MiniStat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className={cn("rounded-md border bg-background p-2", bad && "border-red-300 bg-red-50")}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("font-semibold capitalize", bad && "text-red-700")}>{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
