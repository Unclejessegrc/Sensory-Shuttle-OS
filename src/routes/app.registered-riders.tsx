import { createFileRoute, Link } from "@tanstack/react-router";
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
  canSeeSensitiveNetworkData,
  filterRegisteredRidersForScope,
  getAccessScope,
} from "@/lib/access-control";
import { Plus, Search, Eye, Pencil, ShieldAlert } from "lucide-react";
import { DefinitionBadge } from "@/components/DefinitionBadge";

/**
 * Registered Rider Directory.
 * Source-of-truth list of pre-registered riders. Supports search + filter.
 * Field-level role visibility is enforced inside the profile page.
 */
export const Route = createFileRoute("/app/registered-riders")({
  component: () => (
    <RoleGate allow={["dispatcher", "broker", "provider"]}>
      <Directory />
    </RoleGate>
  ),
});

function Directory() {
  const { registeredRiders, rides, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const scopedRegisteredRiders = filterRegisteredRidersForScope(
    accessScope,
    registeredRiders,
    rides,
  );
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);
  const canEdit = role === "broker_admin";
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
        {canEdit && (
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
                  <th className="text-left py-2 px-2">Active</th>
                  <th className="text-left py-2 px-2">Last ride</th>
                  <th className="text-left py-2 px-2">Flags</th>
                  <th className="text-right py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-accent/30">
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
                    <td className="py-2 px-2 text-xs">{r.mobilityNeeds[0] ?? "—"}</td>
                    <td className="py-2 px-2 text-xs">{r.sensorySupport}</td>
                    <td className="py-2 px-2 text-xs">{r.caregiverRequired ? "Yes" : "No"}</td>
                    <td className="py-2 px-2 text-xs tabular-nums">{r.activeRidesCount}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {r.lastRideDate || "—"}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {r.riskFlags.map((f) => (
                          <DefinitionBadge
                            key={f}
                            term={f}
                            className="text-[10px] gap-0.5 bg-warning text-warning-foreground"
                          >
                            <ShieldAlert className="h-3 w-3" /> {f}
                          </DefinitionBadge>
                        ))}
                        {r.riskFlags.length === 0 && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="inline-flex gap-1">
                        <Link
                          to="/app/registered-riders/$riderId"
                          params={{ riderId: r.id }}
                          search={{ edit: undefined }}
                        >
                          <Button size="sm" variant="ghost" className="h-7 px-2">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Link
                            to="/app/registered-riders/$riderId"
                            params={{ riderId: r.id }}
                            search={{ edit: 1 }}
                          >
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
