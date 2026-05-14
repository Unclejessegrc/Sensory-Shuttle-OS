import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { PageHeader } from "@/components/PageHeader";
import { RideStatusBadge, EtaBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { canAccessRide, canSeeSensitiveNetworkData, getAccessScope } from "@/lib/access-control";
import {
  drivers,
  providers,
  riders,
  vehicles,
  type DriverTelemetry,
  type Ride,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Car,
  Clock,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/app/live-gps/$rideId")({
  component: () => (
    <RoleGate allow={["dispatcher", "broker", "provider", "caregiver"]}>
      <LiveGpsPage />
    </RoleGate>
  ),
});

type MapPoint = {
  x: number;
  y: number;
  lat: number;
  lng: number;
};

type GpsPing = MapPoint & {
  id: string;
  ts: string;
  gapMinutes: number;
  speedMph: number;
  heading: number;
};

const TRACKABLE_STATUSES = ["en_route_pickup", "arrived_pickup", "in_transit"];
const MAX_GPS_GAP_MINUTES = 15;
const DEMO_UPDATE_MIN_MS = 5000;
const DEMO_UPDATE_MAX_MS = 9000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomGapMinutes() {
  return Math.floor(randomBetween(4, MAX_GPS_GAP_MINUTES));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function routeProgressForStatus(status: Ride["status"]) {
  if (status === "en_route_pickup") return 0.28;
  if (status === "arrived_pickup") return 0.42;
  if (status === "in_transit") return 0.66;
  return 0.12;
}

function buildRoutePoints(lat?: number, lng?: number): MapPoint[] {
  const baseLat = lat ?? 40.7128;
  const baseLng = lng ?? -74.006;

  return [
    { x: 12, y: 74, lat: baseLat - 0.0068, lng: baseLng - 0.0076 },
    { x: 31, y: 57, lat: baseLat - 0.0032, lng: baseLng - 0.0034 },
    { x: 52, y: 49, lat: baseLat + 0.0011, lng: baseLng + 0.0018 },
    { x: 70, y: 32, lat: baseLat + 0.0054, lng: baseLng + 0.0065 },
    { x: 86, y: 18, lat: baseLat + 0.0092, lng: baseLng + 0.0114 },
  ];
}

function interpolateRoute(points: MapPoint[], progress: number): MapPoint {
  const safeProgress = clamp(progress, 0, 1);
  const segmentProgress = safeProgress * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(segmentProgress));
  const localProgress = segmentProgress - index;
  const start = points[index];
  const end = points[index + 1];

  return {
    x: start.x + (end.x - start.x) * localProgress + randomBetween(-1.4, 1.4),
    y: start.y + (end.y - start.y) * localProgress + randomBetween(-1.4, 1.4),
    lat: start.lat + (end.lat - start.lat) * localProgress + randomBetween(-0.0004, 0.0004),
    lng: start.lng + (end.lng - start.lng) * localProgress + randomBetween(-0.0004, 0.0004),
  };
}

function buildInitialPings(
  routePoints: MapPoint[],
  status: Ride["status"],
  telemetry?: DriverTelemetry,
): GpsPing[] {
  const now = Date.now();
  const baseProgress = routeProgressForStatus(status);
  const gaps = [13, 9, telemetry?.gpsLastUpdateMin ? clamp(telemetry.gpsLastUpdateMin, 1, 14) : 4];
  const progressSteps = [baseProgress - 0.14, baseProgress - 0.07, baseProgress];

  return gaps.map((gap, index) => {
    const point = interpolateRoute(routePoints, progressSteps[index]);
    return {
      ...point,
      id: `gps-${index}`,
      ts: new Date(now - gap * 60 * 1000).toISOString(),
      gapMinutes: gap,
      speedMph:
        index === gaps.length - 1 ? (telemetry?.speedMph ?? 26) : Math.round(randomBetween(14, 33)),
      heading:
        index === gaps.length - 1 ? (telemetry?.heading ?? 38) : Math.round(randomBetween(0, 359)),
    };
  });
}

