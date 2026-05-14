import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useEffect, useState } from "react";
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
import { ISSUE_TYPES, drivers, providers, riders } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import {
  canSeeSensitiveNetworkData,
  filterIncidentsForScope,
  filterRidesForScope,
  getAccessScope,
} from "@/lib/access-control";
import { toast } from "sonner";
import { Printer, FileText } from "lucide-react";

export const Route = createFileRoute("/app/incidents")({
  component: () => (
    <RoleGate allow={["dispatcher", "provider", "broker"]}>
      <Incidents />
    </RoleGate>
  ),
});

function Incidents() {
  const { incidents, addIncident, addAudit, rides, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const visibleRides = filterRidesForScope(accessScope, rides);
  const visibleIncidents = filterIncidentsForScope(accessScope, incidents);
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);
  const [rideId, setRideId] = useState(visibleRides[0]?.id ?? "");
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [statement, setStatement] = useState("");

  useEffect(() => {
    if (!visibleRides.length) return;
    if (!visibleRides.some((ride) => ride.id === rideId)) setRideId(visibleRides[0].id);
  }, [rideId, visibleRides]);

  const file = (e: React.FormEvent) => {
    e.preventDefault();
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
      reporterStatement: statement,
      status: "open",
      filedAt: new Date().toISOString(),
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "user@demo",
      action: "incident.filed",
      entityId: id,
      details: issueType,
    });
    toast.success(`Incident ${id} filed`);
    setStatement("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground">
            File issues and generate evidence packets.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>File new incident</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File incident</DialogTitle>
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
                <Label>Reporter statement</Label>
                <Textarea
                  required
                  rows={4}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {visibleIncidents.map((i) => {
          const rider = riders.find((r) => r.id === i.riderId);
          const driver = drivers.find((d) => d.id === i.driverId);
          const provider = providers.find((p) => p.id === i.providerId);
          return (
            <Card key={i.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{i.id}</span>
                      <Badge variant="outline">{i.issueType}</Badge>
                      <Badge
                        className={
                          i.status === "open"
                            ? "bg-destructive text-destructive-foreground"
                            : i.status === "investigating"
                              ? "bg-warning text-warning-foreground"
                              : "bg-success text-success-foreground"
                        }
                      >
                        {i.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ride {i.rideId} ·{" "}
                      {canSeeSensitive ? (rider?.name ?? "Rider") : "Rider on file"} · Driver{" "}
                      {driver?.name ?? "—"} · {provider?.name}
                    </div>
                    <p className="text-sm mt-2">{i.reporterStatement}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`evidence-packet-btn-${i.id}`}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Evidence packet
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className="max-w-2xl"
                      data-testid={`evidence-packet-dialog-${i.id}`}
                    >
                      <DialogHeader>
                        <DialogTitle>Evidence Packet — {i.id}</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm space-y-2">
                        <div>
                          <b>Ride:</b> {i.rideId}
                        </div>
                        <div>
                          <b>Rider:</b>{" "}
                          {canSeeSensitive ? (rider?.name ?? "Rider") : "Rider on file"}
                        </div>
                        <div>
                          <b>Driver:</b> {driver?.name ?? "—"}
                        </div>
                        <div>
                          <b>Provider:</b> {provider?.name}
                        </div>
                        <div>
                          <b>Filed at:</b> {new Date(i.filedAt).toLocaleString()}
                        </div>
                        <div>
                          <b>Required accommodations:</b>{" "}
                          {[
                            rider?.wheelchairRequired && "Wheelchair",
                            rider?.boosterSeatRequired && "Booster",
                            rider?.needsQuietRide && "Quiet ride",
                            rider?.noStrongScents && "No scents",
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </div>
                        <div>
                          <b>Driver confirmations:</b> Pre-trip checklist completed (mock)
                        </div>
                        <div>
                          <b>ETA confidence timeline:</b> high → medium → low (mock)
                        </div>
                        <div>
                          <b>Reporter statement:</b>{" "}
                          {canSeeSensitive ? i.reporterStatement : "Stored for broker review"}
                        </div>
                        <div>
                          <b>GPS ping log:</b> [placeholder — connect to gps_pings table]
                        </div>
                        <div>
                          <b>Photo evidence:</b> [placeholder upload]
                        </div>
                        <div className="rounded border p-2 bg-accent/30">
                          <b>Recommended next action:</b> Open formal review with provider; suspend
                          driver pending sensory training audit.
                        </div>
                        <Button onClick={() => window.print()} className="w-full">
                          <Printer className="h-4 w-4 mr-1" />
                          Print evidence packet
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
