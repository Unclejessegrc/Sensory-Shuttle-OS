import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  Clock,
  HelpCircle,
  MessageSquare,
  Search,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
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
import {
  recommendForRide,
  type DispatchRecommendation,
  type DriverCandidate,
  type ExternalPartner,
} from "@/lib/ai-dispatch";
import {
  EXTERNAL_RIDESHARE_FALLBACK_REASONS,
  buildRideshareWarningContext,
  rideLinkedRegisteredRider,
  rideshareAuditDetails,
  rideshareDetailNotes,
  ridesharePartnerLabel,
  type ExternalRideshareFallbackReason,
} from "@/lib/rideshare-fallback";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [reassignOpen, setReassignOpen] = useState(false);
  const rider = riders.find((x) => x.id === r.riderId);
  const registeredRider = rideLinkedRegisteredRider(r, registeredRiders);
  const riderName =
    rider?.name ?? `${registeredRider?.firstName ?? "Unknown"} ${registeredRider?.lastName ?? ""}`;
  const driver = drivers.find((d) => d.id === r.driverId);
  const vehicle = vehicles.find((v) => v.id === r.vehicleId);
  const provider = providers.find((p) => p.id === r.providerId);
  const fit =
    rider && driver && vehicle
      ? computeFitScore(rider, driver, vehicle, provider?.onTimeRate ?? 0.9)
      : null;
  const aiRecommendation = recommendForRide(r, rides, registeredRiders, r.driverId);
  const trackableStatuses = ["en_route_pickup", "arrived_pickup", "in_transit"];
  const canTrackLive = trackableStatuses.includes(r.status);
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);

  const applyRecommendation = () => {
    if (!aiRecommendation) return;
    if (aiRecommendation.mode === "manual_review") {
      toast.error(
        "Assignment blocked by hard rules. Use reassignment review or supervisor override.",
      );
      return;
    }
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
              {r.assignmentMode === "external_tnc" && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
                  <div className="font-semibold text-warning-foreground">
                    External rideshare selected
                  </div>
                  <div className="mt-1">
                    Selected fallback reason:{" "}
                    <span className="font-medium">
                      {r.externalFallbackReason ?? "Reason pending in legacy demo data"}
                    </span>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Selected by {r.externalFallbackSelectedByRole ?? "demo user"}
                    {r.externalFallbackSelectedAt
                      ? ` at ${new Date(r.externalFallbackSelectedAt).toLocaleString()}`
                      : ""}
                  </div>
                  {!!r.externalFallbackWarnings?.length && (
                    <ul className="mt-2 list-disc pl-5 text-warning-foreground">
                      {r.externalFallbackWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
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
                <Button size="sm" variant="outline" onClick={() => setReassignOpen(true)}>
                  Reassign driver
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message driver
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
              {fit && <FitScoreExplainer fit={fit} />}
              <AIDispatchCard
                recommendation={aiRecommendation}
                onApply={r.status === "scheduled" ? applyRecommendation : undefined}
                compact={!!r.driverId || r.assignmentMode === "external_tnc"}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
      <ReassignDriverDialog
        ride={r}
        recommendation={aiRecommendation}
        open={reassignOpen}
        onOpenChange={setReassignOpen}
      />
    </Collapsible>
  );
}

const RIDESHARE_OPTIONS: {
  id: ExternalPartner;
  label: string;
  eta: string;
  estimate: string;
}[] = [
  { id: "lyft", label: "Lyft Concierge", eta: "12-18 min", estimate: "$24-$32" },
  { id: "uber", label: "Uber Health", eta: "10-16 min", estimate: "$26-$35" },
];

function ReassignDriverDialog({
  ride,
  recommendation,
  open,
  onOpenChange,
}: {
  ride: Ride;
  recommendation: DispatchRecommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateRide, addAudit, registeredRiders, role } = useStore();
  const [overrideDriverId, setOverrideDriverId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [ridesharePartner, setRidesharePartner] = useState<ExternalPartner | "">("");
  const [rideshareReason, setRideshareReason] = useState<ExternalRideshareFallbackReason | "">("");
  const candidates = recommendation?.candidates ?? [];
  const rider = riders.find((item) => item.id === ride.riderId);
  const registeredRider = rideLinkedRegisteredRider(ride, registeredRiders);
  const rideshareWarningContext = buildRideshareWarningContext(rider, registeredRider);
  const rideshareWarnings = rideshareWarningContext.warnings;

  const assignCandidate = (candidate: DriverCandidate, override = false) => {
    if (!override && !candidate.available) {
      toast.error("Driver is blocked by hard rules. Use supervisor override with a reason.");
      return;
    }
    if (override && overrideReason.trim().length < 12) {
      toast.error("Add a supervisor justification before using a blocked driver.");
      return;
    }
    updateRide(ride.id, {
      driverId: candidate.driver.id,
      providerId: candidate.driver.providerId,
      vehicleId: candidate.vehicle?.id,
      assignmentMode: override ? "manual_review" : "internal_nemt",
      assignmentConfidence: candidate.score,
      dispatchRecommendation: override
        ? [
            `Supervisor override for ${candidate.driver.name}`,
            overrideReason.trim(),
            ...candidate.hardFails.slice(0, 2),
          ]
        : [
            `Dispatcher selected ${candidate.driver.name}`,
            `Fit score ${candidate.score}`,
            ...candidate.warnings.slice(0, 2),
          ],
      etaConfidence: override ? "low" : "high",
      etaReasons: override
        ? [`Supervisor override: ${overrideReason.trim()}`, "Dispatch must monitor manually"]
        : [
            `Dispatcher reassigned to ${candidate.driver.name}`,
            "GPS lock required before route start",
          ],
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "dispatcher@demo",
      action: override ? "dispatch.override_assignment" : "dispatch.driver_reassigned",
      entityId: ride.id,
      details: override
        ? `${candidate.driver.name} assigned despite block. Reason: ${overrideReason.trim()}`
        : `${candidate.driver.name} assigned from reassignment dialog`,
    });
    toast.success(
      override
        ? `Override logged and ${candidate.driver.name} assigned`
        : `${candidate.driver.name} assigned to ${ride.id}`,
    );
    setOverrideDriverId(null);
    setOverrideReason("");
    onOpenChange(false);
  };

  const scheduleLater = () => {
    updateRide(ride.id, {
      assignmentMode: "manual_review",
      etaConfidence: "medium",
      etaReasons: ["Queued for next available qualified driver", "Dispatcher review pending"],
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "dispatcher@demo",
      action: "dispatch.assignment_queued",
      entityId: ride.id,
      details: "Ride queued for next available qualified driver window",
    });
    toast.success(`${ride.id} queued for the next qualified driver window`);
    onOpenChange(false);
  };

  const requestRideshare = (partner: ExternalPartner) => {
    if (!rideshareReason) {
      toast.error("Select a reason for external rideshare use before continuing.");
      return;
    }
    const timestamp = new Date().toISOString();
    const label = ridesharePartnerLabel(partner);
    updateRide(ride.id, {
      driverId: undefined,
      vehicleId: undefined,
      providerId: "p-ext",
      assignmentMode: "external_tnc",
      externalPartner: partner,
      externalFallbackReason: rideshareReason,
      externalFallbackSelectedByRole: role,
      externalFallbackSelectedAt: timestamp,
      externalFallbackWarnings: rideshareWarnings.map((warning) => warning.title),
      assignmentConfidence: recommendation?.confidence ?? 72,
      etaConfidence: "medium",
      etaReasons: [
        `External fallback requested: ${label}`,
        `Fallback reason required: ${rideshareReason}`,
        "Broker monitoring remains active",
      ],
      dispatchRecommendation: [
        `External rideshare fallback requested through ${label}`,
        ...rideshareDetailNotes(rideshareReason, rideshareWarnings),
      ],
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: timestamp,
      actor: `${role}@demo`,
      action: "dispatch.external_rideshare_requested",
      entityId: ride.id,
      details: rideshareAuditDetails({
        rideId: ride.id,
        riderId: ride.riderId,
        role,
        reason: rideshareReason,
        timestamp,
        warnings: rideshareWarnings,
        flags: rideshareWarningContext.flags,
        partner,
      }),
    });
    toast.success(`${label} fallback requested for ${ride.id}`);
    setRidesharePartner("");
    setRideshareReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reassign driver for {ride.id}</DialogTitle>
          <DialogDescription>
            Manual controls come first. AI output is shown as a recommendation only after the
            candidate list.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {candidates.map((candidate) => (
            <div key={candidate.driver.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-primary" />
                    {candidate.driver.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {candidate.providerName} - {candidate.vehicle?.type ?? "Vehicle pending"} -{" "}
                    {candidate.windowLabel}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">Fit {candidate.score}</Badge>
                  {candidate.driver.sensoryTrained && <Badge variant="secondary">Sensory</Badge>}
                  {candidate.driver.pediatricCertified && (
                    <Badge variant="secondary">Pediatric</Badge>
                  )}
                  {candidate.driver.wheelchairCertified && <Badge variant="secondary">WAV</Badge>}
                  {candidate.available ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Blocked</Badge>
                  )}
                </div>
              </div>
              {candidate.hardFails.length > 0 && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Blocked reason
                  </div>
                  <div>{candidate.hardFails.slice(0, 2).join("; ")}</div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => assignCandidate(candidate)}
                  disabled={!candidate.available}
                >
                  Assign Driver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setOverrideDriverId((current) =>
                      current === candidate.driver.id ? null : candidate.driver.id,
                    )
                  }
                >
                  Use anyway
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast("Driver profile opened")}>
                  View profile
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast("Message sent to driver")}>
                  Message driver
                </Button>
              </div>
              {overrideDriverId === candidate.driver.id && (
                <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
                  <Label>Supervisor override justification</Label>
                  <Textarea
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                    placeholder="Example: no other certified driver available; broker supervisor approved manual monitoring."
                  />
                  <Button size="sm" onClick={() => assignCandidate(candidate, true)}>
                    Log override and assign
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium text-sm flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Schedule later
              </div>
              <div className="text-xs text-muted-foreground">
                Queue the ride for the next qualified driver window and leave it visible to
                dispatch.
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={scheduleLater}>
              Queue for next slot
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-medium text-sm">External rideshare fallback</div>
              <div className="text-xs text-muted-foreground">
                External rideshare available with documented reason and visible warnings.
              </div>
            </div>
            <Badge variant="outline">Fallback reason required</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {RIDESHARE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={ridesharePartner === option.id ? "default" : "outline"}
                className="h-auto justify-between gap-3 p-3"
                onClick={() => setRidesharePartner(option.id)}
              >
                <span className="text-left">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    ETA {option.eta} - est. {option.estimate}
                  </span>
                </span>
                <span className="text-xs">
                  {ridesharePartner === option.id ? "Selected" : "Order rideshare"}
                </span>
              </Button>
            ))}
          </div>
          {ridesharePartner && (
            <div className="mt-3 space-y-3 rounded-md border bg-muted/30 p-3">
              <div>
                <Label htmlFor="dispatch-rideshare-reason">Reason for external rideshare use</Label>
                <select
                  id="dispatch-rideshare-reason"
                  required
                  value={rideshareReason}
                  onChange={(event) =>
                    setRideshareReason(event.target.value as ExternalRideshareFallbackReason)
                  }
                  className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select an approved reason</option>
                  {EXTERNAL_RIDESHARE_FALLBACK_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              {rideshareWarnings.map((warning) => (
                <div
                  key={warning.id}
                  className={
                    warning.id === "pediatric"
                      ? "rounded-md border border-warning/70 bg-warning/20 p-3 text-xs text-warning-foreground"
                      : "rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
                  }
                >
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {warning.title}
                  </div>
                  <div className="mt-1">{warning.message}</div>
                </div>
              ))}
              <Button size="sm" onClick={() => requestRideshare(ridesharePartner)}>
                Proceed with documented exception
              </Button>
            </div>
          )}
        </div>

        {recommendation && <AIDispatchCard recommendation={recommendation} compact />}
      </DialogContent>
    </Dialog>
  );
}

function rideMatchesSearch(ride: Ride, query: string, providerId: string, vehicleType: string) {
  const driver = drivers.find((item) => item.id === ride.driverId);
  const provider = providers.find((item) => item.id === ride.providerId);
  const vehicle = vehicles.find((item) => item.id === ride.vehicleId);
  const rider = riders.find((item) => item.id === ride.riderId);
  const normalized = query.trim().toLowerCase();
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
    (providerId === "all" || ride.providerId === providerId) &&
    (vehicleType === "all" || vehicle?.type === vehicleType)
  );
}

function Dispatch() {
  const { rides, role } = useStore();
  const { roles } = useAuth();
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [tourOpen, setTourOpen] = useState(false);
  const accessScope = getAccessScope(roles, role);
  const visibleRides = filterRidesForScope(accessScope, rides);
  const filteredRides = visibleRides.filter((ride) =>
    rideMatchesSearch(ride, query, providerFilter, vehicleTypeFilter),
  );
  const active = filteredRides.filter((r) =>
    ["en_route_pickup", "arrived_pickup", "in_transit"].includes(r.status),
  );
  const scheduled = filteredRides.filter((r) => r.status === "scheduled");
  const lateRisk = filteredRides.filter((r) => r.etaConfidence === "low");
  const vehicleTypes = Array.from(new Set(vehicles.map((vehicle) => vehicle.type))).sort();

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Ride board</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setTourOpen((value) => !value)}
                  >
                    <HelpCircle className="mr-1 h-4 w-4" /> Guide
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">
                  Open a quick tour for Fit Score, manual reassignment, overrides, and external
                  fallback flow.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tourOpen && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-medium">Guided dispatch workflow</div>
              <div className="mt-1 grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                <div>Search for a ride, driver, status, time, provider, or vehicle.</div>
                <div>Open a row and use manual reassignment before AI suggestions.</div>
                <div>Review Fit Score hard fails before assigning or overriding.</div>
                <div>Use external fallback only when specialty guardrails allow it.</div>
              </div>
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rides, drivers, IDs, status, or time"
                className="pl-9"
              />
            </div>
            <select
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All providers</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <select
              value={vehicleTypeFilter}
              onChange={(event) => setVehicleTypeFilter(event.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All vehicle types</option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filteredRides.length} of {visibleRides.length} rides
          </div>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({filteredRides.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
              <TabsTrigger value="late">Late risk ({lateRisk.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-2 mt-4">
              {filteredRides.map((r) => (
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
