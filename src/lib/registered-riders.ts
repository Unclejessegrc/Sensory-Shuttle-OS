// Registered Rider Management — data model + mock seed.
// NO real PHI. This module powers the OS-level rider source-of-truth used by
// dispatch, fit-score, caregiver visibility, incidents, and provider scorecards.

export type EligibilityStatus = "Active" | "Pending" | "Inactive" | "Needs Review";
export type AgeBand = "Pediatric" | "Adult" | "Senior";
export type SensorySupport = "Low" | "Medium" | "High";
export type MobilityNeed =
  | "Ambulatory"
  | "Walker"
  | "Wheelchair"
  | "Power Wheelchair"
  | "Stretcher"
  | "Booster Seat"
  | "Car Seat";

export type FundingSourceRR =
  | "Medicaid"
  | "Medicare"
  | "CHIP"
  | "Private Insurance"
  | "Private Pay"
  | "School District"
  | "Facility Contract"
  | "Other";

export interface RiderAuditEntry {
  id: string;
  ts: string;
  actor: string;
  role: string;
  action: string;
  riderId: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface BookingAgentNote {
  id: string;
  riderId: string;
  text: string;
  createdAt: string;
  createdByRole: string;
  relatedRideId?: string;
  relatedIncidentId?: string;
}

export interface RegisteredRider {
  // Identity
  id: string; // Rider ID (e.g. RR-1001)
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD (mock only)
  ageGroup: AgeBand;
  primaryLanguage: string;
  preferredCommunication: string;
  emergencyContact: string;
  caregiverContact: string;

  // Eligibility & funding
  fundingSource: FundingSourceRR;
  memberId: string; // placeholder — masked in UI
  planOrMco: string;
  eligibilityStatus: EligibilityStatus;
  authorizationRequired: boolean;
  authorizationExpires: string; // YYYY-MM-DD
  tripLimitsNotes: string;

  // Pickup / destination defaults
  homePickupAddress: string;
  alternatePickupAddress: string;
  commonDestinations: string[];
  primaryFacility: string;
  appointmentTypePreferences: string[];
  returnRideUsuallyNeeded: boolean;

  // Mobility & equipment
  mobilityNeeds: MobilityNeed[]; // primary + secondary
  serviceAnimal: boolean;
  caregiverSeatRequired: boolean;
  vehicleTypeRequired: string; // e.g. "WAV", "Sedan", "Stretcher Van"
  loadingTimeMinutes: number;
  boardingAssistanceNotes: string;

  // Sensory & behavioral
  sensorySupport: SensorySupport;
  quietRideRequired: boolean;
  noLoudMusic: boolean;
  noStrongScents: boolean;
  lowConversationPreferred: boolean;
  predictableCommunicationRequired: boolean;
  extraPickupPatienceRequired: boolean;
  motionSicknessRisk: boolean;
  knownTriggers: string[];
  calmingStrategies: string;
  deEscalationNotes: string;
  driverInstructions: string;

  // Safety & matching rules
  preferredDrivers: string[]; // driver ids
  blockedDrivers: string[]; // driver ids
  requiredDriverCertifications: string[]; // e.g. "Pediatric", "WAV", "Sensory"
  requiredVehicleFeatures: string[]; // e.g. "Booster", "Lift", "Quiet Cabin"
  hardFailRules: string[]; // human-readable
  softPreferenceRules: string[];
  notesForDispatcher: string;
  notesForDriver: string;
  adminOnlyNotes: string;

  // Operational rollups
  caregiverRequired: boolean;
  activeRidesCount: number;
  lastRideDate: string; // YYYY-MM-DD or ""
  riskFlags: string[]; // computed at seed time

