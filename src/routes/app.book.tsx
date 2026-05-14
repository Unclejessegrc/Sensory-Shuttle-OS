import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { filterRegisteredRidersForScope, getAccessScope } from "@/lib/access-control";
import { APPOINTMENT_TYPES, FUNDING_SOURCES } from "@/lib/mock-data";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { AIDispatchCard } from "@/components/AIDispatchCard";
import { recommendForBooking, type BookingRequest } from "@/lib/ai-dispatch";

export const Route = createFileRoute("/app/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined,
  }),
  component: () => (
    <RoleGate allow={["dispatcher", "broker", "caregiver"]}>
      <BookRide />
    </RoleGate>
  ),
});

function BookRide() {
  const { addRide, addAudit, registeredRiders, rides, role } = useStore();
  const search = Route.useSearch();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const isRiderFacing = role === "caregiver";
  const activeRiders = filterRegisteredRidersForScope(accessScope, registeredRiders, rides).filter(
    (r) => !r.archived,
  );
  const [riderId, setRiderId] = useState(activeRiders[0]?.id ?? "");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState(search.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:30");
  const [type, setType] = useState(APPOINTMENT_TYPES[0]);
  const [returnRide, setReturnRide] = useState(true);
  const [caregiver, setCaregiver] = useState(false);
  const [notes, setNotes] = useState("Park in shaded spot. Caregiver brings rider out.");
  const [funding, setFunding] = useState(FUNDING_SOURCES[0]);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const rider = useMemo(() => activeRiders.find((r) => r.id === riderId), [activeRiders, riderId]);

  // Auto-fill defaults from registered rider profile when selection changes.
  useEffect(() => {
    if (!activeRiders.length) return;
    if (!activeRiders.some((item) => item.id === riderId)) {
      setRiderId(activeRiders[0].id);
      return;
    }
    if (!rider) return;
    setPickup(rider.homePickupAddress);
    setDropoff(rider.commonDestinations[0] ?? rider.primaryFacility ?? "");
    setReturnRide(rider.returnRideUsuallyNeeded);
    setCaregiver(rider.caregiverRequired);
    if (!isRiderFacing && rider.appointmentTypePreferences[0])
      setType(rider.appointmentTypePreferences[0]);
    setNotes(
      isRiderFacing ? "Park in shaded spot. Caregiver brings rider out." : rider.driverInstructions,
    );
    if (FUNDING_SOURCES.includes(rider.fundingSource)) setFunding(rider.fundingSource);
  }, [activeRiders, isRiderFacing, rider, riderId]);

  useEffect(() => {
    if (isRiderFacing && search.date) setDate(search.date);
  }, [isRiderFacing, search.date]);

  const accommodations = useMemo(() => {
    if (!rider) return [];
    const arr: string[] = [];
    if (rider.mobilityNeeds.some((m) => m === "Wheelchair" || m === "Power Wheelchair"))
      arr.push("WAV vehicle");
    if (rider.mobilityNeeds.includes("Stretcher")) arr.push("Stretcher van");
    if (rider.mobilityNeeds.includes("Booster Seat") || rider.mobilityNeeds.includes("Car Seat"))
      arr.push("Booster / car seat");
    if (rider.mobilityNeeds.includes("Walker")) arr.push("Walker assist");
    if (rider.caregiverRequired) arr.push("Caregiver attending");
    if (rider.quietRideRequired) arr.push("Quiet ride");
    if (rider.noStrongScents) arr.push("No strong scents");
    if (rider.noLoudMusic) arr.push("No loud music");
    if (rider.extraPickupPatienceRequired) arr.push("Extra pickup patience");
    if (rider.sensorySupport === "High") arr.push("Sensory-trained driver only");
    if (rider.serviceAnimal) arr.push("Service animal");
    rider.requiredDriverCertifications.forEach((c) => arr.push(`Cert: ${c}`));
    return arr;
  }, [rider]);

  const eligibilityBlock = rider && rider.eligibilityStatus !== "Active";
  const bookingRequest = useMemo<BookingRequest | null>(() => {
    if (!rider) return null;
    return {
      rider,
      pickupAddress: pickup,
      dropoffAddress: dropoff,
      appointmentDate: date,
      appointmentTime: time,
      appointmentType: type,
      caregiverAttending: caregiver,
      returnRideNeeded: returnRide,
      specialInstructions: notes,
      fundingSource: funding,
    };
  }, [caregiver, date, dropoff, funding, notes, pickup, returnRide, rider, time, type]);
  const aiRecommendation = useMemo(
    () => (bookingRequest ? recommendForBooking(bookingRequest, rides) : null),
    [bookingRequest, rides],
  );

  const appointmentFields = (
    <>
      <div>
        <Label>Appointment Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="ret" checked={returnRide} onCheckedChange={(v) => setReturnRide(!!v)} />
        <Label htmlFor="ret" className="cursor-pointer">
          Return ride needed?
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cg" checked={caregiver} onCheckedChange={(v) => setCaregiver(!!v)} />
        <Label htmlFor="cg" className="cursor-pointer">
          Caregiver attending?
        </Label>
      </div>
      <div>
        <Label>Special instructions</Label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Park in shaded spot. Caregiver brings rider out."
        />
      </div>
    </>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;
    if (eligibilityBlock)
      return toast.error(`Cannot dispatch — eligibility is ${rider.eligibilityStatus}.`);
    const id = `RD-${1100 + Math.floor(Math.random() * 900)}`;
    const recommendation = aiRecommendation;
    addRide({
      id,
      riderId,
      driverId: recommendation?.driver?.id,
      vehicleId: recommendation?.vehicle?.id,
      providerId: recommendation?.providerId ?? "p1",
      assignmentMode: recommendation?.mode,
      externalPartner: recommendation?.externalPartner,
      assignmentConfidence: recommendation?.confidence,
      estimatedTripMinutes: recommendation?.estimatedTripMinutes,
      dispatchRecommendation: recommendation?.reasons,
      pickupAddress: pickup,
      dropoffAddress: dropoff,
      appointmentDate: date,
      appointmentTime: time,
      appointmentType: type,
      returnRideNeeded: returnRide,
      caregiverAttending: caregiver,
      specialInstructions: notes,
      fundingSource: funding,
      status: "scheduled",
      etaConfidence: recommendation?.mode === "manual_review" ? "low" : "high",
      etaReasons: recommendation
        ? [`AI bot: ${recommendation.title}`, ...recommendation.reasons.slice(0, 2)]
        : ["Pickup not yet started"],
      gpsLastUpdateMin: 0,
      driverMoving: false,
      scheduledPickupISO: new Date(`${date}T${time}:00`).toISOString(),
    });
    addAudit({
      id: `L-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "dispatcher@demo",
      action:
        recommendation?.mode === "external_tnc"
          ? "ride.booked_external_ai"
          : "ride.booked_from_profile",
      entityId: id,
      details: `Booked ${type} for ${rider.firstName} ${rider.lastName} (${rider.id}). ${
        recommendation?.title ?? "No AI assignment"
      }`,
    });
    toast.success(`Ride ${id} booked`);
    setConfirmed(id);
  };

  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">Ride confirmed</h2>
              <p className="text-sm text-muted-foreground">
                {confirmed} · {rider?.firstName} {rider?.lastName} · {date} {time}
              </p>
            </div>
            <div className="text-left rounded-lg border p-4 bg-accent/30">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Accommodations applied
              </div>
              <div className="flex flex-wrap gap-1">
                {accommodations.map((a) => (
                  <DefinitionBadge key={a} term={a} />
                ))}
                {accommodations.length === 0 && (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setConfirmed(null)} variant="outline">
                Book another
              </Button>
              <Link to={isRiderFacing ? "/app/caregiver" : "/app/dispatch"}>
                <Button>{isRiderFacing ? "View my rides" : "Open dispatch"}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeRiders.length) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No riders are available within your locked access scope.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Book a ride</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isRiderFacing
          ? "Choose the appointment date first. Then enter the pickup, drop-off, time, and support details for the ride."
          : "Selecting a registered rider auto-fills pickup, accommodations, and matching rules from their profile."}
      </p>

      {!isRiderFacing && rider && (eligibilityBlock || rider.hardFailRules.length > 0) && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-warning-foreground mt-0.5" />
          <div className="space-y-1">
            {eligibilityBlock && (
              <div className="font-medium text-destructive">
                Eligibility {rider.eligibilityStatus} — dispatch will be blocked.
              </div>
            )}
            {rider.hardFailRules.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Hard fail rules from profile (passed to Fit Score)
                </div>
                <ul className="list-disc pl-5">
                  {rider.hardFailRules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!isRiderFacing && (
        <div className="mb-4">
          <AIDispatchCard recommendation={aiRecommendation} />
        </div>
      )}

      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {!isRiderFacing && (
          <Card className="md:col-span-2">
            <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
              <div>
                <Label>Registered rider</Label>
                <Select value={riderId} onValueChange={setRiderId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRiders.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} · {r.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rider && (
                  <Link
                    to="/app/registered-riders/$riderId"
                    params={{ riderId: rider.id }}
                    search={{ edit: undefined }}
                    className="text-[11px] text-primary hover:underline mt-1 inline-block"
                  >
                    View full profile →
                  </Link>
                )}
              </div>
              <div className="md:col-span-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Auto-pulled accommodations
                </div>
                <div className="flex flex-wrap gap-1">
                  {accommodations.map((a) => (
                    <DefinitionBadge key={a} term={a} />
                  ))}
                  {accommodations.length === 0 && (
                    <span className="text-sm text-muted-foreground">None on file</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={isRiderFacing ? "md:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle className="text-base">Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Pickup address</Label>
              <Input
                required
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div>
              <Label>Dropoff address</Label>
              <Input
                required
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Clinic name or address"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            {isRiderFacing && appointmentFields}
          </CardContent>
        </Card>

        {!isRiderFacing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">{appointmentFields}</CardContent>
          </Card>
        )}

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="submit" size="lg" disabled={!rider || !!eligibilityBlock}>
            {isRiderFacing ? "Request ride" : "Book ride"}
          </Button>
        </div>
      </form>
    </div>
  );
}
