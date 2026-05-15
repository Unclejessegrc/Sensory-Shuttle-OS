import {
  drivers,
  providers,
  riders,
  vehicles,
  type Driver,
  type Ride,
  type Vehicle,
} from "./mock-data";
import type { RegisteredRider } from "./registered-riders";

export type DispatchMode = "internal_nemt" | "external_tnc" | "manual_review";
export type ExternalPartner = "lyft" | "uber";

export interface DispatchProfile {
  id: string;
  displayName: string;
  ageGroup: "Pediatric" | "Adult" | "Senior";
  caregiverRequired: boolean;
  requiresWheelchair: boolean;
  requiresStretcher: boolean;
  requiresBooster: boolean;
  requiresWalkerAssist: boolean;
  sensorySupport: "Low" | "Medium" | "High";
  quietRideRequired: boolean;
  noStrongScents: boolean;
  noLoudMusic: boolean;
  extraPickupPatience: boolean;
  serviceAnimal: boolean;
  preferredDrivers: string[];
  blockedDrivers: string[];
  requiredCertifications: string[];
  requiredVehicleFeatures: string[];
  loadingTimeMinutes: number;
  riskNotes: string[];
}

export interface BookingRequest {
  rider: RegisteredRider;
  pickupAddress: string;
  dropoffAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  caregiverAttending: boolean;
  returnRideNeeded: boolean;
  specialInstructions: string;
  fundingSource: string;
}

export interface DriverCandidate {
  driver: Driver;
  vehicle?: Vehicle;
  providerName: string;
  score: number;
  available: boolean;
  hardFails: string[];
  warnings: string[];
  windowLabel: string;
}

export type AssignmentDecision = "Safe to assign" | "Risky" | "Do not assign";

export interface GapTimeEstimate {
  status: AssignmentDecision;
  availableMinutes: number;
  proposedRideMinutes: number;
  bufferMinutes: number;
  explanation: string;
}

export interface RadiusRuleResult {
  status: "Assignment allowed" | "Assignment blocked";
  distanceMiles: number;
  limitMiles: number;
  overrideRequired: boolean;
  explanation: string;
}

export interface DispatchAssistResult {
  gapTime: GapTimeEstimate;
  radiusRule: RadiusRuleResult;
  overallRecommendation: AssignmentDecision;
  reasoning: string[];
  warnings: string[];
}

export interface DispatchRecommendation {
  mode: DispatchMode;
  title: string;
  confidence: number;
  driver?: Driver;
  vehicle?: Vehicle;
  providerId: string;
  externalPartner?: ExternalPartner;
  estimatedTripMinutes: number;
  scheduledPickupISO: string;
  reasons: string[];
  warnings: string[];
  candidates: DriverCandidate[];
  assist: DispatchAssistResult;
  reviewedDriverId?: string;
}

export function profileFromRegisteredRider(rider: RegisteredRider): DispatchProfile {
  return {
    id: rider.id,
    displayName: `${rider.firstName} ${rider.lastName}`,
    ageGroup: rider.ageGroup,
    caregiverRequired: rider.caregiverRequired,
    requiresWheelchair: rider.mobilityNeeds.some(
      (m) => m === "Wheelchair" || m === "Power Wheelchair",
    ),
    requiresStretcher: rider.mobilityNeeds.includes("Stretcher"),
    requiresBooster:
      rider.mobilityNeeds.includes("Booster Seat") || rider.mobilityNeeds.includes("Car Seat"),
    requiresWalkerAssist: rider.mobilityNeeds.includes("Walker"),
    sensorySupport: rider.sensorySupport,
    quietRideRequired: rider.quietRideRequired,
    noStrongScents: rider.noStrongScents,
    noLoudMusic: rider.noLoudMusic,
    extraPickupPatience: rider.extraPickupPatienceRequired,
    serviceAnimal: rider.serviceAnimal,
    preferredDrivers: rider.preferredDrivers,
    blockedDrivers: rider.blockedDrivers,
    requiredCertifications: rider.requiredDriverCertifications,
    requiredVehicleFeatures: rider.requiredVehicleFeatures,
    loadingTimeMinutes: rider.loadingTimeMinutes,
    riskNotes: rider.riskFlags,
  };
}

