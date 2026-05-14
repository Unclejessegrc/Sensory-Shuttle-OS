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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { filterRegisteredRidersForScope, getAccessScope } from "@/lib/access-control";
import {
  APPOINTMENT_TYPES,
  FUNDING_SOURCES,
  INSURANCE_TYPES,
} from "@/lib/mock-data";
import type { InsuranceDetails } from "@/lib/mock-data";
import { toast } from "sonner";
import { CalendarIcon, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { AIDispatchCard } from "@/components/AIDispatchCard";
import { recommendForBooking, type BookingRequest } from "@/lib/ai-dispatch";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [insurance, setInsurance] = useState<InsuranceDetails>({
    insuranceType: "Medicaid",
    companyName: "",
    memberId: "",
    groupNumber: "",
    policyHolderName: "",
    authorizationNumber: "",
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [duplicateAck, setDuplicateAck] = useState(false);

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
    // Pre-fill insurance details from the rider profile when available.
    const mappedInsurance = INSURANCE_TYPES.includes(rider.fundingSource)
      ? rider.fundingSource
      : rider.fundingSource === "Private Pay"
        ? "Self-pay"
        : rider.fundingSource === "Facility Contract"
          ? "Other"
          : "Medicaid";
    setInsurance({
      insuranceType: mappedInsurance,
      companyName: rider.planOrMco || "",
      memberId: rider.memberId || "",
      groupNumber: "",
      policyHolderName: `${rider.firstName} ${rider.lastName}`,
      authorizationNumber: rider.authorizationRequired ? "AUTH-" + rider.id : "",
    });
    setDuplicateAck(false);
  }, [isRiderFacing, rider?.id, activeRiders.length, riderId]);

  // Parse a YYYY-MM-DD string into a local Date (without time-zone drift).
  const dateAsDate = useMemo(() => {
    const parsed = parseISO(`${date}T00:00:00`);
    return isValid(parsed) ? parsed : new Date();
  }, [date]);

  // Other rides this rider already has on the picked date (excludes canceled / no-show).
  const sameDayRiderRides = useMemo(() => {
    if (!rider) return [];
    return rides
      .filter((r) => r.riderId === rider.id || r.riderId === rider.id.toLowerCase().replace("rr-", "r"))
      .filter((r) => r.appointmentDate === date)
      .filter((r) => !["canceled", "no_show"].includes(r.status))
      .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  }, [rides, rider, date]);

  const hasDuplicate = sameDayRiderRides.some(
    (r) => r.appointmentTime === time && r.pickupAddress === pickup,
  );

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
    if (hasDuplicate && !duplicateAck) {
      return toast.error(
        "Duplicate booking detected. Acknowledge the conflict or change the time/pickup.",
      );
    }
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
      insurance: isRiderFacing ? undefined : insurance,
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
    if (hasDuplicate) {
      addAudit({
        id: `L-${Date.now() + 1}`,
        ts: new Date().toISOString(),
        actor: "dispatcher@demo",
        action: "ride.duplicate_override",
        entityId: id,
        details: `Duplicate-booking override acknowledged for ${rider.id} on ${date} ${time}`,
      });
    }
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
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="book-date-picker-trigger"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(dateAsDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    data-testid="book-date-picker-popover"
                  >
                    <Calendar
                      mode="single"
                      selected={dateAsDate}
                      onSelect={(d) => {
                        if (!d) return;
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const dd = String(d.getDate()).padStart(2, "0");
                        setDate(`${yyyy}-${mm}-${dd}`);
                        setDuplicateAck(false);
                        setCalendarOpen(false);
                      }}
                      disabled={(d) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return d < today;
                      }}
                    />
                    {rider && sameDayRiderRides.length > 0 && (
                      <div
                        className="border-t bg-muted/30 px-3 py-2 max-w-[280px]"
                        data-testid="book-date-existing-rides"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-warning-foreground" />
                          {sameDayRiderRides.length} ride
                          {sameDayRiderRides.length > 1 ? "s" : ""} already scheduled
                        </div>
                        <ul className="space-y-1">
                          {sameDayRiderRides.slice(0, 4).map((r) => (
                            <li key={r.id} className="text-[11px] text-muted-foreground">
                              <span className="font-mono">{r.id}</span> · {r.appointmentTime} ·{" "}
                              {r.appointmentType}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  required
                  value={time}
                  data-testid="book-time-input"
                  onChange={(e) => {
                    setTime(e.target.value);
                    setDuplicateAck(false);
                  }}
                />
              </div>
            </div>
            {rider && sameDayRiderRides.length > 0 && (
              <div
                className="rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs"
                data-testid="book-existing-rides-banner"
              >
                <div className="font-medium text-warning-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {rider.firstName} already has {sameDayRiderRides.length} ride
                  {sameDayRiderRides.length > 1 ? "s" : ""} on {format(dateAsDate, "PPP")}
                </div>
                <ul className="mt-1 space-y-0.5 text-muted-foreground">
                  {sameDayRiderRides.map((r) => (
                    <li key={r.id} data-testid={`book-existing-ride-${r.id}`}>
                      <span className="font-mono">{r.id}</span> · {r.appointmentTime} ·{" "}
                      {r.appointmentType} → {r.dropoffAddress}
                    </li>
                  ))}
                </ul>
                {hasDuplicate && (
                  <div
                    className="mt-2 flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive"
                    data-testid="book-duplicate-warning"
                  >
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="font-medium">
                        Possible duplicate booking — same time and pickup address already exists.
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={duplicateAck}
                          onCheckedChange={(v) => setDuplicateAck(!!v)}
                          data-testid="book-duplicate-ack"
                        />
                        <span className="text-[11px]">
                          I've confirmed this is a different ride — proceed anyway.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
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

        {!isRiderFacing && (
          <Card className="md:col-span-2" data-testid="book-insurance-card">
            <CardHeader>
              <CardTitle className="text-base">Insurance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Insurance type</Label>
                <Select
                  value={insurance.insuranceType}
                  onValueChange={(v) => setInsurance((p) => ({ ...p, insuranceType: v }))}
                >
                  <SelectTrigger data-testid="book-insurance-type-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_TYPES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        data-testid={`book-insurance-type-${t.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Reveal company/member/group/policy/auth only after an insurance type is chosen. */}
              {insurance.insuranceType && (
                <div
                  className="grid gap-3 md:grid-cols-2 pt-2 border-t"
                  data-testid="book-insurance-details"
                >
                  <div>
                    <Label>Insurance company name</Label>
                    <Input
                      data-testid="book-insurance-company"
                      value={insurance.companyName}
                      onChange={(e) =>
                        setInsurance((p) => ({ ...p, companyName: e.target.value }))
                      }
                      placeholder={
                        insurance.insuranceType === "Self-pay"
                          ? "Self-pay"
                          : "e.g. Sunrise MCO, Bluepine Medicare"
                      }
                    />
                  </div>
                  <div>
                    <Label>Member ID</Label>
                    <Input
                      data-testid="book-insurance-member-id"
                      value={insurance.memberId}
                      onChange={(e) =>
                        setInsurance((p) => ({ ...p, memberId: e.target.value }))
                      }
                      placeholder="•••• 0000"
                    />
                  </div>
                  <div>
                    <Label>Group number</Label>
                    <Input
                      data-testid="book-insurance-group"
                      value={insurance.groupNumber}
                      onChange={(e) =>
                        setInsurance((p) => ({ ...p, groupNumber: e.target.value }))
                      }
                      placeholder="GRP-0000"
                    />
                  </div>
                  <div>
                    <Label>Policy holder name</Label>
                    <Input
                      data-testid="book-insurance-policy-holder"
                      value={insurance.policyHolderName}
                      onChange={(e) =>
                        setInsurance((p) => ({ ...p, policyHolderName: e.target.value }))
                      }
                      placeholder="Full legal name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Authorization number</Label>
                    <Input
                      data-testid="book-insurance-authorization"
                      value={insurance.authorizationNumber}
                      onChange={(e) =>
                        setInsurance((p) => ({ ...p, authorizationNumber: e.target.value }))
                      }
                      placeholder="AUTH-0000 (if required by payer)"
                    />
                  </div>
                </div>
              )}
              {rider && rider.fundingSource && (
                <Badge variant="outline" className="text-[10px]">
                  Pre-filled from rider profile · funding source on file: {rider.fundingSource}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button
            type="submit"
            size="lg"
            data-testid="book-submit-btn"
            disabled={!rider || !!eligibilityBlock || (hasDuplicate && !duplicateAck)}
          >
            {isRiderFacing ? "Request ride" : "Book ride"}
          </Button>
        </div>
      </form>
    </div>
  );
}
