import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { drivers, providers, riders, vehicles } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import {
  filterIncidentsForScope,
  filterProvidersForScope,
  filterRidesForScope,
  getAccessScope,
} from "@/lib/access-control";
import { EtaBadge, RideStatusBadge, TierBadge, MismatchAlert } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { computeFitScore } from "@/lib/fit-score";
import {
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldAlert,
  Users,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  component: () => (
    <RoleGate allow={["broker", "provider"]}>
      <Dashboard />
    </RoleGate>
  ),
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "warn" | "danger" | "ok";
  delta?: { dir: "up" | "down"; text: string; good?: boolean };
}) {
  const toneCls =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
        ? "text-warning-foreground"
        : tone === "ok"
          ? "text-success"
          : "text-foreground";
  const ringCls =
    tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : tone === "warn"
        ? "bg-warning/20 text-warning-foreground"
        : tone === "ok"
          ? "bg-success/10 text-success"
          : "bg-primary/10 text-primary";
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${ringCls}`}>
            <Icon className="h-4 w-4" />
          </div>
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${delta.good ? "text-success" : "text-destructive"}`}
            >
              {delta.dir === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {delta.text}
            </span>
          )}
        </div>
        <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={`text-2xl font-semibold mt-0.5 tabular-nums ${toneCls}`}>{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        {title}
      </h2>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Dashboard() {
  const { rides, incidents, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const scopedRides = filterRidesForScope(accessScope, rides);
  const scopedIncidents = filterIncidentsForScope(accessScope, incidents);
  const scopedProviders = filterProvidersForScope(accessScope, providers);
  const active = scopedRides.filter((r) =>
    ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
  );
  const scheduled = scopedRides.filter((r) => r.status === "scheduled");
  const lateRisk = scopedRides.filter((r) => r.etaConfidence === "low");
  // Compute hard fit-failures using the real engine so the dashboard surfaces
  // the same problems dispatch sees.
  const fitFailures = scopedRides
    .map((r) => {
      const rider = riders.find((x) => x.id === r.riderId);
      const driver = drivers.find((d) => d.id === r.driverId);
      const vehicle = vehicles.find((v) => v.id === r.vehicleId);
      if (!rider || !driver || !vehicle) return null;
      const fit = computeFitScore(rider, driver, vehicle);
      return fit.hardFails.length || fit.warnings.length ? { ride: r, rider, driver, fit } : null;
    })
    .filter(Boolean) as {
    ride: (typeof scopedRides)[number];
    rider: (typeof riders)[number];
    driver: (typeof drivers)[number];
    fit: ReturnType<typeof computeFitScore>;
  }[];
  const hardFails = fitFailures.filter((f) => f.fit.hardFails.length > 0);
  const onDuty = new Set(active.map((r) => r.driverId).filter(Boolean)).size;
  const stale = scopedRides.filter((r) => r.gpsLastUpdateMin > 5);
  const open = scopedIncidents.filter((i) => i.status !== "resolved");
  const onTime = scopedProviders.length
    ? scopedProviders.reduce((s, p) => s + p.onTimeRate, 0) / scopedProviders.length
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title={
          accessScope.network ? "Today across the network" : `Today for ${accessScope.scopeLabel}`
        }
        description={
          accessScope.network
            ? "Live pulse of every active ride, ETA truth, and care-fit warning across providers."
            : "Live pulse of your assigned company rides, drivers, GPS freshness, and care-fit warnings."
        }
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live · auto-refresh
          </Badge>
        }
      />

      {/* Top priority: any hard fit-fails get a banner above everything else */}
      {hardFails.length > 0 && (
        <MismatchAlert
          level="danger"
          title={`${hardFails.length} ride${hardFails.length > 1 ? "s" : ""} blocked by Fit Score — needs reassignment now`}
          items={hardFails
            .slice(0, 3)
            .map((h) => `${h.ride.id} · ${h.rider.name} → ${h.driver.name}: ${h.fit.hardFails[0]}`)}
        />
      )}

      <section>
        <SectionHeading title="Now" hint="Real-time" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Activity}
            label="Active rides"
            value={active.length}
            hint="Currently moving"
          />
          <Stat icon={Users} label="Drivers on duty" value={onDuty} />
          <Stat
            icon={AlertTriangle}
            label="Late-risk rides"
            value={lateRisk.length}
            tone={lateRisk.length ? "danger" : "ok"}
            hint="Low ETA confidence"
          />
          <Stat
            icon={MapPin}
            label="Stale GPS alerts"
            value={stale.length}
            tone={stale.length ? "warn" : "ok"}
            hint=">5 min no ping"
          />
        </div>
      </section>

      <section>
        <SectionHeading title="Today" hint="Rolling 24h" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Clock} label="Scheduled" value={scheduled.length} />
          <Stat
            icon={ShieldAlert}
            label="Fit-score issues"
            value={fitFailures.length}
            tone={fitFailures.length ? "warn" : "ok"}
            hint={`${hardFails.length} hard, ${fitFailures.length - hardFails.length} soft`}
          />
          <Stat
            icon={AlertTriangle}
            label="Open incidents"
            value={open.length}
            tone={open.length ? "warn" : "ok"}
          />
          <Stat
            icon={TrendingUp}
            label="Network on-time"
            value={`${(onTime * 100).toFixed(0)}%`}
            tone={onTime >= 0.9 ? "ok" : "warn"}
            delta={{ dir: "up", text: "+2.1%", good: true }}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Live ride board</CardTitle>
            <Link
              to="/app/dispatch"
              className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline"
            >
              Open dispatch <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {active
              .concat(scheduled)
              .slice(0, 6)
              .map((r) => {
                const rider = riders.find((x) => x.id === r.riderId);
                const driver = drivers.find((d) => d.id === r.driverId);
                return (
                  <Link
                    key={r.id}
                    to="/app/dispatch"
                    className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/40 hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        <span className="font-mono text-xs text-muted-foreground mr-1.5">
                          {r.id}
                        </span>
                        {rider?.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {driver?.name ?? "Unassigned"} → {r.dropoffAddress}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <EtaBadge level={r.etaConfidence} />
                      <RideStatusBadge status={r.status} />
                    </div>
                  </Link>
                );
              })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Provider performance</CardTitle>
            <Link
              to="/app/providers"
              className="text-xs text-primary inline-flex items-center gap-0.5 hover:underline"
            >
              Detail <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {scopedProviders.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <TierBadge tier={p.tier} />
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                  <span>
                    On-time{" "}
                    <span className="font-medium text-foreground">
                      {(p.onTimeRate * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span>
                    Complaints{" "}
                    <span className="font-medium text-foreground">
                      {(p.complaintRate * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${p.onTimeRate >= 0.95 ? "bg-success" : p.onTimeRate >= 0.85 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${p.onTimeRate * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