function profileFromLegacyRideRider(riderId: string): DispatchProfile | null {
  const rider = riders.find((r) => r.id === riderId);
  if (!rider) return null;
  return {
    id: rider.id,
    displayName: rider.name,
    ageGroup:
      rider.ageGroup === "child" || rider.ageGroup === "teen"
        ? "Pediatric"
        : rider.ageGroup === "senior"
          ? "Senior"
          : "Adult",
    caregiverRequired: rider.caregiverRequired,
    requiresWheelchair: rider.wheelchairRequired,
    requiresStretcher: false,
    requiresBooster: rider.boosterSeatRequired,
    requiresWalkerAssist: rider.walkerRequired,
    sensorySupport:
      rider.sensorySensitivity === "high"
        ? "High"
        : rider.sensorySensitivity === "medium"
          ? "Medium"
          : "Low",
    quietRideRequired: rider.needsQuietRide,
    noStrongScents: rider.noStrongScents,
    noLoudMusic: rider.noLoudMusic,
    extraPickupPatience: rider.extraPickupPatience,
    serviceAnimal: false,
    preferredDrivers: rider.preferredDrivers,
    blockedDrivers: rider.blockedDrivers,
    requiredCertifications: [
      rider.ageGroup === "child" || rider.ageGroup === "teen" ? "Pediatric" : "",
      rider.wheelchairRequired ? "WAV" : "",
      rider.sensorySensitivity === "high" ? "Sensory" : "",
    ].filter(Boolean),
    requiredVehicleFeatures: [
      rider.wheelchairRequired ? "Lift" : "",
      rider.wheelchairRequired ? "Ramp" : "",
      rider.boosterSeatRequired ? "Booster" : "",
      rider.needsQuietRide || rider.sensorySensitivity === "high" ? "Quiet Cabin" : "",
    ].filter(Boolean),
    loadingTimeMinutes: rider.wheelchairRequired ? 8 : rider.extraPickupPatience ? 5 : 3,
    riskNotes: [
      rider.sensorySensitivity === "high" ? "High sensory support" : "",
      rider.wheelchairRequired ? "Wheelchair required" : "",
      rider.boosterSeatRequired ? "Booster required" : "",
      rider.caregiverRequired ? "Caregiver required" : "",
    ].filter(Boolean),
  };
}

export function estimateTripMinutes(profile: DispatchProfile, appointmentType: string) {
  const medicalPriority = ["Dialysis", "Imaging", "Specialist", "Behavioral"].some((term) =>
    appointmentType.toLowerCase().includes(term.toLowerCase()),
  );
  return (
    35 +
    profile.loadingTimeMinutes +
    (profile.requiresWheelchair ? 15 : 0) +
    (profile.requiresStretcher ? 25 : 0) +
    (profile.extraPickupPatience ? 10 : 0) +
    (medicalPriority ? 10 : 0)
  );
}

const MOCK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "412 maple st": { lat: 39.744, lng: -104.982 },
  "children's therapy center": { lat: 39.731, lng: -104.968 },
  "88 oak ridge": { lat: 39.802, lng: -105.023 },
  "riverside dialysis": { lat: 39.775, lng: -104.913 },
  "1207 birch ln": { lat: 39.711, lng: -105.017 },
  "westside behavioral health": { lat: 39.701, lng: -105.071 },
  "55 elm ct": { lat: 39.836, lng: -104.995 },
  "riverside imaging": { lat: 39.781, lng: -104.928 },
  "northgate high school": { lat: 39.846, lng: -105.046 },
  "1402 pine ave": { lat: 39.728, lng: -105.031 },
  "westside specialty clinic": { lat: 39.719, lng: -105.067 },
  "77 cedar ct": { lat: 39.793, lng: -105.002 },
  "230 birch ln": { lat: 39.723, lng: -105.004 },
  "downtown imaging": { lat: 39.748, lng: -104.99 },
  "behavioral health group": { lat: 39.739, lng: -105.018 },
};

