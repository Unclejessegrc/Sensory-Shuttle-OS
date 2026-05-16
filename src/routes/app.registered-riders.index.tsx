import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  canCreateRegisteredRider,
  canSeeSensitiveNetworkData,
  filterRegisteredRidersForScope,
  getAccessScope,
  linkedRiderIds,
} from "@/lib/access-control";
import { AlertTriangle, CalendarPlus, Eye, History, Pencil, Plus, Search } from "lucide-react";
import { RiderFlagList } from "@/components/RiderFlagList";
import { clickableSurface } from "@/components/ClickableSurface";

/**
 * Registered Rider Directory.
 * Source-of-truth list of pre-registered riders. Supports search + filter.
 * Field-level role visibility is enforced inside the profile page.
 */
export const Route = createFileRoute("/app/registered-riders/")({
  component: () => (
    <RoleGate allow={["admin", "dispatcher", "broker", "provider"]}>
      <Directory />
    </RoleGate>
  ),
});

function Directory() {
  const { registeredRiders, rides, incidents, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const scopedRegisteredRiders = filterRegisteredRidersForScope(
    accessScope,
    registeredRiders,
    rides,
  );
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);
  const canEdit = role === "broker_admin";
  const canCreateRider = canCreateRegisteredRider(role);
  const canBookRide = role === "broker_admin" || role === "dispatcher" || role === "system_admin";
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [age, setAge] = useState<string>("any");
  const [elig, setElig] = useState<string>("any");

  const rows = useMemo(() => {
    return scopedRegisteredRiders.filter((r) => {
      if (r.archived) return false;
      if (age !== "any" && r.ageGroup !== age) return false;
      if (elig !== "any" && r.eligibilityStatus !== elig) return false;
      if (!q.trim()) return true;
      const hay =
        `${r.firstName} ${r.lastName} ${r.id} ${r.fundingSource} ${r.primaryFacility}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [scopedRegisteredRiders, q, age, elig]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registered Riders</h1>
          <p className="text-sm text-muted-foreground">
            Source of truth for rider profiles. Drives dispatch, matching, and caregiver visibility.
          </p>
        </div>
        {canCreateRider && (
          <Link to="/app/registered-riders/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" /> New rider
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by name, ID, funding source, facility…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="Age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All ages</SelectItem>
                <SelectItem value="Pediatric">Pediatric</SelectItem>
                <SelectItem value="Adult">Adult</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
              </SelectContent>
            </Select>
            <Select value={elig} onValueChange={setElig}>
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="Eligibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All eligibility</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Needs Review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b">
                  <th className="text-left py-2 px-2">Rider</th>
                  <th className="text-left py-2 px-2">Age</th>
                  <th className="text-left py-2 px-2">
                    {canSeeSensitive ? "Funding" : "Coverage"}
                  </th>
                  <th className="text-left py-2 px-2">Eligibility</th>
                  <th className="text-left py-2 px-2">Mobility</th>
                  <th className="text-left py-2 px-2">Sensory</th>
                  <th className="text-left py-2 px-2">CG</th>
                  <th className="text-left py-2 px-2">Current / upcoming</th>
                  <th className="text-left py-2 px-2">Issues</th>
                  <th className="text-left py-2 px-2">Flags</th>
                  <th className="text-right py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const linkedIds = linkedRiderIds(r.id);
                  const riderRides = rides.filter((ride) => linkedIds.includes(ride.riderId));
                  const currentOrUpcoming =
                    riderRides.find((ride) =>
                      ["en_route_pickup", "arrived_pickup", "in_transit"].includes(ride.status),
                    ) ?? riderRides.find((ride) => ride.status === "scheduled");
                  const riderIncidents = incidents.filter((incident) =>
                    linkedIds.includes(incident.riderId),
                  );
                  const openIncidents = riderIncidents.filter(
                    (incident) => incident.status !== "resolved",
                  );

                  return (
                    <tr
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${r.firstName} ${r.lastName} profile`}
                      onClick={() =>
                        navigate({
                          to: "/app/registered-riders/$riderId",
                          params: { riderId: r.id },
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate({
                            to: "/app/registered-riders/$riderId",
                            params: { riderId: r.id },
                          });
                        }
                      }}
                      className={clickableSurface("border-b last:border-0")}
                      data-testid={`rider-row-${r.id}`}
                    >
                      <td className="py-2 px-2">
                        <div className="font-medium">
                          {r.firstName} {r.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">{r.id}</div>
                      </td>
                      <td className="py-2 px-2 text-xs">{r.ageGroup}</td>
                      <td className="py-2 px-2 text-xs">
                        {canSeeSensitive ? r.fundingSource : "On file"}
                      </td>
                      <td className="py-2 px-2">
                        <EligibilityBadge status={r.eligibilityStatus} />
                      </td>
                      <td className="py-2 px-2 text-xs">{r.mobilityNeeds.join(", ") || "-"}</td>
                      <td className="py-2 px-2 text-xs">
                        <div>{r.sensorySupport}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {[
                            r.quietRideRequired && "quiet",
                            r.noLoudMusic && "no music",
                            r.noStrongScents && "no scents",
                          ]
                            .filter(Boolean)
                            .join(" / ") || "standard"}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {r.caregiverRequired ? "Required" : "No"}
                      </td>
                      <td className="py-2 px-2 text-xs">
                        <div className="font-medium capitalize">
                          {currentOrUpcoming
                            ? currentOrUpcoming.status.replace(/_/g, " ")
                            : `${r.activeRidesCount} active`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {currentOrUpcoming
                            ? `${currentOrUpcoming.appointmentDate} ${currentOrUpcoming.appointmentTime}`
                            : r.lastRideDate
                              ? `Last ${r.lastRideDate}`
                              : "No rides"}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        <div className={openIncidents.length ? "font-medium text-destructive" : ""}>
                          {openIncidents.length} open
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {riderIncidents.length} total
                        </div>
                      </td>
                      <td className="py-2 px-2" onClick={(event) => event.stopPropagation()}>
                        <RiderFlagList rider={r} initialVisible={3} compact />
                      </td>
                      <td
                        className="py-2 px-2 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="inline-flex gap-1">
                          <Link
                            to="/app/registered-riders/$riderId"
                            params={{ riderId: r.id }}
                            search={{ edit: undefined }}
                            data-testid={`rider-view-${r.id}`}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              data-testid={`rider-view-btn-${r.id}`}
                              aria-label={`View ${r.firstName} ${r.lastName} profile`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {canBookRide && (
                            <Link
                              to="/app/book"
                              search={{ riderId: r.id, date: undefined }}
                              aria-label={`Book ride for ${r.firstName} ${r.lastName}`}
                            >
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <CalendarPlus className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                          <Link
                            to="/app/details/$topic"
                            params={{ topic: "rider-ride-history" }}
                            aria-label={`View ride history for ${r.firstName} ${r.lastName}`}
                          >
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <History className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link
                            to="/app/incidents"
                            aria-label={`View complaints and incidents for ${r.firstName} ${r.lastName}`}
                          >
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {canEdit && (
                            <Link
                              to="/app/registered-riders/$riderId"
                              params={{ riderId: r.id }}
                              search={{ edit: 1 }}
                              aria-label={`Edit ${r.firstName} ${r.lastName}`}
                            >
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-6 text-center text-sm text-muted-foreground">
                      No riders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EligibilityBadge({ status }: { status: string }) {
  const tone =
    status === "Active"
      ? "bg-success text-success-foreground"
      : status === "Pending"
        ? "bg-warning text-warning-foreground"
        : status === "Needs Review"
          ? "bg-destructive text-destructive-foreground"
          : "bg-muted text-muted-foreground";
  return <Badge className={`text-[10px] ${tone}`}>{status}</Badge>;
}
