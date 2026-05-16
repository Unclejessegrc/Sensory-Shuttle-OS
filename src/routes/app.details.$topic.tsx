import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { drivers, providers, riders } from "@/lib/mock-data";
import { ArrowLeft, FileSearch } from "lucide-react";

export const Route = createFileRoute("/app/details/$topic")({
  component: () => (
    <RoleGate
      allow={[
        "admin",
        "broker",
        "provider",
        "dispatcher",
        "driver",
        "caregiver",
        "facility_viewer",
      ]}
    >
      <DetailPlaceholder />
    </RoleGate>
  ),
});

const TOPIC_COPY: Record<string, { title: string; description: string; backTo: string }> = {
  "speed-flags": {
    title: "Speed flags",
    description:
      "Production would show driver speed events, posted limit, GPS proof, provider acknowledgement, and corrective action status.",
    backTo: "/app/broker",
  },
  "stale-gps": {
    title: "Stale GPS exceptions",
    description:
      "Production would show stale pings, device source, driver app lock state, active rides affected, and escalation owner.",
    backTo: "/app/dispatch",
  },
  "facility-arrivals": {
    title: "Facility arrival detail",
    description:
      "Production would show appointment arrivals, expected arrival windows, late alerts, and read-only care-team status notes.",
    backTo: "/app/facility",
  },
  "caregiver-ride": {
    title: "Caregiver ride detail",
    description:
      "Production would show driver ETA history, safe handoff notes, return ride options, and issue reporting context.",
    backTo: "/app/caregiver",
  },
  "driver-support": {
    title: "Driver support details",
    description:
      "Production would show assigned route context, support-note acknowledgements, checklist evidence, and incident shortcuts.",
    backTo: "/app/driver",
  },
  "provider-roster": {
    title: "Provider roster detail",
    description:
      "Production would show provider drivers, vehicles, documents, ride history, and accountability events in one drilldown.",
    backTo: "/app/providers",
  },
};

function DetailPlaceholder() {
  const { topic } = Route.useParams();
  const { rides, incidents, auditLogs } = useStore();
  const copy =
    TOPIC_COPY[topic] ??
    ({
      title: topic
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      description:
        "Production would show a focused filtered list, evidence, ownership, and next actions for this operational surface.",
      backTo: "/app/dashboard",
    } as const);

  const rows = [
    ...rides.slice(0, 3).map((ride) => ({
      id: ride.id,
      label: `${ride.appointmentTime} - ${ride.status.replace(/_/g, " ")}`,
      detail: `${ride.pickupAddress} to ${ride.dropoffAddress}`,
    })),
    ...incidents.slice(0, 2).map((incident) => ({
      id: incident.id,
      label: `${incident.issueType} - ${incident.status}`,
      detail: incident.reporterStatement,
    })),
    ...auditLogs.slice(0, 2).map((log) => ({
      id: log.id,
      label: log.action,
      detail: log.details,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Placeholder drilldown
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <BackLink to={copy.backTo} />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Summary label="Matching rides" value={rides.length} />
        <Summary
          label="Open incidents"
          value={incidents.filter((i) => i.status !== "resolved").length}
        />
        <Summary label="Audit events" value={auditLogs.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4 text-primary" />
            Mock production records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-md border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{row.id}</div>
                <Badge variant="outline">Demo record</Badge>
              </div>
              <div className="mt-1 text-sm">{row.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{row.detail}</div>
            </div>
          ))}
          <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
            This placeholder is intentionally role-safe and mock-data-only. It prevents dead ends
            while showing buyers where the filtered detail view would live in production.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function BackLink({ to }: { to: string }) {
  const content = (
    <>
      <ArrowLeft className="mr-1 h-4 w-4" />
      Back
    </>
  );

  if (to === "/app/broker") return <Link to="/app/broker">{content}</Link>;
  if (to === "/app/dispatch") return <Link to="/app/dispatch">{content}</Link>;
  if (to === "/app/facility") return <Link to="/app/facility">{content}</Link>;
  if (to === "/app/caregiver") return <Link to="/app/caregiver">{content}</Link>;
  if (to === "/app/driver") return <Link to="/app/driver">{content}</Link>;
  if (to === "/app/providers") return <Link to="/app/providers">{content}</Link>;
  return <Link to="/app/dashboard">{content}</Link>;
}