function LiveGpsPage() {
  const { rideId } = Route.useParams();
  const { rides, driverTelemetry, updateDriverTelemetry, updateRide, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const ride = rides.find((item) => item.id === rideId);
  const canViewRide = !!ride && canAccessRide(accessScope, ride);
  const rider = riders.find((item) => item.id === ride?.riderId);
  const driver = drivers.find((item) => item.id === ride?.driverId);
  const vehicle = vehicles.find((item) => item.id === ride?.vehicleId);
  const provider = providers.find((item) => item.id === ride?.providerId);
  const telemetry = driverTelemetry.find(
    (item) => item.currentRideId === ride?.id || item.driverId === ride?.driverId,
  );
  const routePoints = useMemo(
    () => buildRoutePoints(telemetry?.lat, telemetry?.lng),
    [telemetry?.lat, telemetry?.lng],
  );
  const updateDriverTelemetryRef = useRef(updateDriverTelemetry);
  const updateRideRef = useRef(updateRide);
  const lastRideIdRef = useRef(ride?.id);
  const [progress, setProgress] = useState(() =>
    routeProgressForStatus(ride?.status ?? "scheduled"),
  );
  const [pings, setPings] = useState<GpsPing[]>(() =>
    ride ? buildInitialPings(routePoints, ride.status, telemetry) : [],
  );

  useEffect(() => {
    updateDriverTelemetryRef.current = updateDriverTelemetry;
    updateRideRef.current = updateRide;
  }, [updateDriverTelemetry, updateRide]);

  useEffect(() => {
    if (!ride) return;
    if (lastRideIdRef.current === ride.id) return;
    lastRideIdRef.current = ride.id;
    setProgress(routeProgressForStatus(ride.status));
    setPings(buildInitialPings(routePoints, ride.status, telemetry));
  }, [ride, routePoints, telemetry]);

  useEffect(() => {
    if (!ride?.driverId || !TRACKABLE_STATUSES.includes(ride.status)) return;

    let timer: ReturnType<typeof setTimeout>;
    const queueNextPing = () => {
      timer = setTimeout(
        () => {
          setProgress((currentProgress) => {
            const nextProgress = clamp(currentProgress + randomBetween(0.035, 0.11), 0.08, 0.95);
            const gapMinutes = randomGapMinutes();
            const point = interpolateRoute(routePoints, nextProgress);
            const nextPing: GpsPing = {
              ...point,
              id: `gps-${Date.now()}`,
              ts: new Date().toISOString(),
              gapMinutes,
              speedMph: Math.round(randomBetween(12, 37)),
              heading: Math.round(randomBetween(0, 359)),
            };

            setPings((history) => [...history.slice(-6), nextPing]);
            updateDriverTelemetryRef.current(ride.driverId!, {
              lat: Number(nextPing.lat.toFixed(5)),
              lng: Number(nextPing.lng.toFixed(5)),
              heading: nextPing.heading,
              speedMph: nextPing.speedMph,
              gpsLastUpdateISO: nextPing.ts,
              gpsLastUpdateMin: 0,
              gpsPermission: "accepted",
              gpsLocked: true,
              deviceStatus: "live",
              locationSource: telemetry?.locationSource ?? "driver_app",
            });
            updateRideRef.current(ride.id, {
              gpsLastUpdateMin: 0,
              driverMoving: nextPing.speedMph > 3,
              etaConfidence: "high",
              etaReasons: [
                `Live GPS ping received ${gapMinutes} min after prior ping`,
                "Driver location refreshed on map",
              ],
            });

            return nextProgress;
          });
          queueNextPing();
        },
        Math.round(randomBetween(DEMO_UPDATE_MIN_MS, DEMO_UPDATE_MAX_MS)),
      );
    };

    queueNextPing();
    return () => clearTimeout(timer);
  }, [ride?.id, ride?.driverId, ride?.status, routePoints, telemetry?.locationSource]);

  if (!ride) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/app/dispatch">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dispatch
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ride not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewRide) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to={accessScope.role === "caregiver" ? "/app/caregiver" : "/app/dispatch"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This ride is outside your locked access scope.
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPing = pings[pings.length - 1];
  const isTrackable = TRACKABLE_STATUSES.includes(ride.status);
  const staleRisk = (telemetry?.gpsLastUpdateMin ?? ride.gpsLastUpdateMin) >= MAX_GPS_GAP_MINUTES;
  const routePath = routePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const canSeeNetworkData = canSeeSensitiveNetworkData(accessScope);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link to={accessScope.role === "caregiver" ? "/app/caregiver" : "/app/dispatch"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <PageHeader
        eyebrow="Live GPS"
        title={`${ride.id} vehicle tracking`}
        description={
          accessScope.role === "caregiver"
            ? "Day-of ride tracking for your booked trip. The demo refreshes the vehicle location automatically."
            : "Simulated live map for assigned operational visibility. GPS pings update randomly in the demo and every logged interval is capped below 15 minutes."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <RideStatusBadge status={ride.status} />
            <EtaBadge level={ride.etaConfidence} />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Live vehicle map
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ride.pickupAddress} to {ride.dropoffAddress}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5",
                    isTrackable
                      ? "bg-success/10 text-success border-success/40"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {isTrackable ? "Live GPS on" : "GPS idle"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5",
                    staleRisk
                      ? "bg-destructive/10 text-destructive border-destructive/40"
                      : "bg-primary/10 text-primary border-primary/30",
                  )}
                >
                  {staleRisk ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  Max gap {MAX_GPS_GAP_MINUTES} min
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative min-h-[470px] overflow-hidden bg-[linear-gradient(135deg,hsl(var(--muted))_0%,hsl(var(--background))_55%,hsl(var(--primary)/0.08)_100%)]">
              <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:42px_42px]" />
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points={routePath}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={routePath}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5 4"
                />
              </svg>

              <MapMarker
                point={routePoints[0]}
                label="Pickup"
                detail={ride.pickupAddress}
                tone="pickup"
              />
              <MapMarker
                point={routePoints[routePoints.length - 1]}
                label="Dropoff"
                detail={ride.dropoffAddress}
                tone="dropoff"
              />

              {pings.slice(-5, -1).map((ping) => (
                <div
                  key={ping.id}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 bg-primary/30"
                  style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
                />
              ))}

              {currentPing && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${currentPing.x}%`, top: `${currentPing.y}%` }}
                >
                  <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 animate-ping" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-xl">
                    <Car className="h-5 w-5" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 grid gap-3 rounded-lg border bg-card/95 p-4 shadow-lg backdrop-blur md:grid-cols-4">
                <MapStat
                  icon={Clock}
                  label="Last ping"
                  value={currentPing ? formatTime(currentPing.ts) : "Waiting"}
                />
                <MapStat
                  icon={Activity}
                  label="Ping gap"
                  value={currentPing ? `${currentPing.gapMinutes} min` : "-"}
                />
                <MapStat
                  icon={Navigation}
                  label="Speed"
                  value={currentPing ? `${currentPing.speedMph} mph` : "-"}
                />
                <MapStat
                  icon={MapPin}
                  label="Coordinates"
                  value={
                    currentPing
                      ? `${currentPing.lat.toFixed(4)}, ${currentPing.lng.toFixed(4)}`
                      : "-"
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ride details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Detail label="Rider" value={rider?.name ?? "Unknown rider"} />
              <Detail label="Driver" value={driver?.name ?? "Unassigned"} />
              <Detail
                label="Vehicle"
                value={vehicle ? `${vehicle.plate} - ${vehicle.type}` : "Unassigned"}
              />
              {canSeeNetworkData && (
                <Detail label="Provider" value={provider?.name ?? "Unknown provider"} />
              )}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Route progress</span>
                  <span className="font-medium">{Math.round(progress * 100)}%</span>
                </div>
                <Progress value={Math.round(progress * 100)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">GPS ping history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pings
                .slice()
                .reverse()
                .map((ping, index) => (
                  <div
                    key={ping.id}
                    className={cn(
                      "rounded-lg border p-3 text-xs",
                      index === 0 ? "bg-primary/5 border-primary/30" : "bg-background",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{formatTime(ping.ts)}</div>
                      <Badge
                        variant="outline"
                        className={
                          ping.gapMinutes < MAX_GPS_GAP_MINUTES
                            ? "bg-success/10 text-success border-success/40"
                            : "bg-destructive/10 text-destructive border-destructive/40"
                        }
                      >
                        {ping.gapMinutes} min gap
                      </Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {ping.lat.toFixed(5)}, {ping.lng.toFixed(5)} | {ping.speedMph} mph | heading{" "}
                      {ping.heading} deg
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MapMarker({
  point,
  label,
  detail,
  tone,
}: {
  point: MapPoint;
  label: string;
  detail: string;
  tone: "pickup" | "dropoff";
}) {
  return (
    <div
      className="absolute max-w-[190px] -translate-x-1/2 -translate-y-full rounded-lg border bg-card/95 px-3 py-2 text-xs shadow-md"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <span
          className={cn("h-2 w-2 rounded-full", tone === "pickup" ? "bg-primary" : "bg-success")}
        />
        {label}
      </div>
      <div className="mt-0.5 truncate text-muted-foreground">{detail}</div>
    </div>
  );
}

function MapStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-right font-medium">{value}</div>
    </div>
  );
}
