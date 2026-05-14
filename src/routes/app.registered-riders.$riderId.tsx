import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  canAccessRegisteredRider,
  canSeeSensitiveNetworkData,
  getAccessScope,
} from "@/lib/access-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ELIGIBILITY_OPTIONS } from "@/lib/registered-riders";
import { drivers } from "@/lib/mock-data";
import { ChevronLeft, ShieldAlert, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { DefinitionBadge } from "@/components/DefinitionBadge";

/**
 * Registered Rider profile detail. Field-level visibility honors role:
 *  - driver: only safe-transport instructions
 *  - caregiver: their own rider summary + ride history
 *  - dispatcher: operational fields
 *  - provider: assigned-rider operational view
 *  - broker / admin: full edit
 *  - facility_viewer: nothing here (gated upstream)
 */
export const Route = createFileRoute("/app/registered-riders/$riderId")({
  validateSearch: (s: Record<string, unknown>) => ({ edit: s.edit ? 1 : undefined }),
  component: () => (
    <RoleGate allow={["dispatcher", "broker", "provider"]}>
      <Profile />
    </RoleGate>
  ),
  notFoundComponent: () => <div>Rider not found.</div>,
});

function Profile() {
  const { riderId } = Route.useParams();
  const search = Route.useSearch();
  const { registeredRiders, rides, incidents, updateRegisteredRider, role } = useStore();
  const { user, roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const rider = registeredRiders.find((r) => r.id === riderId);
  if (!rider) throw notFound();

  const canEdit = role === "broker_admin";
  const canSeeSensitive = canSeeSensitiveNetworkData(accessScope);

  const [editing, setEditing] = useState(!!search.edit && canEdit);
  const [draft, setDraft] = useState(rider);

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id;

  const riderRides = useMemo(
    () =>
      rides.filter(
        (r) =>
          // Match by composite — book-page-created rides reference legacy rider ids OR registered ids
          r.riderId === rider.id || r.riderId === rider.id.toLowerCase().replace("rr-", "r"),
      ),
    [rides, rider.id],
  );
  const riderIncidents = incidents.filter(
    (i) => i.riderId === rider.id || i.riderId === rider.id.toLowerCase().replace("rr-", "r"),
  );

  if (!canAccessRegisteredRider(accessScope, rider.id, rides)) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          This rider profile is outside your locked access scope.
        </CardContent>
      </Card>
    );
  }

  const save = () => {
    // Build a small audit summary from changed top-level fields
    const changedKeys = (Object.keys(draft) as (keyof typeof draft)[]).filter(
      (k) => JSON.stringify(draft[k]) !== JSON.stringify(rider[k]),
    );
    if (changedKeys.length === 0) {
      setEditing(false);
      return;
    }
    const summary =
      changedKeys.slice(0, 3).join(", ") +
      (changedKeys.length > 3 ? `, +${changedKeys.length - 3} more` : "");
    updateRegisteredRider(rider.id, draft, {
      actor: user?.email ?? "admin@network-demo",
      role: "broker_admin",
      action: "profile_edited",
      field: summary,
      oldValue: "(see audit)",
      newValue: "(updated)",
    });
    toast.success("Rider profile updated");
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <Link
        to="/app/registered-riders"
        className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Registered riders
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{rider.id}</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {rider.firstName} {rider.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rider.ageGroup} · {rider.fundingSource} ·{" "}
            {rider.primaryFacility || "No primary facility"}
          </p>
        </div>
        <div className="flex gap-2">
          {(role === "dispatcher" || role === "broker_admin") && (
            <Link to="/app/book" search={{ date: undefined }}>
              <Button>Book ride</Button>
            </Link>
          )}
          {canEdit && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          )}
          {editing && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(rider);
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              <Button onClick={save}>
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Risk flags */}
      {rider.riskFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rider.riskFlags.map((f) => (
            <DefinitionBadge key={f} term={f} className="bg-warning text-warning-foreground gap-1">
              <ShieldAlert className="h-3 w-3" /> {f}
            </DefinitionBadge>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity & eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {canSeeSensitive && <KV label="Date of birth" v={rider.dob} />}
            <KV label="Primary language" v={rider.primaryLanguage} />
            {canSeeSensitive && <KV label="Funding source" v={rider.fundingSource} />}
            {canSeeSensitive && <KV label="Member ID" v={rider.memberId} />}
            {canSeeSensitive && <KV label="Plan / MCO" v={rider.planOrMco} />}
            {editing ? (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Eligibility status
                </div>
                <Select
                  value={draft.eligibilityStatus}
                  onValueChange={(v) =>
                    setDraft({ ...draft, eligibilityStatus: v as typeof draft.eligibilityStatus })
                  }
                >
                  <SelectTrigger className="h-8 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ELIGIBILITY_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <KV label="Eligibility" v={rider.eligibilityStatus} />
            )}
            <KV
              label="Authorization"
              v={
                rider.authorizationRequired
                  ? `Required, expires ${rider.authorizationExpires || "—"}`
                  : "Not required"
              }
            />
            <KV label="Trip limits" v={rider.tripLimitsNotes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {canSeeSensitive ? "Caregiver contacts" : "Caregiver requirements"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {canSeeSensitive && <KV label="Emergency contact" v={rider.emergencyContact} />}
            {canSeeSensitive && <KV label="Caregiver / guardian" v={rider.caregiverContact} />}
            <KV label="Caregiver required" v={rider.caregiverRequired ? "Yes" : "No"} />
            <KV
              label="Caregiver seat"
              v={rider.caregiverSeatRequired ? "Required" : "Not required"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mobility needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-1">
              {rider.mobilityNeeds.map((m) => (
                <DefinitionBadge key={m} term={m} />
              ))}
            </div>
            <KV label="Vehicle type" v={rider.vehicleTypeRequired} />
            <KV label="Loading time" v={`${rider.loadingTimeMinutes} min`} />
            <KV label="Boarding notes" v={rider.boardingAssistanceNotes} />
            <KV label="Service animal" v={rider.serviceAnimal ? "Yes" : "No"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sensory support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <KV label="Level" v={rider.sensorySupport} />
            <KV label="Quiet ride" v={rider.quietRideRequired ? "Yes" : "No"} />
            <KV label="No loud music" v={rider.noLoudMusic ? "Yes" : "No"} />
            <KV label="No strong scents" v={rider.noStrongScents ? "Yes" : "No"} />
            <KV label="Low conversation" v={rider.lowConversationPreferred ? "Yes" : "No"} />
            <KV
              label="Predictable communication"
              v={rider.predictableCommunicationRequired ? "Yes" : "No"}
            />
            <KV label="Extra patience" v={rider.extraPickupPatienceRequired ? "Yes" : "No"} />
            <KV label="Motion sickness" v={rider.motionSicknessRisk ? "Yes" : "No"} />
            <KV label="Triggers" v={rider.knownTriggers.join(", ") || "—"} />
            <KV label="Calming strategies" v={rider.calmingStrategies} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Driver instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {editing ? (
              <>
                <Textarea
                  rows={2}
                  value={draft.driverInstructions}
                  onChange={(e) => setDraft({ ...draft, driverInstructions: e.target.value })}
                />
                <Textarea
                  rows={2}
                  value={draft.notesForDriver}
                  onChange={(e) => setDraft({ ...draft, notesForDriver: e.target.value })}
                  placeholder="Notes for driver"
                />
              </>
            ) : (
              <>
                <p>{rider.driverInstructions}</p>
                <p className="text-muted-foreground">
                  <b>Notes for driver:</b> {rider.notesForDriver}
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              <b>De-escalation:</b> {rider.deEscalationNotes || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matching rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <KV
              label="Preferred drivers"
              v={rider.preferredDrivers.map(driverName).join(", ") || "—"}
            />
            <KV
              label="Blocked drivers"
              v={
                rider.blockedDrivers.length ? (
                  <span className="text-destructive">
                    {rider.blockedDrivers.map(driverName).join(", ")}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <KV
              label="Required certifications"
              v={rider.requiredDriverCertifications.join(", ") || "—"}
            />
            <KV
              label="Required vehicle features"
              v={rider.requiredVehicleFeatures.join(", ") || "—"}
            />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Hard fail rules
              </div>
              <ul className="list-disc pl-5 mt-1 text-sm">
                {rider.hardFailRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
                {rider.hardFailRules.length === 0 && (
                  <li className="text-muted-foreground list-none">None</li>
                )}
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Soft preferences
              </div>
              <ul className="list-disc pl-5 mt-1 text-sm">
                {rider.softPreferenceRules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
                {rider.softPreferenceRules.length === 0 && (
                  <li className="text-muted-foreground list-none">None</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Common ride locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <KV label="Home" v={rider.homePickupAddress} />
            <KV label="Alternate" v={rider.alternatePickupAddress || "—"} />
            <KV label="Primary facility" v={rider.primaryFacility} />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Common destinations
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {rider.commonDestinations.map((d) => (
                  <Badge key={d} variant="outline">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
            <KV label="Appointments" v={rider.appointmentTypePreferences.join(", ") || "—"} />
            <KV
              label="Return ride usually needed"
              v={rider.returnRideUsuallyNeeded ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        {canSeeSensitive && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Admin-only notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {editing ? (
                <Textarea
                  rows={3}
                  value={draft.adminOnlyNotes}
                  onChange={(e) => setDraft({ ...draft, adminOnlyNotes: e.target.value })}
                />
              ) : (
                <p className="text-muted-foreground">{rider.adminOnlyNotes || "—"}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">Hidden from driver view.</p>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ride history</CardTitle>
          </CardHeader>
          <CardContent>
            {riderRides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rides yet.</p>
            ) : (
              <div className="space-y-2">
                {riderRides.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between text-sm border-b last:border-0 py-1.5"
                  >
                    <div>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{r.id}</span>
                      {r.appointmentType} → {r.dropoffAddress}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.appointmentDate} {r.appointmentTime} · {r.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident history</CardTitle>
          </CardHeader>
          <CardContent>
            {riderIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents on file.</p>
            ) : (
              riderIncidents.map((i) => (
                <div key={i.id} className="border-b last:border-0 py-2">
                  <div className="text-sm font-medium">{i.issueType}</div>
                  <div className="text-xs text-muted-foreground">
                    {canSeeSensitive
                      ? i.reporterStatement
                      : "Statement restricted to broker review"}
                  </div>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {i.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {canSeeSensitive && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit history</CardTitle>
            </CardHeader>
            <CardContent>
              {rider.audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit entries.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {rider.audit.slice(0, 10).map((a) => (
                    <li key={a.id} className="border-b last:border-0 pb-2">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {new Date(a.ts).toLocaleString()}
                      </div>
                      <div>
                        <b>{a.action}</b> · {a.field}
                      </div>
                      <div className="text-muted-foreground">
                        {a.actor} ({a.role})
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function KV({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div>{v || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
