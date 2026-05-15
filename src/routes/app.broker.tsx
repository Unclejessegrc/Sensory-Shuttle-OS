import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { AIDispatchCard } from "@/components/AIDispatchCard";
import { recommendForRide } from "@/lib/ai-dispatch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { drivers, providers, riders, vehicles } from "@/lib/mock-data";
import type { Ride } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { TierBadge } from "@/components/StatusBadge";
import {
  AlertTriangle,
  HelpCircle,
  KeyRound,
  Lock,
  Navigation,
  Radar,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DriverCandidate } from "@/lib/ai-dispatch";

export const Route = createFileRoute("/app/broker")({
  component: () => (
    <RoleGate allow={["broker"]}>
      <Broker />
    </RoleGate>
  ),
});

function Broker() {
  const { rides, updateRide, addAudit, driverTelemetry, registeredRiders } = useStore();
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [tourOpen, setTourOpen] = useState(false);
  const [lastAssignment, setLastAssignment] = useState<{
    rideId: string;
    previous: Partial<Ride>;
    driverName: string;
  } | null>(null);

  const totalRides = providers.reduce((s, p) => s + p.completedRides, 0);
  const networkOnTime = providers.reduce((s, p) => s + p.onTimeRate, 0) / providers.length;
  const activeRides = rides.filter((r) =>
    ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
  );
  const overspeed = driverTelemetry.filter((t) => t.speedMph > t.speedLimitMph);
  const gpsExceptions = driverTelemetry.filter(
    (t) => !t.gpsLocked || t.deviceStatus !== "live" || t.gpsPermission !== "accepted",
  );
  const atRisk = providers.filter((p) => p.tier === "Watch List" || p.onTimeRate < 0.85);

  const assignable = useMemo(() => rides.filter((r) => r.status === "scheduled"), [rides]);
  const visibleAssignable = useMemo(
    () => assignable.filter((ride) => brokerRideMatchesSearch(ride, query, providerFilter)),
    [assignable, providerFilter, query],
  );
  const visibleTelemetry = useMemo(
    () =>
      driverTelemetry.filter((telemetry) =>
        brokerDriverMatchesSearch(telemetry.driverId, query, providerFilter),
      ),
    [driverTelemetry, providerFilter, query],
  );

  const assignDriver = (ride: Ride, candidate: DriverCandidate, override = false) => {
    const reason = overrideReasons[ride.id]?.trim() ?? "";
    if (!override && candidate.hardFails.length) {
      toast.error("Assignment blocked by hard rules. Add a supervisor override reason first.");
      return;
    }
    if (override && reason.length < 12) {
      toast.error("A supervisor override reason is required.");
      return;
    }

    setLastAssignment({
      rideId: ride.id,
      previous: {
        driverId: ride.driverId,
        providerId: ride.providerId,
        vehicleId: ride.vehicleId,
        assignmentMode: ride.assignmentMode,
        assignmentConfidence: ride.assignmentConfidence,
        dispatchRecommendation: ride.dispatchRecommendation,
        etaConfidence: ride.etaConfidence,
        etaReasons: ride.etaReasons,
      },
      driverName: candidate.driver.name,
    });
    updateRide(ride.id, {
      driverId: candidate.driver.id,
      providerId: candidate.driver.providerId,
      vehicleId: candidate.vehicle?.id,
      assignmentMode: override ? "manual_review" : "internal_nemt",
      assignmentConfidence: candidate.score,
      dispatchRecommendation: override
        ? [
            `Broker override for ${candidate.driver.name}`,
            reason,
            ...candidate.hardFails.slice(0, 2),
          ]
        : [`Broker assigned ${candidate.driver.name}`, `Fit score ${candidate.score}`],
      etaConfidence: override ? "low" : "high",
      etaReasons: override
        ? [`Broker override: ${reason}`, "Monitor trip manually"]
        : ["Broker assigned by rider fit", "GPS lock required before route start"],
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "broker@network-demo",
      action: override ? "broker.driver_override_assigned" : "broker.driver_assigned",
      entityId: ride.id,
      details: override
        ? `${candidate.driver.name} assigned with override: ${reason}`
        : `${candidate.driver.name} assigned with GPS lock requirement`,
    });
    toast.success(`${candidate.driver.name} assigned to ${ride.id}`);
  };

  const undoAssignment = () => {
    if (!lastAssignment) return;
    updateRide(lastAssignment.rideId, lastAssignment.previous);
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "broker@network-demo",
      action: "broker.assignment_undone",
      entityId: lastAssignment.rideId,
      details: `Reverted assignment of ${lastAssignment.driverName}`,
    });
    toast.success(`Assignment reverted for ${lastAssignment.rideId}`);
    setLastAssignment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Broker network command center
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Live NEMT oversight</h1>
          <p className="text-sm text-muted-foreground">
            Rider eligibility, driver fit, GPS lock, live location, and speed accountability in one
            secured view.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Lock className="h-3.5 w-3.5" /> Admin password protected
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Rides this month" value={totalRides.toLocaleString()} />
        <Metric label="Network on-time" value={`${(networkOnTime * 100).toFixed(0)}%`} />
        <Metric label="Active rides" value={activeRides.length} />
        <Metric
          label="Speed flags"
          value={overspeed.length}
          tone={overspeed.length ? "danger" : "normal"}
        />
        <Metric
          label="GPS exceptions"
          value={gpsExceptions.length}
          tone={gpsExceptions.length ? "danger" : "normal"}
        />
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Network search and filters
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTourOpen((v) => !v)}
            >
              <HelpCircle className="mr-1 h-4 w-4" /> Guide
            </Button>
          </div>
          {tourOpen && (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Search narrows the live map, driver telemetry cards, and assignment queue. Pick a
              driver first, then the recommendation card explains that selected driver instead of
              promoting a different one.
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-[1fr_220px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rider initials, ride ID, driver, provider, status, or pickup time"
            />
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
            >
              <option value="all">All providers</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" /> Live driver map and accountability
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
                <div className="text-xs font-semibold text-slate-900">Broker live GPS</div>
                <div className="text-[11px] text-slate-600">
                  Drivers cannot start assigned rides until location is accepted and locked.
                </div>
              </div>
              {visibleTelemetry.map((t, index) => {
                const driver = drivers.find((d) => d.id === t.driverId);
                const flagged =
                  t.speedMph > t.speedLimitMph || t.deviceStatus !== "live" || !t.gpsLocked;
                const left = 12 + ((index * 19) % 74);
                const top = 28 + ((index * 13) % 54);
                return (
                  <div
                    key={t.driverId}
                    className="absolute"
                    style={{ left: `${left}%`, top: `${top}%` }}
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
                      <div className="font-semibold text-slate-900">{driver?.name}</div>
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
                  </div>
                );
              })}
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {visibleTelemetry.map((t) => {
                const driver = drivers.find((d) => d.id === t.driverId);
                const ride = rides.find((r) => r.id === t.currentRideId);
                const provider = providers.find((p) => p.id === driver?.providerId);
                const speedFlag = t.speedMph > t.speedLimitMph;
                const gpsFlag =
                  !t.gpsLocked || t.deviceStatus !== "live" || t.gpsPermission !== "accepted";
                return (
                  <div
                    key={t.driverId}
                    className={cn(
                      "rounded-lg border p-3",
                      (speedFlag || gpsFlag) && "border-red-300 bg-red-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{driver?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {provider?.name} · {ride?.id ?? "No active ride"}
                        </div>
                      </div>
                      {speedFlag ? (
                        <Badge variant="destructive">Speed flag</Badge>
                      ) : gpsFlag ? (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                          GPS issue
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                          Live
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <MiniStat label="Speed" value={`${t.speedMph} mph`} bad={speedFlag} />
                      <MiniStat label="Limit" value={`${t.speedLimitMph} mph`} />
                      <MiniStat label="GPS age" value={`${t.gpsLastUpdateMin} min`} bad={gpsFlag} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Rider assignment queue
              </CardTitle>
              {lastAssignment && (
                <Button size="sm" variant="outline" onClick={undoAssignment}>
                  Undo {lastAssignment.driverName}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleAssignable.map((ride) => {
              const rider = riders.find((r) => r.id === ride.riderId);
              const baseRecommendation = recommendForRide(
                ride,
                rides,
                registeredRiders,
                ride.driverId,
              );
              const baseOptions = baseRecommendation?.candidates ?? [];
              const selected =
                pendingAssignments[ride.id] ??
                ride.driverId ??
                baseRecommendation?.driver?.id ??
                baseOptions[0]?.driver.id ??
                "";
              const aiRecommendation = recommendForRide(ride, rides, registeredRiders, selected);
              const options = aiRecommendation?.candidates ?? baseOptions;
              const selectedCandidate = options.find((o) => o.driver.id === selected);
              const selectedFit =
                selectedCandidate ??
                (selected ? options.find((o) => o.driver.id === selected) : undefined);
              const overrideReason = overrideReasons[ride.id] ?? "";
              return (
                <div key={ride.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">
                        {ride.id} · {rider?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ride.appointmentTime} · {ride.pickupAddress} to {ride.dropoffAddress}
                      </div>
                    </div>
                    {selectedFit && (
                      <Badge
                        variant="outline"
                        className={cn(
                          selectedFit.hardFails.length
                            ? "border-red-300 text-red-700"
                            : selectedFit.score >= 85
                              ? "border-emerald-300 text-emerald-700"
                              : "border-amber-300 text-amber-700",
                        )}
                      >
                        Fit {selectedFit.score}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rider?.wheelchairRequired && (
                      <DefinitionBadge term="WAV vehicle">WAV required</DefinitionBadge>
                    )}
                    {rider?.boosterSeatRequired && (
                      <DefinitionBadge term="Booster">Booster</DefinitionBadge>
                    )}
                    {rider?.sensorySensitivity === "high" && (
                      <DefinitionBadge
                        term="High sensory"
                        className="bg-amber-100 text-amber-800 border border-amber-300"
                      >
                        High sensory
                      </DefinitionBadge>
                    )}
                    {rider?.needsQuietRide && <DefinitionBadge term="Quiet ride" />}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={selected}
                      onChange={(e) =>
                        setPendingAssignments((p) => ({ ...p, [ride.id]: e.target.value }))
                      }
                    >
                      {options.map((candidate) => (
                        <option key={candidate.driver.id} value={candidate.driver.id}>
                          {candidate.driver.name} - fit {candidate.score}
                          {candidate.hardFails.length ? " - blocked" : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!selected || !!selectedFit?.hardFails.length}
                      onClick={() => selectedCandidate && assignDriver(ride, selectedCandidate)}
                    >
                      Assign
                    </Button>
                  </div>
                  {!!selectedFit?.hardFails.length && (
                    <div className="mt-2 text-xs text-red-700 flex items-start gap-1">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {selectedFit.hardFails.join("; ")}
                    </div>
                  )}
                  {!!selectedFit?.hardFails.length && selectedCandidate && (
                    <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-3">
                      <Textarea
                        value={overrideReason}
                        onChange={(event) =>
                          setOverrideReasons((current) => ({
                            ...current,
                            [ride.id]: event.target.value,
                          }))
                        }
                        placeholder="Supervisor override reason is required before assigning a blocked driver."
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => assignDriver(ride, selectedCandidate, true)}
                      >
                        Use anyway with override
                      </Button>
                    </div>
                  )}
                  <div className="mt-3">
                    <AIDispatchCard recommendation={aiRecommendation} compact />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Security controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SecurityRow
              label="Supabase password login"
              detail="Every broker user signs in before the network operations console loads."
            />
            <SecurityRow
              label="Admin-set roles"
              detail="Admins grant broker, provider, dispatcher, driver, and caregiver access."
            />
            <SecurityRow
              label="Driver app registration"
              detail="Companies stay active only when assigned drivers install the app and accept GPS tracking."
            />
            <SecurityRow
              label="Audit trail"
              detail="Assignments, GPS exceptions, and rider updates are timestamped."
            />
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Registered rider records in secure console: {registeredRiders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provider accountability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    On-time {(p.onTimeRate * 100).toFixed(0)}% · GPS stale {p.staleGpsEvents}
                  </div>
                </div>
                <TierBadge tier={p.tier} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Broker alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overspeed.map((t) => {
              const driver = drivers.find((d) => d.id === t.driverId);
              return (
                <AlertRow
                  key={t.driverId}
                  title={`${driver?.name} over speed limit`}
                  detail={`${t.speedMph} mph in ${t.speedLimitMph} mph zone`}
                />
              );
            })}
            {gpsExceptions.map((t) => {
              const driver = drivers.find((d) => d.id === t.driverId);
              return (
                <AlertRow
                  key={`${t.driverId}-gps`}
                  title={`${driver?.name} GPS not compliant`}
                  detail={`${t.deviceStatus}; permission ${t.gpsPermission}; lock ${t.gpsLocked ? "on" : "off"}`}
                />
              );
            })}
            {atRisk.map((p) => (
              <AlertRow
                key={p.id}
                title={`${p.name} on watch`}
                detail={`Complaint rate ${(p.complaintRate * 100).toFixed(1)}%, on-time ${(p.onTimeRate * 100).toFixed(0)}%`}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function brokerRideMatchesSearch(ride: Ride, query: string, providerId: string) {
  const normalized = query.trim().toLowerCase();
  const rider = riders.find((item) => item.id === ride.riderId);
  const driver = drivers.find((item) => item.id === ride.driverId);
  const provider = providers.find((item) => item.id === ride.providerId);
  const vehicle = vehicles.find((item) => item.id === ride.vehicleId);
  const haystack = [
    ride.id,
    ride.status,
    ride.appointmentTime,
    ride.appointmentType,
    rider?.name,
    driver?.name,
    provider?.name,
    vehicle?.type,
    vehicle?.plate,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    (!normalized || haystack.includes(normalized)) &&
    (providerId === "all" || ride.providerId === providerId)
  );
}

function brokerDriverMatchesSearch(driverId: string, query: string, providerId: string) {
  const normalized = query.trim().toLowerCase();
  const driver = drivers.find((item) => item.id === driverId);
  const provider = providers.find((item) => item.id === driver?.providerId);
  const haystack = [driver?.id, driver?.name, provider?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    (!normalized || haystack.includes(normalized)) &&
    (providerId === "all" || driver?.providerId === providerId)
  );
}

function Metric({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string | number;
  tone?: "normal" | "danger";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-2xl font-semibold", tone === "danger" && "text-destructive")}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2",
        bad && "border-red-300 bg-red-50 text-red-700",
      )}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
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
