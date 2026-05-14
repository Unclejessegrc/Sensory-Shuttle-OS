import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/audit")({
  component: () => (
    <RoleGate allow={["broker"]}>
      <Audit />
    </RoleGate>
  ),
});

function Audit() {
  const { auditLogs } = useStore();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit logs</h1>
        <p className="text-sm text-muted-foreground">Sensitive system activity.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground pb-2 border-b">
            <div className="col-span-2">Log ID</div>
            <div className="col-span-3">Timestamp</div>
            <div className="col-span-2">Actor</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-1">Entity</div>
            <div className="col-span-2">Details</div>
          </div>
          {auditLogs.map((l) => (
            <div key={l.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0">
              <div className="col-span-2 font-mono text-xs">{l.id}</div>
              <div className="col-span-3 text-xs text-muted-foreground">
                {new Date(l.ts).toLocaleString()}
              </div>
              <div className="col-span-2 text-xs">{l.actor}</div>
              <div className="col-span-2">
                <Badge variant="outline" className="text-[10px]">
                  {l.action}
                </Badge>
              </div>
              <div className="col-span-1 font-mono text-xs">{l.entityId}</div>
              <div className="col-span-2 text-xs text-muted-foreground">{l.details}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