  // Audit + lifecycle
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  audit: RiderAuditEntry[];
  bookingAgentNotes?: BookingAgentNote[];
}

export const MOBILITY_OPTIONS: MobilityNeed[] = [
  "Ambulatory",
  "Walker",
  "Wheelchair",
  "Power Wheelchair",
  "Stretcher",
  "Booster Seat",
  "Car Seat",
];
export const FUNDING_OPTIONS: FundingSourceRR[] = [
  "Medicaid",
  "Medicare",
  "CHIP",
  "Private Insurance",
  "Private Pay",
  "School District",
  "Facility Contract",
  "Other",
];
export const ELIGIBILITY_OPTIONS: EligibilityStatus[] = [
  "Active",
  "Pending",
  "Inactive",
  "Needs Review",
];
export const SENSORY_OPTIONS: SensorySupport[] = ["Low", "Medium", "High"];
export const AGE_OPTIONS: AgeBand[] = ["Pediatric", "Adult", "Senior"];
export const CERT_OPTIONS = [
  "Pediatric",
  "Sensory",
  "WAV",
  "Stretcher",
  "Behavioral De-escalation",
  "CPR/First Aid",
];
export const VEHICLE_FEATURES = [
  "Booster",
  "Car Seat",
  "Lift",
  "Ramp",
  "Quiet Cabin",
  "Stretcher",
  "High-Capacity",
];

function todayISO(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toISOString();
}
function dateStr(off = 0) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toISOString().slice(0, 10);
}

