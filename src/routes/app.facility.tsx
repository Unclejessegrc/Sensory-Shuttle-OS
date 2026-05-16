import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { drivers, providers, riders } from "@/lib/mock-data";
import { Clock, MapPin, Stethoscope } from "lucide-react";
import { clickableSurface } from "@/components/ClickableSurface";

export const Route = createFileRoute("/app/facility")({
  component: () => (
    <RoleGate allow={["facility_viewer"]}>
      <FacilityViewer />
    </RoleGate>
  ),
});

function statusTone(status: string) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  if (["en_route_pickup", "arrived_pickup", "in_transit"].includes(status))
    return "bg-sky-100 text-sky-700 border border-sky-300";
  return "bg-muted text-muted-foreground border border-border";
}

function etaTone(confidence: string) {
  if (confidence === "high") return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  if (confidence === "medium") return "bg-amber-100 text-amber-800 border border-amber-300";
  return "bg-red-100 text-red-700 border border-red-300";
}

function FacilityViewer() {
  const { rides } = useStore();
  const visibleRides = rides
    .filter((ride) => ride.status !== "canceled")
    .slice()
    .sort((a, b) =>
      `${a.appointmentDate}T${a.appointmentTime}`.localeCompare(
        `${b.appointmentDate}T${b.appointmentTime}`,
      ),
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Facility / Care Team Viewer
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Appointment transportation status
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Read-only arrival windows and ride status for clinics, therapy offices, hospitals,
            schools, and care coordinators.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Stethoscope className="h-3.5 w-3.5" /> Read-only partner access
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Today's monitored trips" value={visibleRides.length} clickable />
        <Metric
          label="In motion"
          value={
            visibleRides.filter((r) =>
              ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
            ).length
          }
          clickable
        />
        <Metric
          label="Low ETA confidence"
          value={visibleRides.filter((r) => r.etaConfidence === "low").length}
          tone="danger"
          clickable
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transportation status board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleRides.map((ride) => {
            const rider = riders.find((item) => item.id === ride.riderId);
            const driver = drivers.find((item) => item.id === ride.driverId);
            const provider = providers.find((item) => item.id === ride.providerId);
            return (
              <Link
                key={ride.id}
                to="/app/details/$topic"
                params={{ topic: "facility-arrivals" }}
                aria-label={`Open facility status details for ${ride.id}`}
                className={clickableSurface("block rounded-lg border p-4")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {ride.id} · Member {rider?.id ?? ride.riderId}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {ride.appointmentDate} at {ride.appointmentTime}
                      </span>
                      <span>{provider?.name ?? "Provider pending"}</span>
                      <span>{driver?.name ?? "Driver pending"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={statusTone(ride.status)}>
                      {ride.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge className={etaTone(ride.etaConfidence)}>ETA {ride.etaConfidence}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Pickup area</div>
                    <div className="font-medium">{ride.pickupAddress}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">Appointment destination</div>
                    <div className="font-medium">{ride.dropoffAddress}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Facility users can confirm ride status and arrival timing only. Dispatch controls,
                  funding details, and private support notes stay outside this view.
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "normal",
  clickable,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "normal" | "danger";
  clickable?: boolean;
}) {
  const card = (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={
            tone === "danger" ? "text-2xl font-semibold text-destructive" : "text-2xl font-semibold"
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
  if (!clickable) return card;
  return (
    <Link
      to="/app/details/$topic"
      params={{ topic: "facility-arrivals" }}
      aria-label={`Open ${label}`}
      className={clickableSurface("block rounded-lg")}
    >
      {card}
    </Link>
  );
}
