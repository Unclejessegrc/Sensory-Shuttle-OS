import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import {
  ISSUE_TYPES,
  drivers,
  providers,
  riders,
  type Incident,
  type IncidentPriority,
  type Ride,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import {
  canFileNewIssue,
  canGenerateNewIssuePacket,
  canOpenEvidencePacket,
  canSeeSensitiveNetworkData,
  canViewPastIncidentDetails,
  canViewRestrictedIncidentMetadata,
  filterIncidentsForScope,
  filterRidesForScope,
  getAccessScope,
  linkedRiderIds,
} from "@/lib/access-control";
import { toast } from "sonner";
import { FileText, Printer } from "lucide-react";
import { clickableSurface } from "@/components/ClickableSurface";

export const Route = createFileRoute("/app/incidents")({
  component: () => (
    <RoleGate allow={["admin", "dispatcher", "provider", "broker"]}>
      <Incidents />
    </RoleGate>
  ),
});

const INCIDENT_PRIORITIES: IncidentPriority[] = [
  "Low",
  "Standard",
  "High",
  "Urgent Safety Review",
  "Missed Appointment Risk",
  "Accommodation Failure Review",
];

const RESTRICTED_COPY =
  "Access is limited by role to protect rider privacy and investigation integrity. Booking Agents may view case number, involved provider, involved driver, and status only. Full incident details are available only to Health Plan / Payer Administrators and Transportation Broker Administrators.";

function Incidents() {
  const { incidents, addIncident, addAudit, rides, registeredRiders, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const visibleRides = filterRidesForScope(accessScope, rides);
  const visibleIncidents = filterIncidentsForScope(accessScope, incidents);
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);
  const canViewDetails = canViewPastIncidentDetails(role);
  const canViewRestricted = canViewRestrictedIncidentMetadata(role);
  const canFile = canFileNewIssue(role);
  const isBookingAgent = role === "dispatcher";
  const metadataAuditLogged = useRef(false);

  const [rideId, setRideId] = useState(visibleRides[0]?.id ?? "");
  const [riderId, setRiderId] = useState(visibleRides[0]?.riderId ?? "");
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [priority, setPriority] = useState<IncidentPriority>("Standard");
  const [statement, setStatement] = useState("");
  const [attachmentPlaceholder, setAttachmentPlaceholder] = useState("");
  const [currentSessionCreatedIncidentId, setCurrentSessionCreatedIncidentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!visibleRides.length) return;
    if (!visibleRides.some((ride) => ride.id === rideId)) setRideId(visibleRides[0].id);
  }, [rideId, visibleRides]);

  useEffect(() => {
    const ride = visibleRides.find((item) => item.id === rideId);
    if (ride) setRiderId(ride.riderId);
  }, [rideId, visibleRides]);

  useEffect(() => {
    if (metadataAuditLogged.current) return;
    if (canViewDetails || !canViewRestricted || visibleIncidents.length === 0) return;
    metadataAuditLogged.current = true;
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: `${role}@demo`,
      action: "incident.restricted_metadata_viewed",
      entityId: "incidents",
      details: `${visibleIncidents.length} restricted incident metadata row(s) viewed`,
    });
  }, [addAudit, canViewDetails, canViewRestricted, role, visibleIncidents.length]);

  const riderOptions = Array.from(new Set(visibleRides.map((ride) => ride.riderId)));
  const restrictedIncidents = visibleIncidents.filter(
    (incident) => !canViewDetails && incident.id !== currentSessionCreatedIncidentId,
  );
  const detailedIncidents = visibleIncidents.filter(
    (incident) => canViewDetails || incident.id === currentSessionCreatedIncidentId,
  );

  const riderName = (id: string) => {
    const registered = registeredRiders.find((item) => linkedRiderIds(item.id).includes(id));
    if (registered) return `${registered.firstName} ${registered.lastName}`;
    return riders.find((item) => item.id === id)?.name ?? id;
  };

  const file = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canFile) return toast.error("This role cannot file new issues.");
    const ride = visibleRides.find((r) => r.id === rideId);
    if (!ride) return;
    const id = `INC-${600 + Math.floor(Math.random() * 400)}`;
    addIncident({
      id,
      rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      providerId: ride.providerId,
      issueType,
      priority,
      reporterStatement: statement,
      status: "open",
      filedAt: new Date().toISOString(),
    });
    setCurrentSessionCreatedIncidentId(id);
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: `${role}@demo`,
      action: "incident.filed",
      entityId: id,
      details: `${issueType} | priority ${priority}`,
    });
    if (!["Low", "Standard"].includes(priority)) {
      addAudit({
        id: `L-${Date.now()}-E`,
        ts: new Date().toISOString(),
        actor: `${role}@demo`,
        action: "incident.escalated",
        entityId: id,
        details: `Priority selected: ${priority}`,
      });
    }
    toast.success(`${isBookingAgent ? "Issue" : "Incident"} ${id} filed`);
    setStatement("");
    setAttachmentPlaceholder("");
    setPriority("Standard");
  };

  const chooseRider = (value: string) => {
    setRiderId(value);
    const ride = visibleRides.find((item) => linkedRiderIds(value).includes(item.riderId));
    if (ride) setRideId(ride.id);
  };

  const logRestrictedAttempt = (incident: Incident) => {
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: `${role}@demo`,
      action: "incident.restricted_access_attempted",
      entityId: incident.id,
      details: "Restricted historical incident detail opened as metadata-only message",
    });
  };

  const logPacketGenerated = (incident: Incident) => {
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: `${role}@demo`,
      action: "incident.evidence_packet_generated",
      entityId: incident.id,
      details:
        incident.id === currentSessionCreatedIncidentId
          ? "Evidence packet generated for newly filed issue"
          : "Evidence packet opened by full-access role",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground">
            File issues and generate evidence packets with role-based incident privacy.
          </p>
        </div>
        {canFile && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>{isBookingAgent ? "File New Issue" : "File new incident"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isBookingAgent ? "File New Issue" : "File incident"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={file} className="space-y-3">
                <div>
                  <Label>Ride ID</Label>
                  <Select value={rideId} onValueChange={setRideId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleRides.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rider</Label>
                  <Select value={riderId} onValueChange={chooseRider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {riderOptions.map((id) => (
                        <SelectItem key={id} value={id}>
                          {riderName(id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Issue type</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as IncidentPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_PRIORITIES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Statement</Label>
                  <Textarea
                    required
                    rows={4}
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Attachment placeholder</Label>
                  <Input
                    value={attachmentPlaceholder}
                    onChange={(event) => setAttachmentPlaceholder(event.target.value)}
                    placeholder="Mock attachment name or note"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canViewDetails && restrictedIncidents.length > 0 && (
        <RestrictedIncidentHistory
          incidents={restrictedIncidents}
          onAttempt={logRestrictedAttempt}
        />
      )}

      <div className="grid gap-3">
        {detailedIncidents.map((incident) => {
          const rider = riders.find((r) => r.id === incident.riderId);
          const driver = drivers.find((d) => d.id === incident.driverId);
          const provider = providers.find((p) => p.id === incident.providerId);
          const ride = rides.find((item) => item.id === incident.rideId);
          const isCurrentSessionIssue = incident.id === currentSessionCreatedIncidentId;
          const packetAllowed = canOpenEvidencePacket(
            role,
            incident,
            currentSessionCreatedIncidentId,
          );
          return (
            <Card key={incident.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <Link
                    to="/app/details/$topic"
                    params={{ topic: "incident-evidence" }}
                    aria-label={`Open incident detail for ${incident.id}`}
                    className={clickableSurface(
                      "block flex-1 rounded-md border border-transparent p-2",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{incident.id}</span>
                      <Badge variant="outline">{incident.issueType}</Badge>
                      <Badge variant="outline">{incident.priority ?? "Standard"}</Badge>
                      <StatusBadge status={incident.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ride {incident.rideId} ·{" "}
                      {canSeeSensitive || isCurrentSessionIssue
                        ? (rider?.name ?? riderName(incident.riderId))
                        : "Rider on file"}{" "}
                      · Driver {driver?.name ?? "-"} · {provider?.name}
                    </div>
                    <p className="text-sm mt-2">
                      {canViewDetails || isCurrentSessionIssue
                        ? incident.reporterStatement
                        : "Past Incident Details Restricted"}
                    </p>
                  </Link>
                  {packetAllowed && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => logPacketGenerated(incident)}
                          data-testid={`evidence-packet-btn-${incident.id}`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Evidence packet
                        </Button>
                      </DialogTrigger>
                      <EvidencePacket
                        incident={incident}
                        ride={ride}
                        riderName={rider?.name ?? riderName(incident.riderId)}
                        driverName={driver?.name ?? "-"}
                        providerName={provider?.name ?? "Provider on file"}
                        limitedToNewIssue={!canViewDetails}
                      />
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RestrictedIncidentHistory({
  incidents,
  onAttempt,
}: {
  incidents: Incident[];
  onAttempt: (incident: Incident) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Restricted Incident History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
          <div className="font-semibold text-warning-foreground">
            Past Incident Details Restricted
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{RESTRICTED_COPY}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 text-left">Case #</th>
                <th className="py-2 pr-3 text-left">Date Reported</th>
                <th className="py-2 pr-3 text-left">Status</th>
                <th className="py-2 pr-3 text-left">Provider / Company</th>
                <th className="py-2 pr-3 text-left">Driver</th>
                <th className="py-2 pr-3 text-left">Ride ID</th>
                <th className="py-2 pr-3 text-left">Access Level</th>
                <th className="py-2 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => {
                const driver = drivers.find((d) => d.id === incident.driverId);
                const provider = providers.find((p) => p.id === incident.providerId);
                return (
                  <tr key={incident.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{incident.id}</td>
                    <td className="py-2 pr-3 text-xs">
                      {new Date(incident.filedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="py-2 pr-3 text-xs">{provider?.name ?? "Provider on file"}</td>
                    <td className="py-2 pr-3 text-xs">{driver?.name ?? "Driver on file"}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{incident.rideId}</td>
                    <td className="py-2 pr-3 text-xs">Restricted Metadata Only</td>
                    <td className="py-2 text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => onAttempt(incident)}>
                            Restricted
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Past Incident Details Restricted</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">{RESTRICTED_COPY}</p>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidencePacket({
  incident,
  ride,
  riderName,
  driverName,
  providerName,
  limitedToNewIssue,
}: {
  incident: Incident;
  ride?: Ride;
  riderName: string;
  driverName: string;
  providerName: string;
  limitedToNewIssue: boolean;
}) {
  const rider = riders.find((item) => item.id === incident.riderId);
  return (
    <DialogContent className="max-w-2xl" data-testid={`evidence-packet-dialog-${incident.id}`}>
      <DialogHeader>
        <DialogTitle>Evidence Packet — {incident.id}</DialogTitle>
      </DialogHeader>
      <div className="text-sm space-y-2">
        {limitedToNewIssue && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-warning-foreground">
            Booking Agent Evidence Packet: generated for this newly filed issue only. Historical
            incident details are restricted.
          </div>
        )}
        <div>
          <b>Ride:</b> {incident.rideId}
        </div>
        <div>
          <b>Rider:</b> {riderName} ({incident.riderId})
        </div>
        <div>
          <b>Issue type:</b> {incident.issueType}
        </div>
        <div>
          <b>Priority:</b> {incident.priority ?? "Standard"}
        </div>
        <div>
          <b>Driver:</b> {driverName}
        </div>
        <div>
          <b>Provider:</b> {providerName}
        </div>
        <div>
          <b>Filed at:</b> {new Date(incident.filedAt).toLocaleString()}
        </div>
        {ride && (
          <div>
            <b>Ride details:</b> {ride.pickupAddress} to {ride.dropoffAddress} at{" "}
            {ride.appointmentTime}
          </div>
        )}
        <div>
          <b>Required accommodations:</b>{" "}
          {[
            rider?.wheelchairRequired && "Wheelchair",
            rider?.boosterSeatRequired && "Booster",
            rider?.needsQuietRide && "Quiet ride",
            rider?.noStrongScents && "No scents",
          ]
            .filter(Boolean)
            .join(", ") || "-"}
        </div>
        <div>
          <b>ETA confidence timeline:</b> {ride?.etaReasons.join(" · ") || "Mock timeline pending"}
        </div>
        <div>
          <b>Reporter statement:</b> {incident.reporterStatement}
        </div>
        <div>
          <b>Audit trail:</b> Incident filed, priority recorded, evidence packet generated (mock)
        </div>
        {!limitedToNewIssue && (
          <>
            <div>
              <b>GPS ping log:</b> [placeholder — connect to gps_pings table]
            </div>
            <div>
              <b>Photo evidence:</b> [placeholder upload]
            </div>
            <div className="rounded border p-2 bg-accent/30">
              <b>Recommended next action:</b> Open formal review with provider; suspend driver
              pending sensory training audit.
            </div>
          </>
        )}
        <Button onClick={() => window.print()} className="w-full">
          <Printer className="h-4 w-4 mr-1" />
          Print evidence packet
        </Button>
      </div>
    </DialogContent>
  );
}

function StatusBadge({ status }: { status: Incident["status"] }) {
  if (status === "open")
    return <Badge className="bg-destructive text-destructive-foreground">Open</Badge>;
  if (status === "investigating")
    return <Badge className="bg-warning text-warning-foreground">Under Review</Badge>;
  return <Badge className="bg-success text-success-foreground">Resolved</Badge>;
}
