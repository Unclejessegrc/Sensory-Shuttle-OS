import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent } from "@/components/ui/card";
import { riders } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { filterRidersForScope, getAccessScope } from "@/lib/access-control";
import { DefinitionBadge } from "@/components/DefinitionBadge";

export const Route = createFileRoute("/app/riders")({
  component: () => (
    <RoleGate allow={["dispatcher", "broker", "provider"]}>
      <RidersList />
    </RoleGate>
  ),
});

function RidersList() {
  const { rides, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const visibleRiders = filterRidersForScope(accessScope, rides, riders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Riders</h1>
        <p className="text-sm text-muted-foreground">
          Care-aware rider profiles. Click each support note to see what it means.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {visibleRiders.map((r) => (
          <Card key={r.id} className="hover:border-primary transition-colors">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    to="/app/riders/$riderId"
                    params={{ riderId: r.id }}
                    className="font-medium hover:underline"
                  >
                    {r.name}
                  </Link>
                  <div className="text-xs text-muted-foreground capitalize">
                    {r.ageGroup} - {r.mobilityLevel}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                  {r.sensorySensitivity === "high" && (
                    <DefinitionBadge
                      term="High sensory"
                      className="bg-warning text-warning-foreground"
                    >
                      High sensory
                    </DefinitionBadge>
                  )}
                  {r.wheelchairRequired && <DefinitionBadge term="Wheelchair" />}
                  {r.boosterSeatRequired && <DefinitionBadge term="Booster" />}
                  {r.caregiverRequired && <DefinitionBadge term="Caregiver req." />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