function hashAddress(address: string) {
  return address.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function coordinateForAddress(address: string) {
  const lower = address.toLowerCase();
  const known = Object.entries(MOCK_COORDINATES).find(([key]) => lower.includes(key));
  if (known) return known[1];
  const hash = hashAddress(lower);
  return {
    lat: 39.68 + (hash % 90) / 1000,
    lng: -105.09 + (hash % 110) / 1000,
  };
}

export function calculateMockDistanceMiles(addressA: string, addressB: string) {
  if (!addressA || !addressB) return 0;
  const a = coordinateForAddress(addressA);
  const b = coordinateForAddress(addressB);
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const distance = 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(distance * 10) / 10;
}

function driveMinutesBetween(addressA: string, addressB: string) {
  const miles = calculateMockDistanceMiles(addressA, addressB);
  return Math.max(6, Math.round((miles / 24) * 60 + 5));
}

function appointmentDurationMinutes(appointmentType: string) {
  const lower = appointmentType.toLowerCase();
  if (lower.includes("dialysis")) return 210;
  if (lower.includes("therapy")) return 90;
  if (lower.includes("behavioral")) return 75;
  if (lower.includes("imaging")) return 70;
  if (lower.includes("specialist")) return 75;
  if (lower.includes("lab")) return 45;
  if (lower.includes("school")) return 180;
  return 60;
}

function sameRideDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function activeDriverRides(driverId: string, ridesToCheck: Ride[], scheduledPickupISO: string) {
  return ridesToCheck
    .filter((ride) => ride.driverId === driverId)
    .filter((ride) => !["canceled", "no_show"].includes(ride.status))
    .filter((ride) => sameRideDay(ride.scheduledPickupISO, scheduledPickupISO))
    .sort(
      (a, b) => new Date(a.scheduledPickupISO).getTime() - new Date(b.scheduledPickupISO).getTime(),
    );
}

export function estimateGapTimeForDriver(
  driverId: string | undefined,
  proposedRide: Pick<
    Ride,
    "pickupAddress" | "dropoffAddress" | "appointmentType" | "scheduledPickupISO"
  >,
  existingRides: Ride[],
  estimatedTripMinutes: number,
): GapTimeEstimate {
  const bufferMinutes = 15;
  if (!driverId) {
    return {
      status: "Risky",
      availableMinutes: 0,
      proposedRideMinutes: estimatedTripMinutes,
      bufferMinutes,
      explanation:
        "No internal driver is selected yet. Gap-time cannot be cleared until a driver is chosen.",
    };
  }

  const proposedPickup = new Date(proposedRide.scheduledPickupISO).getTime();
  const driverRides = activeDriverRides(driverId, existingRides, proposedRide.scheduledPickupISO);
  const anchor = [...driverRides]
    .reverse()
    .find(
      (ride) =>
        ride.returnRideNeeded && new Date(ride.scheduledPickupISO).getTime() < proposedPickup,
    );
  const requiredMinutes =
    estimatedTripMinutes +
    (anchor ? driveMinutesBetween(anchor.dropoffAddress, proposedRide.pickupAddress) : 0);
  const availableMinutes = anchor
    ? Math.max(0, appointmentDurationMinutes(anchor.appointmentType) - 10)
    : 90;
  const status: AssignmentDecision =
    availableMinutes >= requiredMinutes + bufferMinutes
      ? "Safe to assign"
      : availableMinutes >= requiredMinutes
        ? "Risky"
        : "Do not assign";

  return {
    status,
    availableMinutes,
    proposedRideMinutes: requiredMinutes,
    bufferMinutes,
    explanation: `Driver has ${availableMinutes} minutes available. Proposed ride requires ${requiredMinutes} minutes plus ${bufferMinutes} minute buffer. ${status}.`,
  };
}

export function checkDriverDailyRadius(
  driverId: string | undefined,
  proposedRide: Pick<Ride, "pickupAddress" | "dropoffAddress" | "scheduledPickupISO">,
  existingRides: Ride[],
): RadiusRuleResult {
  const limitMiles = 15;
  if (!driverId) {
    return {
      status: "Assignment allowed",
      distanceMiles: 0,
      limitMiles,
      overrideRequired: false,
      explanation:
        "Assignment allowed: no internal driver is selected yet, so the 15-mile service radius will be checked after driver selection.",
    };
  }

  const driverRides = activeDriverRides(driverId, existingRides, proposedRide.scheduledPickupISO);
  if (!driverRides.length) {
    return {
      status: "Assignment allowed",
      distanceMiles: 0,
      limitMiles,
      overrideRequired: false,
      explanation: "Assignment allowed: this ride becomes the driver's route anchor for today.",
    };
  }

  const distances = driverRides.flatMap((ride) => [
    calculateMockDistanceMiles(ride.pickupAddress, proposedRide.pickupAddress),
    calculateMockDistanceMiles(ride.dropoffAddress, proposedRide.pickupAddress),
    calculateMockDistanceMiles(ride.pickupAddress, proposedRide.dropoffAddress),
    calculateMockDistanceMiles(ride.dropoffAddress, proposedRide.dropoffAddress),
  ]);
  const distanceMiles = Math.round(Math.max(...distances) * 10) / 10;
  const blocked = distanceMiles > limitMiles;

  return {
    status: blocked ? "Assignment blocked" : "Assignment allowed",
    distanceMiles,
    limitMiles,
    overrideRequired: blocked,
    explanation: blocked
      ? "Assignment blocked: this ride is outside the driver's 15-mile service radius for today."
      : "Assignment allowed: this ride is within the driver's 15-mile service radius.",
  };
}

function buildDispatchAssist({
  driverId,
  proposedRide,
  existingRides,
  estimatedTripMinutes,
}: {
  driverId?: string;
  proposedRide: Pick<
    Ride,
    "pickupAddress" | "dropoffAddress" | "appointmentType" | "scheduledPickupISO"
  >;
  existingRides: Ride[];
  estimatedTripMinutes: number;
}): DispatchAssistResult {
  const gapTime = estimateGapTimeForDriver(
    driverId,
    proposedRide,
    existingRides,
    estimatedTripMinutes,
  );
  const radiusRule = checkDriverDailyRadius(driverId, proposedRide, existingRides);
  const warnings = [
    gapTime.status !== "Safe to assign" ? gapTime.explanation : "",
    radiusRule.overrideRequired ? radiusRule.explanation : "",
  ].filter(Boolean);
  const overallRecommendation: AssignmentDecision =
    gapTime.status === "Do not assign" || radiusRule.overrideRequired
      ? "Do not assign"
      : gapTime.status === "Risky"
        ? "Risky"
        : "Safe to assign";

  return {
    gapTime,
    radiusRule,
    overallRecommendation,
    reasoning: [gapTime.explanation, radiusRule.explanation],
    warnings,
  };
}

function windowForRide(scheduledPickupISO: string, estimatedTripMinutes: number) {
  const pickup = new Date(scheduledPickupISO).getTime();
  const start = pickup - 20 * 60 * 1000;
  const end = pickup + (estimatedTripMinutes + 20) * 60 * 1000;
  return { start, end };
}

function windowsOverlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

function formatWindow(scheduledPickupISO: string, estimatedTripMinutes: number) {
  const { start, end } = windowForRide(scheduledPickupISO, estimatedTripMinutes);
  const fmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt.format(new Date(start))} - ${fmt.format(new Date(end))}`;
}

function conflictsForDriver(
  driverId: string,
  scheduledPickupISO: string,
  estimatedTripMinutes: number,
  ridesToCheck: Ride[],
) {
  const targetWindow = windowForRide(scheduledPickupISO, estimatedTripMinutes);
  return ridesToCheck.filter((ride) => {
    if (ride.driverId !== driverId) return false;
    if (["completed", "canceled", "no_show"].includes(ride.status)) return false;
    const existingMinutes = ride.estimatedTripMinutes ?? 70;
    return windowsOverlap(targetWindow, windowForRide(ride.scheduledPickupISO, existingMinutes));
  });
}

function vehicleFeatureSet(vehicle: Vehicle) {
  return new Set(
    [
      ...vehicle.features,
      vehicle.wheelchairAccessible ? "Lift" : "",
      vehicle.wheelchairAccessible ? "Ramp" : "",
      vehicle.hasBooster ? "Booster" : "",
      vehicle.hasBooster ? "Car Seat" : "",
      vehicle.capacity >= 5 ? "High-Capacity" : "",
    ].filter(Boolean),
  );
}

function missingVehicleFeatures(vehicle: Vehicle | undefined, profile: DispatchProfile) {
  if (!vehicle) return profile.requiredVehicleFeatures;
  const availableFeatures = vehicleFeatureSet(vehicle);
  return profile.requiredVehicleFeatures.filter((feature) => !availableFeatures.has(feature));
}

function vehicleCanServeProfile(vehicle: Vehicle, profile: DispatchProfile) {
  if (profile.requiresWheelchair && !vehicle.wheelchairAccessible) return false;
  if (profile.requiresBooster && !vehicle.hasBooster) return false;
  if (profile.caregiverRequired && vehicle.capacity < 3) return false;
  if (profile.requiresStretcher && !vehicle.features.includes("Stretcher")) return false;
  return missingVehicleFeatures(vehicle, profile).length === 0;
}

function vehicleMatchesDriver(driver: Driver, profile: DispatchProfile) {
  const providerVehicles = vehicles.filter((vehicle) => vehicle.providerId === driver.providerId);
  return providerVehicles.find((vehicle) => vehicleCanServeProfile(vehicle, profile));
}

function scoreCandidate(
  driver: Driver,
  profile: DispatchProfile,
  scheduledPickupISO: string,
  estimatedTripMinutes: number,
  ridesToCheck: Ride[],
): DriverCandidate {
  const hardFails: string[] = [];
  const warnings: string[] = [];
  const vehicle = vehicleMatchesDriver(driver, profile);
  const provider = providers.find((p) => p.id === driver.providerId);
  const missingFeatures = missingVehicleFeatures(vehicle, profile);
  const conflicts = conflictsForDriver(
    driver.id,
    scheduledPickupISO,
    estimatedTripMinutes,
    ridesToCheck,
  );

  if (!vehicle) {
    hardFails.push(
      profile.requiredVehicleFeatures.length
        ? `No available company vehicle has required features: ${profile.requiredVehicleFeatures.join(", ")}.`
        : "No available company vehicle satisfies this ride's capacity and equipment requirements.",
    );
  }
  if (profile.requiresWheelchair && !vehicle?.wheelchairAccessible)
    hardFails.push("Rider requires a wheelchair-accessible vehicle.");
  if (profile.requiresBooster && !vehicle?.hasBooster)
    hardFails.push("Rider requires booster/car seat equipment.");
  if (profile.caregiverRequired && (!vehicle || vehicle.capacity < 3))
    hardFails.push("Caregiver required but no matched vehicle has enough capacity.");
  if (profile.requiresStretcher && !vehicle?.features.includes("Stretcher"))
    hardFails.push("Rider requires stretcher transport.");
  if (vehicle && missingFeatures.length)
    hardFails.push(`Vehicle missing required feature(s): ${missingFeatures.join(", ")}.`);
  if (profile.sensorySupport === "High" && !driver.sensoryTrained)
    hardFails.push("High sensory rider requires a sensory-trained driver.");
  if (profile.ageGroup === "Pediatric" && !driver.pediatricCertified)
    hardFails.push("Pediatric rider requires a pediatric-certified driver.");
  if (profile.requiresWheelchair && !driver.wheelchairCertified)
    hardFails.push("Wheelchair rider requires a WAV-certified driver.");
  if (profile.blockedDrivers.includes(driver.id))
    hardFails.push("Driver is blocked on rider profile.");
  if (conflicts.length) hardFails.push(`Driver is already booked for ${conflicts[0].id}.`);

  if (!profile.preferredDrivers.includes(driver.id))
    warnings.push("Not listed as a preferred driver.");
  if (driver.complaintRate > 0.05)
    warnings.push("Driver complaint rate is above preferred threshold.");
  if ((provider?.onTimeRate ?? 0) < 0.85)
    warnings.push("Provider on-time rate is below transportation network target.");

  let score = 45;
  score += driver.sensoryTrained ? 12 : profile.sensorySupport === "Low" ? 4 : 0;
  score += driver.pediatricCertified || profile.ageGroup !== "Pediatric" ? 10 : 0;
  score += driver.wheelchairCertified || !profile.requiresWheelchair ? 10 : 0;
  score += vehicle?.wheelchairAccessible || !profile.requiresWheelchair ? 8 : 0;
  score += vehicle?.hasBooster || !profile.requiresBooster ? 6 : 0;
  score += Math.round((provider?.onTimeRate ?? 0.8) * 10);
  score += Math.round(driver.onTimeRate * 8);
  score += Math.round((1 - Math.min(driver.complaintRate * 8, 1)) * 6);
  score += profile.preferredDrivers.includes(driver.id) ? 8 : 0;
  score -= warnings.length * 2;
  if (hardFails.length) score = Math.min(score, 45 - hardFails.length * 4);

  return {
    driver,
    vehicle,
    providerName: provider?.name ?? "Unknown provider",
    score: Math.max(0, Math.min(100, score)),
    available: hardFails.length === 0,
    hardFails,
    warnings,
    windowLabel: formatWindow(scheduledPickupISO, estimatedTripMinutes),
  };
}

function addOperationalHardRules(
  candidate: DriverCandidate,
  proposedRide: Pick<
    Ride,
    "pickupAddress" | "dropoffAddress" | "appointmentType" | "scheduledPickupISO"
  >,
  ridesToCheck: Ride[],
  estimatedTripMinutes: number,
): DriverCandidate {
  const assist = buildDispatchAssist({
    driverId: candidate.driver.id,
    proposedRide,
    existingRides: ridesToCheck,
    estimatedTripMinutes,
  });
  const hardFails = [...candidate.hardFails];
  const warnings = [...candidate.warnings];

  if (assist.gapTime.status === "Do not assign") hardFails.push(assist.gapTime.explanation);
  if (assist.radiusRule.overrideRequired) hardFails.push(assist.radiusRule.explanation);
  if (assist.gapTime.status === "Risky") warnings.push(assist.gapTime.explanation);

  const score = hardFails.length
    ? Math.min(candidate.score, Math.max(0, 45 - hardFails.length * 4))
    : candidate.score;

  return {
    ...candidate,
    hardFails,
    warnings,
    available: hardFails.length === 0,
    score,
  };
}

function externalSuitable(profile: DispatchProfile) {
  const blockers = [
    profile.ageGroup === "Pediatric",
    profile.requiresWheelchair,
    profile.requiresStretcher,
    profile.requiresBooster,
    profile.caregiverRequired,
    profile.sensorySupport === "High",
    profile.serviceAnimal,
    profile.requiredCertifications.length > 0,
    profile.requiredVehicleFeatures.length > 0,
  ];
  return !blockers.some(Boolean);
}

function pickExternalPartner(profile: DispatchProfile, appointmentType: string): ExternalPartner {
  if (profile.ageGroup === "Senior" || appointmentType.toLowerCase().includes("dialysis"))
    return "lyft";
  return "uber";
}

export function recommendAssignment({
  profile,
  scheduledPickupISO,
  appointmentType,
  pickupAddress,
  dropoffAddress,
  rides: ridesToCheck,
  selectedDriverId,
}: {
  profile: DispatchProfile;
  scheduledPickupISO: string;
  appointmentType: string;
  pickupAddress: string;
  dropoffAddress: string;
  rides: Ride[];
  selectedDriverId?: string;
}): DispatchRecommendation {
  const estimatedTripMinutes = estimateTripMinutes(profile, appointmentType);
  const proposedRide = {
    pickupAddress,
    dropoffAddress,
    appointmentType,
    scheduledPickupISO,
  };
  const candidates = drivers
    .map((driver) =>
      scoreCandidate(driver, profile, scheduledPickupISO, estimatedTripMinutes, ridesToCheck),
    )
    .map((candidate) =>
      addOperationalHardRules(candidate, proposedRide, ridesToCheck, estimatedTripMinutes),
    )
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return b.score - a.score;
    });

  const best = candidates.find((candidate) => candidate.available && candidate.score >= 70);
  const canUseExternal = externalSuitable(profile);
  const reviewedCandidate = selectedDriverId
    ? candidates.find((candidate) => candidate.driver.id === selectedDriverId)
    : undefined;
  const assistDriver = reviewedCandidate?.driver ?? best?.driver ?? candidates[0]?.driver;
  const assist = buildDispatchAssist({
    driverId: assistDriver?.id,
    proposedRide,
    existingRides: ridesToCheck,
    estimatedTripMinutes,
  });

  if (reviewedCandidate) {
    const selectedAllowed = reviewedCandidate.available;
    return {
      mode: selectedAllowed ? "internal_nemt" : "manual_review",
      title: selectedAllowed
        ? `Selected: ${reviewedCandidate.driver.name}`
        : `Selected driver blocked: ${reviewedCandidate.driver.name}`,
      confidence: reviewedCandidate.score,
      driver: reviewedCandidate.driver,
      vehicle: reviewedCandidate.vehicle,
      providerId: reviewedCandidate.driver.providerId,
      estimatedTripMinutes,
      scheduledPickupISO,
      reasons: selectedAllowed
        ? [
            `${reviewedCandidate.driver.name} passes hard rules with fit score ${reviewedCandidate.score}.`,
            `${reviewedCandidate.driver.name} is available during ${reviewedCandidate.windowLabel}.`,
            reviewedCandidate.vehicle
              ? `${reviewedCandidate.vehicle.plate} matches required vehicle needs.`
              : "Vehicle match pending.",
          ]
        : [
            `${reviewedCandidate.driver.name} cannot be assigned without a supervisor override.`,
            ...reviewedCandidate.hardFails.slice(0, 2),
          ],
      warnings: [...reviewedCandidate.hardFails, ...reviewedCandidate.warnings],
      candidates,
      assist,
      reviewedDriverId: reviewedCandidate.driver.id,
    };
  }

  if (best && (!canUseExternal || best.score >= 82)) {
    return {
      mode: "internal_nemt",
      title: `Assign ${best.driver.name}`,
      confidence: best.score,
      driver: best.driver,
      vehicle: best.vehicle,
      providerId: best.driver.providerId,
      estimatedTripMinutes,
      scheduledPickupISO,
      reasons: [
        `Best internal NEMT fit score is ${best.score}.`,
        `${best.driver.name} is available during ${best.windowLabel}.`,
        best.vehicle
          ? `${best.vehicle.plate} matches required vehicle needs.`
          : "Vehicle match pending.",
      ],
      warnings: best.warnings,
      candidates,
      assist,
      reviewedDriverId: best.driver.id,
    };
  }

  if (canUseExternal) {
    const externalPartner = pickExternalPartner(profile, appointmentType);
    return {
      mode: "external_tnc",
      title: `Use ${externalPartner === "lyft" ? "Lyft Concierge" : "Uber Health"}`,
      confidence: best ? Math.max(72, 86 - Math.max(0, best.score - 60)) : 86,
      providerId: "p-ext",
      externalPartner,
      estimatedTripMinutes,
      scheduledPickupISO,
      reasons: [
        "Rider profile is suitable for ambulatory TNC transport.",
        best
          ? `Internal best fit is only ${best.score}, so external ride is cleaner for capacity.`
          : "No internal NEMT driver is available without overbooking.",
        "External assignment should still feed ETA and trip status back into broker network monitoring.",
      ],
      warnings: [],
      candidates,
      assist,
    };
  }

  return {
    mode: "manual_review",
    title: "Manual broker review required",
    confidence: 50,
    providerId: best?.driver.providerId ?? "p1",
    estimatedTripMinutes,
    scheduledPickupISO,
    reasons: [
      "No driver can be assigned without a hard fail or schedule conflict.",
      "External Uber/Lyft-style ride is not suitable for this rider profile.",
      "Broker should resolve capacity, specialty vehicle, or certification gap before dispatch.",
    ],
    warnings: candidates.flatMap((c) => c.hardFails).slice(0, 4),
    candidates,
    assist,
  };
}

export function recommendForBooking(
  request: BookingRequest,
  ridesToCheck: Ride[],
  selectedDriverId?: string,
) {
  return recommendAssignment({
    profile: profileFromRegisteredRider(request.rider),
    scheduledPickupISO: new Date(
      `${request.appointmentDate}T${request.appointmentTime}:00`,
    ).toISOString(),
    appointmentType: request.appointmentType,
    pickupAddress: request.pickupAddress,
    dropoffAddress: request.dropoffAddress,
    rides: ridesToCheck,
    selectedDriverId,
  });
}

export function recommendForRide(
  ride: Ride,
  ridesToCheck: Ride[],
  registeredRiders: RegisteredRider[],
  selectedDriverId?: string,
) {
  const registered = registeredRiders.find((rider) => rider.id === ride.riderId);
  const profile = registered
    ? profileFromRegisteredRider(registered)
    : profileFromLegacyRideRider(ride.riderId);
  if (!profile) return null;

  return recommendAssignment({
    profile,
    scheduledPickupISO: ride.scheduledPickupISO,
    appointmentType: ride.appointmentType,
    pickupAddress: ride.pickupAddress,
    dropoffAddress: ride.dropoffAddress,
    rides: ridesToCheck.filter((candidate) => candidate.id !== ride.id),
    selectedDriverId,
  });
}
