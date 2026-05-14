import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGE_OPTIONS,
  CERT_OPTIONS,
  ELIGIBILITY_OPTIONS,
  FUNDING_OPTIONS,
  MOBILITY_OPTIONS,
  SENSORY_OPTIONS,
  VEHICLE_FEATURES,
  type RegisteredRider,
} from "@/lib/registered-riders";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

/**
 * New Rider Intake Form. Broker / system admin only — captures the registered
 * rider profile that becomes the source of truth for ride booking + matching.
 */
export const Route = createFileRoute("/app/registered-riders/new")({
  component: () => (
    <RoleGate allow={["broker"]}>
      <Intake />
    </RoleGate>
  ),
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function MultiToggle({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: readonly string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Intake() {
  const { addRegisteredRider, registeredRiders } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Lightweight state object initialised with sane defaults. Mock-only.
  const [r, setR] = useState<RegisteredRider>(() => ({
    id: `RR-${1100 + registeredRiders.length}`,
    firstName: "",
    lastName: "",
    dob: "",
    ageGroup: "Adult",
    primaryLanguage: "English",
    preferredCommunication: "",
    emergencyContact: "",
    caregiverContact: "",
    fundingSource: "Medicaid",
    memberId: "",
    planOrMco: "",
    eligibilityStatus: "Pending",
    authorizationRequired: false,
    authorizationExpires: "",
    tripLimitsNotes: "",
    homePickupAddress: "",
    alternatePickupAddress: "",
    commonDestinations: [],
    primaryFacility: "",
    appointmentTypePreferences: [],
    returnRideUsuallyNeeded: false,
    mobilityNeeds: ["Ambulatory"],
    serviceAnimal: false,
    caregiverSeatRequired: false,
    vehicleTypeRequired: "Sedan",
    loadingTimeMinutes: 3,
    boardingAssistanceNotes: "",
    sensorySupport: "Low",
    quietRideRequired: false,
    noLoudMusic: false,
    noStrongScents: false,
    lowConversationPreferred: false,
    predictableCommunicationRequired: false,
    extraPickupPatienceRequired: false,
    motionSicknessRisk: false,
    knownTriggers: [],
    calmingStrategies: "",
    deEscalationNotes: "",
    driverInstructions: "",
    preferredDrivers: [],
    blockedDrivers: [],
    requiredDriverCertifications: [],
    requiredVehicleFeatures: [],
    hardFailRules: [],
    softPreferenceRules: [],
    notesForDispatcher: "",
    notesForDriver: "",
    adminOnlyNotes: "",
    caregiverRequired: false,
    activeRidesCount: 0,
    lastRideDate: "",
    riskFlags: [],
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    audit: [],
  }));

  const set = <K extends keyof RegisteredRider>(k: K, v: RegisteredRider[K]) =>
    setR((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!r.firstName || !r.lastName) return toast.error("First and last name are required.");
    const created: RegisteredRider = {
      ...r,
      audit: [
        {
          id: `RA-${r.id}-1`,
          ts: new Date().toISOString(),
          riderId: r.id,
          actor: user?.email ?? "admin@network-demo",
          role: "broker_admin",
          action: "rider.created",
          field: "*",
          oldValue: "—",
          newValue: "profile created",
        },
      ],
    };
    addRegisteredRider(created);
    toast.success(`Rider ${r.firstName} ${r.lastName} registered (${r.id})`);
    navigate({
      to: "/app/registered-riders/$riderId",
      params: { riderId: r.id },
      search: { edit: undefined },
    });
  };

  const triggers = r.knownTriggers.join(", ");
  const dest = r.commonDestinations.join(", ");

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        to="/app/registered-riders"
        className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Registered riders
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Register a new rider</h1>
        <p className="text-sm text-muted-foreground">
          One-time intake. This profile powers all future ride bookings, fit-score matching, and
          caregiver visibility.
        </p>
      </div>
      <Badge variant="outline" className="text-[10px]">
        Mock data only · No real PHI
      </Badge>

      <form onSubmit={submit} className="space-y-4">
        <Section title="Basic identity">
          <Field label="Rider ID">
            <Input value={r.id} onChange={(e) => set("id", e.target.value)} />
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={r.dob} onChange={(e) => set("dob", e.target.value)} />
          </Field>
          <Field label="First name">
            <Input
              required
              value={r.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name">
            <Input required value={r.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
          <Field label="Age group">
            <Select
              value={r.ageGroup}
              onValueChange={(v) => set("ageGroup", v as typeof r.ageGroup)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Primary language">
            <Input
              value={r.primaryLanguage}
              onChange={(e) => set("primaryLanguage", e.target.value)}
            />
          </Field>
          <Field label="Preferred communication style" full>
            <Input
              value={r.preferredCommunication}
              onChange={(e) => set("preferredCommunication", e.target.value)}
              placeholder="e.g. short predictable phrases"
            />
          </Field>
          <Field label="Emergency contact">
            <Input
              value={r.emergencyContact}
              onChange={(e) => set("emergencyContact", e.target.value)}
            />
          </Field>
          <Field label="Caregiver / guardian contact">
            <Input
              value={r.caregiverContact}
              onChange={(e) => set("caregiverContact", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Eligibility and funding">
          <Field label="Funding source">
            <Select
              value={r.fundingSource}
              onValueChange={(v) => set("fundingSource", v as typeof r.fundingSource)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUNDING_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Eligibility status">
            <Select
              value={r.eligibilityStatus}
              onValueChange={(v) => set("eligibilityStatus", v as typeof r.eligibilityStatus)}
            >
              <SelectTrigger>
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
          </Field>
          <Field label="Member ID (placeholder)">
            <Input
              value={r.memberId}
              onChange={(e) => set("memberId", e.target.value)}
              placeholder="•••• 0000"
            />
          </Field>
          <Field label="Plan or MCO (placeholder)">
            <Input value={r.planOrMco} onChange={(e) => set("planOrMco", e.target.value)} />
          </Field>
          <Field label="Authorization required">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="auth"
                checked={r.authorizationRequired}
                onCheckedChange={(v) => set("authorizationRequired", !!v)}
              />
              <label htmlFor="auth" className="text-sm">
                Yes
              </label>
            </div>
          </Field>
          <Field label="Authorization expiration">
            <Input
              type="date"
              value={r.authorizationExpires}
              onChange={(e) => set("authorizationExpires", e.target.value)}
            />
          </Field>
          <Field label="Trip limits / notes" full>
            <Input
              value={r.tripLimitsNotes}
              onChange={(e) => set("tripLimitsNotes", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Pickup & destination defaults">
          <Field label="Home pickup address" full>
            <Input
              value={r.homePickupAddress}
              onChange={(e) => set("homePickupAddress", e.target.value)}
            />
          </Field>
          <Field label="Alternate pickup address" full>
            <Input
              value={r.alternatePickupAddress}
              onChange={(e) => set("alternatePickupAddress", e.target.value)}
            />
          </Field>
          <Field label="Primary facility">
            <Input
              value={r.primaryFacility}
              onChange={(e) => set("primaryFacility", e.target.value)}
            />
          </Field>
          <Field label="Common destinations (comma separated)">
            <Input
              value={dest}
              onChange={(e) =>
                set(
                  "commonDestinations",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field label="Appointment type preferences (comma separated)" full>
            <Input
              value={r.appointmentTypePreferences.join(", ")}
              onChange={(e) =>
                set(
                  "appointmentTypePreferences",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field label="Return ride usually needed">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="rrn"
                checked={r.returnRideUsuallyNeeded}
                onCheckedChange={(v) => set("returnRideUsuallyNeeded", !!v)}
              />
              <label htmlFor="rrn" className="text-sm">
                Yes
              </label>
            </div>
          </Field>
        </Section>

        <Section title="Mobility & equipment needs">
          <Field label="Mobility needs" full>
            <MultiToggle
              value={r.mobilityNeeds}
              options={MOBILITY_OPTIONS}
              onChange={(v) => set("mobilityNeeds", v as typeof r.mobilityNeeds)}
            />
          </Field>
          <Field label="Required vehicle features" full>
            <MultiToggle
              value={r.requiredVehicleFeatures}
              options={VEHICLE_FEATURES}
              onChange={(v) => set("requiredVehicleFeatures", v)}
            />
          </Field>
          <Field label="Vehicle type required">
            <Input
              value={r.vehicleTypeRequired}
              onChange={(e) => set("vehicleTypeRequired", e.target.value)}
            />
          </Field>
          <Field label="Loading time (minutes)">
            <Input
              type="number"
              min={0}
              value={r.loadingTimeMinutes}
              onChange={(e) => set("loadingTimeMinutes", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Service animal">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="sa"
                checked={r.serviceAnimal}
                onCheckedChange={(v) => set("serviceAnimal", !!v)}
              />
              <label htmlFor="sa" className="text-sm">
                Yes
              </label>
            </div>
          </Field>
          <Field label="Caregiver seat required">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="cgs"
                checked={r.caregiverSeatRequired}
                onCheckedChange={(v) => {
                  set("caregiverSeatRequired", !!v);
                  set("caregiverRequired", !!v || r.caregiverRequired);
                }}
              />
              <label htmlFor="cgs" className="text-sm">
                Yes
              </label>
            </div>
          </Field>
          <Field label="Caregiver required for trip">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="cgr"
                checked={r.caregiverRequired}
                onCheckedChange={(v) => set("caregiverRequired", !!v)}
              />
              <label htmlFor="cgr" className="text-sm">
                Yes
              </label>
            </div>
          </Field>
          <Field label="Boarding assistance notes" full>
            <Textarea
              rows={2}
              value={r.boardingAssistanceNotes}
              onChange={(e) => set("boardingAssistanceNotes", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Sensory & behavioral support">
          <Field label="Sensory sensitivity">
            <Select
              value={r.sensorySupport}
              onValueChange={(v) => set("sensorySupport", v as typeof r.sensorySupport)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENSORY_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quick toggles" full>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {(
                [
                  ["Quiet ride required", "quietRideRequired"],
                  ["No loud music", "noLoudMusic"],
                  ["No strong scents", "noStrongScents"],
                  ["Low conversation preferred", "lowConversationPreferred"],
                  ["Predictable communication", "predictableCommunicationRequired"],
                  ["Extra pickup patience", "extraPickupPatienceRequired"],
                  ["Motion sickness risk", "motionSicknessRisk"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={r[key] as boolean}
                    onCheckedChange={(v) => set(key, !!v as never)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Known triggers (comma separated)" full>
            <Input
              value={triggers}
              onChange={(e) =>
                set(
                  "knownTriggers",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field label="Calming strategies" full>
            <Textarea
              rows={2}
              value={r.calmingStrategies}
              onChange={(e) => set("calmingStrategies", e.target.value)}
            />
          </Field>
          <Field label="De-escalation notes" full>
            <Textarea
              rows={2}
              value={r.deEscalationNotes}
              onChange={(e) => set("deEscalationNotes", e.target.value)}
            />
          </Field>
          <Field label="Driver instructions" full>
            <Textarea
              rows={2}
              value={r.driverInstructions}
              onChange={(e) => set("driverInstructions", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Safety & matching rules">
          <Field label="Preferred drivers (driver IDs, comma separated)">
            <Input
              value={r.preferredDrivers.join(", ")}
              onChange={(e) =>
                set(
                  "preferredDrivers",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="d1, d2"
            />
          </Field>
          <Field label="Blocked drivers (driver IDs, comma separated)">
            <Input
              value={r.blockedDrivers.join(", ")}
              onChange={(e) =>
                set(
                  "blockedDrivers",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="d5"
            />
          </Field>
          <Field label="Required driver certifications" full>
            <MultiToggle
              value={r.requiredDriverCertifications}
              options={CERT_OPTIONS}
              onChange={(v) => set("requiredDriverCertifications", v)}
            />
          </Field>
          <Field label="Hard fail rules (one per line)" full>
            <Textarea
              rows={3}
              value={r.hardFailRules.join("\n")}
              onChange={(e) =>
                set(
                  "hardFailRules",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Booster seat required"
            />
          </Field>
          <Field label="Soft preference rules (one per line)" full>
            <Textarea
              rows={3}
              value={r.softPreferenceRules.join("\n")}
              onChange={(e) =>
                set(
                  "softPreferenceRules",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
          <Field label="Notes visible to dispatcher" full>
            <Textarea
              rows={2}
              value={r.notesForDispatcher}
              onChange={(e) => set("notesForDispatcher", e.target.value)}
            />
          </Field>
          <Field label="Notes visible to driver" full>
            <Textarea
              rows={2}
              value={r.notesForDriver}
              onChange={(e) => set("notesForDriver", e.target.value)}
            />
          </Field>
          <Field label="Admin-only notes (hidden from driver)" full>
            <Textarea
              rows={2}
              value={r.adminOnlyNotes}
              onChange={(e) => set("adminOnlyNotes", e.target.value)}
            />
          </Field>
        </Section>

        <div className="flex justify-end gap-2 pb-8">
          <Link to="/app/registered-riders">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button size="lg" type="submit">
            Register rider
          </Button>
        </div>
      </form>
    </div>
  );
}