/** Compute risk/warning flags from a profile. UI uses this to render badges. */
export function computeRiskFlags(
  r: Pick<
    RegisteredRider,
    | "sensorySupport"
    | "mobilityNeeds"
    | "caregiverRequired"
    | "quietRideRequired"
    | "noStrongScents"
    | "noLoudMusic"
    | "motionSicknessRisk"
    | "predictableCommunicationRequired"
    | "extraPickupPatienceRequired"
    | "blockedDrivers"
    | "eligibilityStatus"
    | "authorizationExpires"
    | "authorizationRequired"
  >,
): string[] {
  const flags: string[] = [];
  if (r.sensorySupport === "High") flags.push("High Sensory");
  if (r.mobilityNeeds.some((m) => m === "Wheelchair" || m === "Power Wheelchair"))
    flags.push("WAV Required");
  if (r.mobilityNeeds.includes("Booster Seat") || r.mobilityNeeds.includes("Car Seat"))
    flags.push("Booster Required");
  if (r.caregiverRequired) flags.push("Caregiver Required");
  if (r.quietRideRequired) flags.push("Quiet Ride");
  if (r.noStrongScents) flags.push("No Strong Scents");
  if (r.noLoudMusic) flags.push("No Loud Music");
  if (r.motionSicknessRisk) flags.push("Motion Sickness Risk");
  if (r.predictableCommunicationRequired) flags.push("Predictable Communication");
  if (r.extraPickupPatienceRequired) flags.push("Extra Pickup Patience");
  if (r.blockedDrivers.length) flags.push("Blocked Driver On File");
  if (r.eligibilityStatus === "Needs Review" || r.eligibilityStatus === "Pending")
    flags.push("Eligibility Needs Review");
  if (r.authorizationRequired && r.authorizationExpires) {
    const days = Math.round(
      (new Date(r.authorizationExpires).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (days <= 14) flags.push(days < 0 ? "Authorization Expired" : "Authorization Expiring Soon");
  }
  return flags;
}

/**
 * Generate a rider-specific reason for why a particular flag was applied.
 * Used by the flag-explanation popover on the registered-riders directory
 * and profile pages — surfaces the exact profile fact that triggered the flag.
 */
export function flagReason(
  rider: Pick<
    RegisteredRider,
    | "firstName"
    | "lastName"
    | "sensorySupport"
    | "mobilityNeeds"
    | "caregiverRequired"
    | "quietRideRequired"
    | "noStrongScents"
    | "noLoudMusic"
    | "motionSicknessRisk"
    | "predictableCommunicationRequired"
    | "extraPickupPatienceRequired"
    | "blockedDrivers"
    | "knownTriggers"
    | "eligibilityStatus"
    | "authorizationRequired"
    | "authorizationExpires"
  >,
  flag: string,
): string {
  const name = `${rider.firstName} ${rider.lastName}`;
  switch (flag) {
    case "High Sensory":
      return `${name}'s profile lists sensory support level "High". Known triggers on file: ${rider.knownTriggers.join(", ") || "none recorded"}.`;
    case "WAV Required":
      return `${name} uses a ${rider.mobilityNeeds.includes("Power Wheelchair") ? "power wheelchair" : "wheelchair"}, so dispatch must assign a wheelchair-accessible vehicle (WAV) with lift or ramp.`;
    case "Booster Required":
      return `${name}'s mobility needs include ${rider.mobilityNeeds.includes("Car Seat") ? "a car seat" : "a booster seat"}. Vehicle must have the seat installed before pickup.`;
    case "Caregiver Required":
      return `${name}'s profile requires a caregiver to attend the ride. Dispatch should confirm caregiver availability before assigning.`;
    case "Quiet Ride":
      return `${name} needs a low-stimulation trip. Radio and unnecessary conversation should be off during the ride.`;
    case "No Strong Scents":
      return `${name} reacts to strong smells. Vehicle must be free of air fresheners, perfume, smoke, and cleaning odors.`;
    case "No Loud Music":
      return `${name} has loud music listed as a trigger. Music and phone audio should be off or kept at an agreed level.`;
    case "Motion Sickness Risk":
      return `${name} is at risk of motion sickness. Driver should brake smoothly and avoid sudden lane changes.`;
    case "Predictable Communication":
      return `${name} does best with short, predictable phrases. Avoid surprises or rapid instructions during pickup.`;
    case "Extra Pickup Patience":
      return `${name} may need extra time to transition into the vehicle. Driver must not mark no-show early.`;
    case "Blocked Driver On File":
      return `${name} has ${rider.blockedDrivers.length} driver${rider.blockedDrivers.length > 1 ? "s" : ""} blocked (${rider.blockedDrivers.join(", ")}). Dispatch must not assign these drivers without program supervisor review.`;
    case "Eligibility Needs Review":
      return `${name}'s eligibility status is "${rider.eligibilityStatus}". Coordination staff must verify coverage before dispatch.`;
    case "Authorization Expiring Soon": {
      const days = rider.authorizationExpires
        ? Math.round(
            (new Date(rider.authorizationExpires).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
        : 0;
      return `${name}'s transportation authorization expires ${rider.authorizationExpires} (in ${days} day${days === 1 ? "" : "s"}). Confirm renewal before booking future trips.`;
    }
    case "Authorization Expired":
      return `${name}'s transportation authorization expired on ${rider.authorizationExpires}. Do not dispatch until renewed or manually reviewed by a supervisor.`;
    default:
      return `${name}'s profile triggered this flag. Open the full profile for details.`;
  }
}

function seed(
  r: Omit<RegisteredRider, "riskFlags" | "createdAt" | "updatedAt" | "audit" | "archived">,
): RegisteredRider {
  const base: RegisteredRider = {
    ...r,
    archived: false,
    createdAt: todayISO(-30),
    updatedAt: todayISO(-2),
    audit: [
      {
        id: `RA-${r.id}-1`,
        ts: todayISO(-30),
        actor: "admin@network-demo",
        role: "broker_admin",
        action: "rider.created",
        riderId: r.id,
        field: "*",
        oldValue: "—",
        newValue: "profile created",
      },
    ],
    bookingAgentNotes: [],
    riskFlags: [],
  };
  base.riskFlags = computeRiskFlags(base);
  return base;
}

export const initialRegisteredRiders: RegisteredRider[] = [
  // 1. Pediatric, high sensory, caregiver required
  seed({
    id: "RR-1001",
    firstName: "Avery",
    lastName: "K.",
    dob: "2016-04-12",
    ageGroup: "Pediatric",
    primaryLanguage: "English",
    preferredCommunication: "Short, predictable phrases. Visual cues OK.",
    emergencyContact: "Caregiver — on file",
    caregiverContact: "Parent — (555) 010-1001",
    fundingSource: "Medicaid",
    memberId: "•••• 4421",
    planOrMco: "Sunrise MCO",
    eligibilityStatus: "Active",
    authorizationRequired: true,
    authorizationExpires: dateStr(60),
    tripLimitsNotes: "12 trips/mo cap",
    homePickupAddress: "412 Maple St",
    alternatePickupAddress: "After-school program — 88 Cedar Ave",
    commonDestinations: ["Children's Therapy Center", "Riverside Pediatrics"],
    primaryFacility: "Children's Therapy Center",
    appointmentTypePreferences: ["Therapy", "Pediatric checkup"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Ambulatory", "Booster Seat"],
    serviceAnimal: false,
    caregiverSeatRequired: true,
    vehicleTypeRequired: "Sedan or Minivan",
    loadingTimeMinutes: 5,
    boardingAssistanceNotes: "Parent walks rider out. Allow 3–5 min.",
    sensorySupport: "High",
    quietRideRequired: true,
    noLoudMusic: true,
    noStrongScents: true,
    lowConversationPreferred: true,
    predictableCommunicationRequired: true,
    extraPickupPatienceRequired: true,
    motionSicknessRisk: true,
    knownTriggers: ["Sudden loud noises", "Strong perfumes", "Honking"],
    calmingStrategies: "Offer noise-canceling headphones from caregiver bag.",
    deEscalationNotes: "Use calm low voice. Avoid touching shoulder.",
    driverInstructions: "Park in shaded spot. Caregiver brings rider out.",
    preferredDrivers: ["d1", "d2"],
    blockedDrivers: ["d5"],
    requiredDriverCertifications: ["Pediatric", "Sensory"],
    requiredVehicleFeatures: ["Booster", "Quiet Cabin"],
    hardFailRules: [
      "Booster seat required",
      "Sensory-trained driver required",
      "Driver d5 blocked",
    ],
    softPreferenceRules: ["Prefer driver d1 or d2", "Prefer Lighthouse Mobility"],
    notesForDispatcher: "Confirm caregiver availability before dispatch.",
    notesForDriver: "No air freshener. No radio.",
    adminOnlyNotes: "Recent escalation incident on 2024-11 — see INC-501.",
    caregiverRequired: true,
    activeRidesCount: 2,
    lastRideDate: dateStr(-1),
  }),

  // 2. Senior, wheelchair
  seed({
    id: "RR-1002",
    firstName: "Harold",
    lastName: "Davies",
    dob: "1948-09-03",
    ageGroup: "Senior",
    primaryLanguage: "English",
    preferredCommunication: "Speak clearly; mild hearing loss.",
    emergencyContact: "Daughter — (555) 010-2002",
    caregiverContact: "Daughter — (555) 010-2002",
    fundingSource: "Medicare",
    memberId: "•••• 8821",
    planOrMco: "Medicare Advantage — Bluepine",
    eligibilityStatus: "Active",
    authorizationRequired: false,
    authorizationExpires: "",
    tripLimitsNotes: "Standing dialysis schedule",
    homePickupAddress: "88 Oak Ridge",
    alternatePickupAddress: "",
    commonDestinations: ["Riverside Dialysis"],
    primaryFacility: "Riverside Dialysis",
    appointmentTypePreferences: ["Dialysis"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Wheelchair"],
    serviceAnimal: false,
    caregiverSeatRequired: false,
    vehicleTypeRequired: "WAV (wheelchair-accessible van)",
    loadingTimeMinutes: 8,
    boardingAssistanceNotes: "Ramp required. Staff greets at front lobby.",
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
    driverInstructions: "Wheelchair ramp. Greet at senior-center lobby.",
    preferredDrivers: [],
    blockedDrivers: [],
    requiredDriverCertifications: ["WAV"],
    requiredVehicleFeatures: ["Lift", "Ramp"],
    hardFailRules: ["WAV vehicle required", "WAV-certified driver required"],
    softPreferenceRules: ["Prefer providers with on-time rate ≥ 0.9"],
    notesForDispatcher: "Missing dialysis = clinical risk. Treat as priority.",
    notesForDriver: "Help transfer at lobby; do not lift unaided.",
    adminOnlyNotes: "",
    caregiverRequired: false,
    activeRidesCount: 3,
    lastRideDate: dateStr(0),
  }),

  // 3. Adult walker
  seed({
    id: "RR-1003",
    firstName: "Marisol",
    lastName: "Cano",
    dob: "1972-02-18",
    ageGroup: "Adult",
    primaryLanguage: "Spanish",
    preferredCommunication: "Spanish preferred; basic English OK.",
    emergencyContact: "Husband — (555) 010-3003",
    caregiverContact: "—",
    fundingSource: "Medicaid",
    memberId: "•••• 5102",
    planOrMco: "Sunrise MCO",
    eligibilityStatus: "Active",
    authorizationRequired: true,
    authorizationExpires: dateStr(120),
    tripLimitsNotes: "",
    homePickupAddress: "1402 Pine Ave",
    alternatePickupAddress: "",
    commonDestinations: ["Westside Specialty Clinic"],
    primaryFacility: "Westside Specialty Clinic",
    appointmentTypePreferences: ["Specialist visit", "Lab work"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Walker"],
    serviceAnimal: false,
    caregiverSeatRequired: false,
    vehicleTypeRequired: "Sedan or Minivan",
    loadingTimeMinutes: 4,
    boardingAssistanceNotes: "Folding walker into trunk.",
    sensorySupport: "Low",
    quietRideRequired: false,
    noLoudMusic: false,
    noStrongScents: true,
    lowConversationPreferred: false,
    predictableCommunicationRequired: false,
    extraPickupPatienceRequired: false,
    motionSicknessRisk: false,
    knownTriggers: ["Strong fragrance"],
    calmingStrategies: "",
    deEscalationNotes: "",
    driverInstructions: "Help with walker into clinic.",
    preferredDrivers: [],
    blockedDrivers: [],
    requiredDriverCertifications: [],
    requiredVehicleFeatures: [],
    hardFailRules: [],
    softPreferenceRules: ["Spanish-speaking driver preferred"],
    notesForDispatcher: "",
    notesForDriver: "Walker folds into trunk.",
    adminOnlyNotes: "",
    caregiverRequired: false,
    activeRidesCount: 1,
    lastRideDate: dateStr(-3),
  }),

  // 4. Adult, motion sickness + quiet ride
  seed({
    id: "RR-1004",
    firstName: "Devon",
    lastName: "Patel",
    dob: "1990-06-22",
    ageGroup: "Adult",
    primaryLanguage: "English",
    preferredCommunication: "Minimal small talk; texts OK.",
    emergencyContact: "Sister — (555) 010-4004",
    caregiverContact: "—",
    fundingSource: "Private Insurance",
    memberId: "•••• 7740",
    planOrMco: "Anthem PPO",
    eligibilityStatus: "Active",
    authorizationRequired: false,
    authorizationExpires: "",
    tripLimitsNotes: "",
    homePickupAddress: "230 Birch Ln",
    alternatePickupAddress: "Office — 99 Market St",
    commonDestinations: ["Downtown Imaging", "Behavioral Health Group"],
    primaryFacility: "Behavioral Health Group",
    appointmentTypePreferences: ["Behavioral health", "Imaging"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Ambulatory"],
    serviceAnimal: false,
    caregiverSeatRequired: false,
    vehicleTypeRequired: "Sedan",
    loadingTimeMinutes: 2,
    boardingAssistanceNotes: "",
    sensorySupport: "Medium",
    quietRideRequired: true,
    noLoudMusic: true,
    noStrongScents: true,
    lowConversationPreferred: true,
    predictableCommunicationRequired: true,
    extraPickupPatienceRequired: false,
    motionSicknessRisk: true,
    knownTriggers: ["Aggressive driving", "Strong air freshener"],
    calmingStrategies: "Window cracked open helps.",
    deEscalationNotes: "",
    driverInstructions: "Smooth braking. Avoid scented cabin fresheners.",
    preferredDrivers: ["d2"],
    blockedDrivers: [],
    requiredDriverCertifications: [],
    requiredVehicleFeatures: ["Quiet Cabin"],
    hardFailRules: [],
    softPreferenceRules: ["Quiet cabin preferred", "Driver d2 preferred"],
    notesForDispatcher: "Will silently cancel after 10 min wait.",
    notesForDriver: "Don't initiate conversation.",
    adminOnlyNotes: "",
    caregiverRequired: false,
    activeRidesCount: 1,
    lastRideDate: dateStr(-5),
  }),

  // 5. Eligibility pending
  seed({
    id: "RR-1005",
    firstName: "Lillian",
    lastName: "Ortega",
    dob: "1955-11-30",
    ageGroup: "Senior",
    primaryLanguage: "English",
    preferredCommunication: "Friendly; enjoys chatting.",
    emergencyContact: "Niece — (555) 010-5005",
    caregiverContact: "—",
    fundingSource: "Medicaid",
    memberId: "•••• 9931",
    planOrMco: "Pending assignment",
    eligibilityStatus: "Pending",
    authorizationRequired: true,
    authorizationExpires: dateStr(7),
    tripLimitsNotes: "Awaiting MCO confirmation",
    homePickupAddress: "77 Cedar Ct",
    alternatePickupAddress: "",
    commonDestinations: ["Westside Specialty Clinic"],
    primaryFacility: "Westside Specialty Clinic",
    appointmentTypePreferences: ["Specialist visit"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Ambulatory", "Walker"],
    serviceAnimal: false,
    caregiverSeatRequired: false,
    vehicleTypeRequired: "Sedan or Minivan",
    loadingTimeMinutes: 4,
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
    driverInstructions: "Standard pickup.",
    preferredDrivers: [],
    blockedDrivers: [],
    requiredDriverCertifications: [],
    requiredVehicleFeatures: [],
    hardFailRules: ["Eligibility must be Active before dispatch"],
    softPreferenceRules: [],
    notesForDispatcher: "Do not dispatch until eligibility flips to Active.",
    notesForDriver: "",
    adminOnlyNotes: "",
    caregiverRequired: false,
    activeRidesCount: 0,
    lastRideDate: "",
  }),

  // 6. Blocked driver + prior incident history
  seed({
    id: "RR-1006",
    firstName: "Sasha",
    lastName: "M.",
    dob: "2008-03-09",
    ageGroup: "Pediatric",
    primaryLanguage: "English",
    preferredCommunication: "Speak directly; teen prefers honesty.",
    emergencyContact: "Parent — (555) 010-6006",
    caregiverContact: "Parent — (555) 010-6006",
    fundingSource: "CHIP",
    memberId: "•••• 3318",
    planOrMco: "CHIP — Statewide",
    eligibilityStatus: "Active",
    authorizationRequired: true,
    authorizationExpires: dateStr(45),
    tripLimitsNotes: "8 trips/mo",
    homePickupAddress: "1207 Birch Ln",
    alternatePickupAddress: "",
    commonDestinations: ["Westside Behavioral Health", "Northgate High School"],
    primaryFacility: "Westside Behavioral Health",
    appointmentTypePreferences: ["Behavioral health", "School transport"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Walker"],
    serviceAnimal: false,
    caregiverSeatRequired: true,
    vehicleTypeRequired: "Minivan",
    loadingTimeMinutes: 5,
    boardingAssistanceNotes: "Walker folds into trunk.",
    sensorySupport: "Medium",
    quietRideRequired: true,
    noLoudMusic: true,
    noStrongScents: true,
    lowConversationPreferred: true,
    predictableCommunicationRequired: true,
    extraPickupPatienceRequired: true,
    motionSicknessRisk: true,
    knownTriggers: ["Air freshener", "Bright sun in eyes"],
    calmingStrategies: "Allow 2 min to settle in before moving.",
    deEscalationNotes: "Don't initiate conversation. Acknowledge briefly.",
    driverInstructions: "Caregiver rides up front. No air freshener.",
    preferredDrivers: ["d2"],
    blockedDrivers: ["d3", "d5"],
    requiredDriverCertifications: ["Behavioral De-escalation"],
    requiredVehicleFeatures: ["Quiet Cabin"],
    hardFailRules: ["Drivers d3 and d5 blocked", "Quiet cabin required"],
    softPreferenceRules: ["Driver d2 strongly preferred"],
    notesForDispatcher: "Prior INC-501 with driver d5 — sensory ignored.",
    notesForDriver: "No radio. Caregiver speaks for rider on bad days.",
    adminOnlyNotes: "Family considering switching transportation programs - retention risk.",
    caregiverRequired: true,
    activeRidesCount: 2,
    lastRideDate: dateStr(-1),
  }),

  // 7. Pediatric, out-of-district program, high sensory transition support
  seed({
    id: "RR-1007",
    firstName: "Milo",
    lastName: "R.",
    dob: "2018-01-26",
    ageGroup: "Pediatric",
    primaryLanguage: "English",
    preferredCommunication: "First/then language with a visual schedule preview.",
    emergencyContact: "Parent - (555) 010-7007",
    caregiverContact: "Parent - (555) 010-7007",
    fundingSource: "School District",
    memberId: "DIST-IEP-1007",
    planOrMco: "Fictional district pilot",
    eligibilityStatus: "Active",
    authorizationRequired: true,
    authorizationExpires: dateStr(75),
    tripLimitsNotes: "IEP transportation support - pilot-planning example only",
    homePickupAddress: "26 Pawtucket Ave",
    alternatePickupAddress: "Grandparent pickup - 14 Garden St",
    commonDestinations: ["Out-of-district learning program", "Autism therapy center"],
    primaryFacility: "Out-of-district learning program",
    appointmentTypePreferences: ["Out-of-district program", "Autism therapy center"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Ambulatory", "Car Seat"],
    serviceAnimal: false,
    caregiverSeatRequired: true,
    vehicleTypeRequired: "Minivan",
    loadingTimeMinutes: 8,
    boardingAssistanceNotes:
      "Visual schedule helpful before entering vehicle. Confirm handoff with named adult.",
    sensorySupport: "High",
    quietRideRequired: true,
    noLoudMusic: true,
    noStrongScents: true,
    lowConversationPreferred: true,
    predictableCommunicationRequired: true,
    extraPickupPatienceRequired: true,
    motionSicknessRisk: false,
    knownTriggers: [
      "Unexpected route changes",
      "Extra passengers",
      "Harsh braking",
      "Loud greetings",
    ],
    calmingStrategies:
      "Offer visual schedule, then wait quietly. Parent provides small sensory item.",
    deEscalationNotes: "Use calm voice. Do not rush transition. Avoid sudden door opening.",
    driverInstructions:
      "No extra passengers. Calm voice required. Confirm car seat and handoff adult before moving.",
    preferredDrivers: ["d6", "d12"],
    blockedDrivers: ["d3"],
    requiredDriverCertifications: ["Pediatric", "Sensory", "CPR/First Aid"],
    requiredVehicleFeatures: ["Car Seat", "Quiet Cabin"],
    hardFailRules: [
      "Car seat required",
      "No overcrowding or unrelated shared riders",
      "Driver d3 blocked",
      "Sensory-trained pediatric driver required",
    ],
    softPreferenceRules: ["Familiar driver preferred", "Avoid route changes when possible"],
    notesForDispatcher:
      "Confirm parent handoff and out-of-district program arrival window before assignment.",
    notesForDriver: "Use first/then language. Avoid harsh braking. No radio or strong scents.",
    adminOnlyNotes:
      "Fictional school-district pilot profile for IEP-aligned transportation planning.",
    caregiverRequired: true,
    activeRidesCount: 1,
    lastRideDate: dateStr(-2),
  }),

  // 8. Pediatric clinic pilot, speech/OT appointments, familiar driver preferred
  seed({
    id: "RR-1008",
    firstName: "Juniper",
    lastName: "T.",
    dob: "2014-10-08",
    ageGroup: "Pediatric",
    primaryLanguage: "English",
    preferredCommunication: "Low conversation. Confirm each transition before it happens.",
    emergencyContact: "Caregiver - (555) 010-8008",
    caregiverContact: "Caregiver - (555) 010-8008",
    fundingSource: "Private Pay",
    memberId: "PRIVATE-DEMO-1008",
    planOrMco: "Family-funded pilot example",
    eligibilityStatus: "Needs Review",
    authorizationRequired: false,
    authorizationExpires: "",
    tripLimitsNotes:
      "Family-funded example. Reimbursement questions require tax, benefits, medical, and legal guidance.",
    homePickupAddress: "9 Cranston Rd",
    alternatePickupAddress: "School nurse office - 44 Hope St",
    commonDestinations: ["Speech therapy clinic", "Occupational therapy center"],
    primaryFacility: "Speech therapy clinic",
    appointmentTypePreferences: ["Speech therapy", "Occupational therapy"],
    returnRideUsuallyNeeded: true,
    mobilityNeeds: ["Ambulatory", "Booster Seat"],
    serviceAnimal: false,
    caregiverSeatRequired: false,
    vehicleTypeRequired: "Sedan or Minivan",
    loadingTimeMinutes: 6,
    boardingAssistanceNotes:
      "May pause at vehicle door. Driver should wait and avoid repeated prompts.",
    sensorySupport: "High",
    quietRideRequired: true,
    noLoudMusic: true,
    noStrongScents: true,
    lowConversationPreferred: true,
    predictableCommunicationRequired: true,
    extraPickupPatienceRequired: true,
    motionSicknessRisk: true,
    knownTriggers: ["Strong cleaner smell", "Rapid questions", "Stop-and-go driving"],
    calmingStrategies: "Caregiver sends visual checklist. Smooth driving reduces nausea.",
    deEscalationNotes: "Offer one clear choice at a time. Do not touch backpack or headphones.",
    driverInstructions:
      "Booster required. Avoid harsh braking. Keep conversation minimal and predictable.",
    preferredDrivers: ["d1", "d9"],
    blockedDrivers: ["d5"],
    requiredDriverCertifications: ["Pediatric", "Sensory"],
    requiredVehicleFeatures: ["Booster", "Quiet Cabin"],
    hardFailRules: [
      "Booster seat required",
      "Sensory-trained driver required",
      "Driver d5 blocked",
      "Avoid extra passengers unless caregiver approves",
    ],
    softPreferenceRules: ["Familiar driver strongly preferred", "Smooth driving required"],
    notesForDispatcher: "Clinic arrival window is tight; late arrival may disrupt therapy session.",
    notesForDriver: "No air freshener. Smooth braking. Visual checklist may be used at pickup.",
    adminOnlyNotes:
      "Fictional family-funded concierge example; not a reimbursement or benefits claim.",
    caregiverRequired: false,
    activeRidesCount: 1,
    lastRideDate: dateStr(-4),
  }),
];

/** Fit-Score-style hard fails using a registered rider profile. UI helper. */
export function evaluateRegisteredRiderHardFails(
  rider: RegisteredRider,
  ctx: {
    driverId?: string;
    driverCerts?: string[];
    vehicleFeatures?: string[];
    vehicleCapacity?: number;
    eligibilityOverride?: EligibilityStatus;
  },
): string[] {
  const fails: string[] = [];
  const elig = ctx.eligibilityOverride ?? rider.eligibilityStatus;
  if (elig !== "Active") fails.push(`Eligibility is ${elig} — must be Active to dispatch.`);

  if (ctx.driverId && rider.blockedDrivers.includes(ctx.driverId))
    fails.push("Driver is on the rider's blocked list.");

  if (
    rider.mobilityNeeds.includes("Wheelchair") ||
    rider.mobilityNeeds.includes("Power Wheelchair")
  ) {
    if (!(ctx.vehicleFeatures ?? []).some((f) => f === "Lift" || f === "Ramp"))
      fails.push("Wheelchair rider requires WAV (lift or ramp).");
  }
  if (
    rider.mobilityNeeds.includes("Stretcher") &&
    !(ctx.vehicleFeatures ?? []).includes("Stretcher")
  )
    fails.push("Stretcher required but vehicle lacks stretcher capability.");
  if (
    (rider.mobilityNeeds.includes("Booster Seat") || rider.mobilityNeeds.includes("Car Seat")) &&
    !(ctx.vehicleFeatures ?? []).some((f) => f === "Booster" || f === "Car Seat")
  )
    fails.push("Booster/car seat required but unavailable in vehicle.");

  if (rider.sensorySupport === "High" && !(ctx.driverCerts ?? []).includes("Sensory"))
    fails.push("High sensory rider requires a sensory-trained driver.");

  for (const cert of rider.requiredDriverCertifications) {
    if (!(ctx.driverCerts ?? []).includes(cert))
      fails.push(`Required driver certification missing: ${cert}.`);
  }
  if (rider.caregiverRequired && (ctx.vehicleCapacity ?? 99) < 3)
    fails.push("Caregiver required but vehicle capacity too low.");
  return fails;
}
