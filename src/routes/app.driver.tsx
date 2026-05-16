import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { drivers, riders, vehicles } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
  Lock,
  Satellite,
  Gauge,
} from "lucide-react";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { clickableSurface } from "@/components/ClickableSurface";

export const Route = createFileRoute("/app/driver")({
  component: () => (
    <RoleGate allow={["driver", "dispatcher", "broker", "provider"]}>
      <DriverView />
    </RoleGate>
  ),
});

function DriverView() {
  const { rides, updateRide, addAudit, driverTelemetry, updateDriverTelemetry } = useStore();
  const navigate = useNavigate();
  // Pretend signed-in driver = d1
  const driver = drivers.find((d) => d.id === "d1")!;
  const todays = rides.filter((r) => r.driverId === driver.id).slice(0, 3);
  const next = todays.find((r) => r.status !== "completed") ?? todays[0];
  const rider = next ? riders.find((x) => x.id === next.riderId) : undefined;
  const vehicle = next ? vehicles.find((v) => v.id === next.vehicleId) : undefined;
  const telemetry = driverTelemetry.find((t) => t.driverId === driver.id);
  const gpsReady =
    telemetry?.gpsPermission === "accepted" &&
    telemetry.gpsLocked &&
    telemetry.deviceStatus === "live";

  const checklist = useMemo(() => {
    if (!rider) return [];
    const items: { key: string; label: string }[] = [
      { key: "notes", label: "Rider notes reviewed" },
    ];
    if (rider.needsQuietRide)
      items.push({ key: "quiet", label: "Quiet ride confirmed (radio off)" });
    if (rider.noStrongScents) items.push({ key: "scent", label: "No strong scents in vehicle" });
    if (rider.caregiverRequired) items.push({ key: "cg", label: "Caregiver seat ready" });
    if (rider.boosterSeatRequired)
      items.push({ key: "booster", label: "Booster seat installed & checked" });
    if (rider.extraPickupPatience)
      items.push({ key: "patience", label: "Extra pickup patience noted" });
    return items;
  }, [rider]);

  const [done, setDone] = useState<Record<string, boolean>>({});
  const allDone = checklist.every((c) => done[c.key]);

  if (!next || !rider) return <div>No rides assigned.</div>;

  const requestGpsLock = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      updateDriverTelemetry(driver.id, {
        gpsPermission: "accepted",
        gpsLocked: true,
        deviceStatus: "live",
        gpsLastUpdateISO: new Date().toISOString(),
        currentRideId: next.id,
      });
      toast.success("GPS lock accepted for this route");
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        const speedMph =
          position.coords.speed == null
            ? (telemetry?.speedMph ?? 0)
            : Math.round(position.coords.speed * 2.23694);
        updateDriverTelemetry(driver.id, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speedMph,
          gpsPermission: "accepted",
          gpsLocked: true,
          deviceStatus: "live",
          gpsLastUpdateISO: new Date().toISOString(),
          currentRideId: next.id,
          locationSource: "driver_app",
        });
      },
      () => {
        updateDriverTelemetry(driver.id, {
          gpsPermission: "denied",
          gpsLocked: false,
          deviceStatus: "offline",
          gpsLastUpdateISO: new Date().toISOString(),
        });
        toast.error("Location access is required before starting an assigned ride");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    toast.success("GPS lock request sent");
  };

  const sendDemoPing = () => {
    updateDriverTelemetry(driver.id, {
      lat: (telemetry?.lat ?? 40.7128) + 0.002,
      lng: (telemetry?.lng ?? -74.006) + 0.002,
      speedMph: Math.max(18, Math.round((telemetry?.speedMph ?? 24) + 3)),
      speedLimitMph: telemetry?.speedLimitMph ?? 35,
      gpsPermission: "accepted",
      gpsLocked: true,
      deviceStatus: "live",
      gpsLastUpdateISO: new Date().toISOString(),
      currentRideId: next.id,
      locationSource: "driver_app",
    });
    toast.success("Live GPS ping sent to broker console");
  };

  const advance = (status: typeof next.status, label: string) => {
    if (!gpsReady && status !== "scheduled") {
      toast.error("Accept location tracking before changing ride status");
      return;
    }
    updateRide(next.id, { status });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: `driver@${driver.id}`,
      action: `ride.${status}`,
      entityId: next.id,
      details: label,
    });
    toast.success(label);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-32 md:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today's route</h1>
          <p className="text-sm text-muted-foreground">
            Driver: {driver.name} · assigned rides only
          </p>
        </div>
        <Badge variant="outline">{todays.length} stops</Badge>
      </div>

      <Card
        className={
          gpsReady ? "border-emerald-300 bg-emerald-50/40" : "border-amber-300 bg-amber-50/40"
        }
      >
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 rounded-full bg-background p-2 border">
                <Satellite className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">Required GPS lock</div>
                <div className="text-xs text-muted-foreground">
                  Location must stay active for the full assigned ride so the broker can see live
                  position, speed, and accountability alerts.
                </div>
              </div>
            </div>
            <Badge
              className={
                gpsReady
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }
            >
              <Lock className="h-3 w-3 mr-1" /> {gpsReady ? "Locked" : "Required"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border bg-background p-2">
              <div className="text-muted-foreground">Permission</div>
              <div className="font-semibold capitalize">
                {telemetry?.gpsPermission ?? "pending"}
              </div>
            </div>
            <div className="rounded-md border bg-background p-2">
              <div className="text-muted-foreground">Speed</div>
              <div className="font-semibold flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {telemetry?.speedMph ?? 0} mph
              </div>
            </div>
            <div className="rounded-md border bg-background p-2">
              <div className="text-muted-foreground">Last ping</div>
              <div className="font-semibold">{telemetry?.gpsLastUpdateMin ?? 0} min</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={requestGpsLock}>
              {gpsReady ? "Refresh GPS lock" : "Accept location tracking"}
            </Button>
            <Button size="sm" variant="outline" onClick={sendDemoPing}>
              Send live ping
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/40 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                Next pickup
              </span>
            </div>
            <Badge className="text-base px-3 py-1">{next.appointmentTime}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-lg font-semibold">{rider.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              Transport support profile · {rider.mobilityLevel}
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-primary" />
            {next.pickupAddress}
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Clock className="h-4 w-4 mt-0.5 text-primary" />→ {next.dropoffAddress} · Appointment
            stop
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Open rider support details"
            onClick={() =>
              navigate({ to: "/app/details/$topic", params: { topic: "driver-support" } })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate({ to: "/app/details/$topic", params: { topic: "driver-support" } });
              }
            }}
            className={clickableSurface("rounded-lg bg-accent/40 p-3")}
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Rider support needs
            </div>
            <div className="flex flex-wrap gap-1" onClick={(event) => event.stopPropagation()}>
              {rider.needsQuietRide && <DefinitionBadge term="Quiet ride" />}
              {rider.noStrongScents && <DefinitionBadge term="No scents" />}
              {rider.noLoudMusic && (
                <DefinitionBadge term="No loud music">No music</DefinitionBadge>
              )}
              {rider.boosterSeatRequired && <DefinitionBadge term="Booster" />}
              {rider.wheelchairRequired && <DefinitionBadge term="Wheelchair" />}
              {rider.extraPickupPatience && <DefinitionBadge term="Extra patience" />}
            </div>
            {rider.deEscalationNotes && (
              <div className="mt-2 text-sm">
                <span className="font-medium">De-escalation: </span>
                {rider.deEscalationNotes}
              </div>
            )}
            <div className="mt-2 text-sm">
              <span className="font-medium">Instructions: </span>
              {rider.driverInstructions}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Pre-trip checklist
            </div>
            <div className="space-y-2">
              {checklist.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!done[c.key]}
                    onCheckedChange={(v) => setDone((p) => ({ ...p, [c.key]: !!v }))}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {!allDone && (
              <div className="mt-2 text-xs text-warning-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Complete all items and accept GPS tracking
                to start the route.
              </div>
            )}
          </div>

          {/* Quick contact row — large mobile-friendly tap targets */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              size="lg"
              variant="outline"
              className="h-12"
              onClick={() => toast("Calling caregiver")}
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12"
              onClick={() => toast("Message sent")}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12"
              onClick={() => toast("Opening navigation")}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Navigate
            </Button>
          </div>

          {/* Status progression — desktop only; mobile uses sticky footer */}
          <div className="hidden md:grid grid-cols-2 gap-2 pt-1">
            <Button
              disabled={!allDone || !gpsReady}
              onClick={() => advance("en_route_pickup", "Route started")}
            >
              Start route
            </Button>
            <Button
              variant="outline"
              onClick={() => advance("arrived_pickup", "Arrived at pickup")}
            >
              Arrived at pickup
            </Button>
            <Button variant="outline" onClick={() => advance("in_transit", "Rider picked up")}>
              Rider picked up
            </Button>
            <Button variant="outline" onClick={() => advance("completed", "Rider dropped off")}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Dropped off
            </Button>
            <Button variant="outline" onClick={() => toast("Dispatch notified — running late")}>
              Running late
            </Button>
            <Button variant="outline" onClick={() => advance("no_show", "Rider no-show reported")}>
              Rider no-show
            </Button>
            <Button
              variant="destructive"
              className="col-span-2"
              onClick={() => toast("Incident form opened")}
            >
              Report incident
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Vehicle: {vehicle?.plate ?? "—"} · {vehicle?.type ?? ""}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rest of today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todays.slice(1).map((r) => {
            const rd = riders.find((x) => x.id === r.riderId);
            return (
              <Link
                key={r.id}
                to="/app/details/$topic"
                params={{ topic: "driver-support" }}
                aria-label={`Open ride detail for ${rd?.name ?? r.id}`}
                className={clickableSurface("flex items-center justify-between rounded border p-2")}
              >
                <div>
                  <div className="text-sm font-medium">
                    {r.appointmentTime} · {rd?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.pickupAddress} → {r.dropoffAddress}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {r.status.replace(/_/g, " ")}
                </Badge>
              </Link>
            );
          })}
          {todays.length <= 1 && (
            <div className="text-sm text-muted-foreground">No more stops scheduled.</div>
          )}
        </CardContent>
      </Card>

      {/* Mobile sticky footer: primary "advance" CTA always within thumb reach */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur p-3 space-y-2">
        <div className="flex gap-2">
          <Button
            size="lg"
            disabled={!allDone || !gpsReady}
            className="flex-1 h-12"
            onClick={() => advance("en_route_pickup", "Route started")}
          >
            {!gpsReady
              ? "GPS required"
              : allDone
                ? "Start route"
                : `Complete ${checklist.filter((c) => !done[c.key]).length} checks`}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12"
            onClick={() => advance("arrived_pickup", "Arrived at pickup")}
          >
            Arrived
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => advance("in_transit", "Rider picked up")}
          >
            Picked up
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => advance("completed", "Rider dropped off")}
          >
            Dropped off
          </Button>
          <Button size="sm" variant="destructive" onClick={() => toast("Incident form opened")}>
            Issue
          </Button>
        </div>
      </div>
    </div>
  );
}
