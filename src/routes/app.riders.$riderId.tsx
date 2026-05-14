import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { drivers, riders } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  canAccessLegacyRider,
  canSeeSensitiveNetworkData,
  getAccessScope,
} from "@/lib/access-control";
import { ChevronLeft, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/riders/$riderId")({
  loader: ({ params }) => {
    const rider = riders.find((r) => r.id === params.riderId);
    if (!rider) throw notFound();
    return { rider };
  },
  component: () => (
    <RoleGate allow={["dispatcher", "broker", "provider"]}>
      <RiderProfile />
    </RoleGate>
  ),
  notFoundComponent: () => <div>Rider not found.</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

function RiderProfile() {
  const { rider } = Route.useLoaderData();
  const { rides, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);
  if (!canAccessLegacyRider(accessScope, rider.id, rides)) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          This rider profile is outside your locked access scope.
        </CardContent>
      </Card>
    );
  }
  const yes = (b: boolean) =>
    b ? <Badge variant="secondary">Yes</Badge> : <span className="text-muted-foreground">No</span>;
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <Link
        to="/app/riders"
        className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All riders
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{rider.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {rider.ageGroup} · {rider.mobilityLevel}
            {canSeeSensitive ? ` · ${rider.fundingSource}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/book" search={{ date: undefined }}>
            <Button>Book ride</Button>
          </Link>
          <Button variant="outline">Edit profile</Button>
        </div>
      </div>
      {rider.sensorySensitivity === "high" && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning-foreground mt-0.5" />
          <div>
            <span className="font-medium">High sensory sensitivity.</span> Only assign
            sensory-trained drivers. Review de-escalation notes before pickup.
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mobility & equipment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Wheelchair required" value={yes(rider.wheelchairRequired)} />
            <Field label="Walker required" value={yes(rider.walkerRequired)} />
            <Field label="Booster seat required" value={yes(rider.boosterSeatRequired)} />
            <Field label="Caregiver required" value={yes(rider.caregiverRequired)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sensory & comfort</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field
              label="Sensory sensitivity"
              value={<span className="capitalize">{rider.sensorySensitivity}</span>}
            />
            <Field label="Motion sickness risk" value={yes(rider.motionSicknessRisk)} />
            <Field label="Needs quiet ride" value={yes(rider.needsQuietRide)} />
            <Field label="No strong scents" value={yes(rider.noStrongScents)} />
            <Field label="No loud music" value={yes(rider.noLoudMusic)} />
            <Field
              label="Predictable communication"
              value={yes(rider.needsPredictableCommunication)}
            />
            <Field label="Extra pickup patience" value={yes(rider.extraPickupPatience)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Driver matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Preferred drivers"
              value={
                rider.preferredDrivers.length
                  ? rider.preferredDrivers.map(driverName).join(", ")
                  : "—"
              }
            />
            <Field
              label="Blocked drivers"
              value={
                rider.blockedDrivers.length ? (
                  <span className="text-destructive">
                    {rider.blockedDrivers.map(driverName).join(", ")}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triggers & de-escalation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Known triggers"
              value={
                rider.triggers.length ? (
                  <div className="flex flex-wrap gap-1">
                    {rider.triggers.map((t: string) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "—"
                )
              }
            />
            <Field label="De-escalation notes" value={rider.deEscalationNotes || "—"} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Driver instructions & contacts</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Field label="Driver instructions" value={rider.driverInstructions} />
            {canSeeSensitive && <Field label="Funding source" value={rider.fundingSource} />}
            {canSeeSensitive && <Field label="Emergency contact" value={rider.emergencyContact} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
