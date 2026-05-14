import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { drivers, providers, riders, vehicles, type Ride } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import {
  canSeeSensitiveNetworkData,
  filterRidesForScope,
  getAccessScope,
  type AccessScope,
} from "@/lib/access-control";
import { EtaBadge, RideStatusBadge } from "@/components/StatusBadge";
import { computeFitScore } from "@/lib/fit-score";
import { FitScoreExplainer } from "@/components/FitScoreExplainer";
import { PageHeader } from "@/components/PageHeader";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { AIDispatchCard } from "@/components/AIDispatchCard";
import { recommendForRide } from "@/lib/ai-dispatch";
import { toast } from "sonner";

export const Route = createFileRoute("/app/dispatch")({
  component: () => (
    <RoleGate allow={["dispatcher", "provider", "broker"]}>
      <Dispatch />
    </RoleGate>
  ),
});

function RideRow({ r, accessScope }: { r: Ride; accessScope: AccessScope }) {
  const { rides, registeredRiders, updateRide, addAudit } = useStore();
  const [open, setOpen] = useState(false);
  const rider = riders.find((x) => x.id === r.riderId);
  const registeredRider = registeredRiders.find((x) => x.id === r.riderId);
  const riderName =
    rider?.name ?? `${registeredRider?.firstName ?? "Unknown"} ${registeredRider?.lastName ?? ""}`;
  const driver = drivers.find((d) => d.id === r.driverId);
  const vehicle = vehicles.find((v) => v.id === r.vehicleId);
  const provider = providers.find((p) => p.id === r.providerId);
  const fit =
    rider && driver && vehicle
      ? computeFitScore(rider, driver, vehicle, provider?.onTimeRate ?? 0.9)
      : null;
  const aiRecommendation = recommendForRide(r, rides, registeredRiders);
  const trackableStatuses = ["en_route_pickup", "arrived_pickup", "in_transit"];
  const canTrackLive = trackableStatuses.includes(r.status);
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);

  const applyRecommendation = () => {
    if (!aiRecommendation) return;
    updateRide(r.id, {
      driverId: aiRecommendation.driver?.id,
      vehicleId: aiRecommendation.vehicle?.id,
      providerId: aiRecommendation.providerId,
      assignmentMode: aiRecommendation.mode,
      externalPartner: aiRecommendation.externalPartner,
      assignmentConfidence: aiRecommendation.confidence,
      estimatedTripMinutes: aiRecommendation.estimatedTripMinutes,
      dispatchRecommendation: aiRecommendation.reasons,
      etaConfidence: aiRecommendation.mode === "manual_review" ? "low" : "high",
      etaReasons: [`AI bot: ${aiRecommendation.title}`, ...aiRecommendation.reasons.slice(0, 2)],
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "dispatcher@demo",
      action: "ai_dispatch.applied",
      entityId: r.id,
      details: aiRecommendation.title,
    });
    toast.success(`AI dispatch applied to ${r.id}`);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/30 cursor-pointer"
          >
            <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-3">
                <div className="text-sm font-medium">{r.id}</div>
                <div className="text-xs text-muted-foreground">{riderName}</div>
              </div>
              <div className="col-span-6 md:col-span-3 text-xs">
                <div className="text-muted-foreground">
                  {r.assignmentMode === "external_tnc" ? "External ride" : "Driver"}
                </div>
                <div>
                  {r.assignmentMode === "external_tnc" ? (
                    <span className="text-primary">
                      {r.externalPartner === "lyft" ? "Lyft Concierge" : "Uber Health"}
                    </span>
                  ) : (
                    (driver?.name ?? <span className="text-destructive">Unassigned</span>)
                  )}
                </div>
              </div>
              <div className="col-span-6 md:col-span-2 text-xs">
                <div className="text-muted-foreground">Vehicle</div>
                <div>{vehicle?.plate ?? "—"}</div>
              </div>
              <div className="col-span-6 md:col-span-2 flex flex-wrap gap-1">
                {canTrackLive ? (
                  <Link
                    to="/app/live-gps/$rideId"
                    params={{ rideId: r.id }}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Open live GPS map for ${r.id}`}
                  >
                    <RideStatusBadge status={r.status} />
                  </Link>
                ) : (
                  <RideStatusBadge status={r.status} />
                )}
                <EtaBadge level={r.etaConfidence} />
              </div>
              <div className="col-span-6 md:col-span-2 flex items-center gap-2">
                {fit && (
                  <Badge
                    variant="outline"
                    className={
                      fit.hardFails.length
                        ? "border-destructive text-destructive"
                        : fit.score >= 85
                          ? "border-success text-success"
                          : "border-warning text-warning-foreground"
                    }
                  >
                    Fit {fit.score}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 py-4 grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Trip
                </div>
                <div>
                  {r.pickupAddress} → {r.dropoffAddress}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {canSeeSensitive
                    ? `${r.appointmentType} · ${r.appointmentTime} · ${r.fundingSource}`
                    : `Appointment · ${r.appointmentTime} · coverage on file`}
                </div>
                <div className="mt-2 text-xs">ETA reasons: {r.etaReasons.join(" · ")}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Care needs
                </div>
                <div className="flex flex-wrap gap-1">
                  {(rider?.wheelchairRequired ||
                    registeredRider?.mobilityNeeds.some(
                      (m) => m === "Wheelchair" || m === "Power Wheelchair",
                    )) && <DefinitionBadge term="Wheelchair" />}
                  {(rider?.boosterSeatRequired ||
                    registeredRider?.mobilityNeeds.some(
                      (m) => m === "Booster Seat" || m === "Car Seat",
                    )) && <DefinitionBadge term="Booster" />}
                  {rider?.walkerRequired && <Badge variant="secondary">Walker</Badge>}
                  {(rider?.needsQuietRide || registeredRider?.quietRideRequired) && (
                    <DefinitionBadge term="Quiet ride" />
                  )}
                  {(rider?.noStrongScents || registeredRider?.noStrongScents) && (
                    <DefinitionBadge term="No scents" />
                  )}
                  {(rider?.noLoudMusic || registeredRider?.noLoudMusic) && (
                    <DefinitionBadge term="No loud music" />
                  )}
                  {(rider?.extraPickupPatience || registeredRider?.extraPickupPatienceRequired) && (
                    <DefinitionBadge term="Extra patience" />
                  )}
                  {(rider?.sensorySensitivity === "high" ||
                    registeredRider?.sensorySupport === "High") && (
                    <DefinitionBadge
                      term="High sensory"
                      className="bg-warning text-warning-foreground"
                    >
                      High sensory
                    </DefinitionBadge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline">
                  Reassign driver
                </Button>
                <Button size="sm" variant="outline">
                  Message driver
                </Button>
                {canTrackLive && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/app/live-gps/$rideId" params={{ rideId: r.id }}>
                      Open live GPS map
                    </Link>
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  View rider profile
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <AIDispatchCard
                recommendation={aiRecommendation}
                onApply={r.status === "scheduled" ? applyRecommendation : undefined}
                compact={!!r.driverId || r.assignmentMode === "external_tnc"}
              />
              {fit && <FitScoreExplainer fit={fit} />}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function Dispatch() {
  const { rides, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const visibleRides = filterRidesForScope(accessScope, rides);
  const active = visibleRides.filter((r) =>
    ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
  );
  const scheduled = visibleRides.filter((r) => r.status === "scheduled");
  const lateRisk = visibleRides.filter((r) => r.etaConfidence === "low");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dispatch"
        title="Live ride board"
        description={
          accessScope.network
            ? "Fit Score and ETA truth on every network ride. Hard fails are blocked from dispatch until reassigned."
            : "Company ride board for assigned drivers, GPS status, and appointments without sensitive coverage details."
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ride board</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({visibleRides.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
              <TabsTrigger value="late">Late risk ({lateRisk.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-2 mt-4">
              {visibleRides.map((r) => (
                <RideRow key={r.id} r={r} accessScope={accessScope} />
              ))}
            </TabsContent>
            <TabsContent value="active" className="space-y-2 mt-4">
              {active.map((r) => (
                <RideRow key={r.id} r={r} accessScope={accessScope} />
              ))}
            </TabsContent>
            <TabsContent value="scheduled" className="space-y-2 mt-4">
              {scheduled.map((r) => (
                <RideRow key={r.id} r={r} accessScope={accessScope} />
              ))}
            </TabsContent>
            <TabsContent value="late" className="space-y-2 mt-4">
              {lateRisk.map((r) => (
                <RideRow key={r.id} r={r} accessScope={accessScope} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
