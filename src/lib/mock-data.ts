// Mock data for Sensory Shuttle OS. NO real PHI — fictional only.
export type Role =
  | "dispatcher"
  | "driver"
  | "caregiver"
  | "provider_admin"
  | "broker_admin"
  | "facility_viewer"
  | "system_admin";

export const ROLES: { id: Role; label: string; description: string }[] = [
  {
    id: "broker_admin",
    label: "Transportation Broker Administrator",
    description:
      "Network operations view across providers, active trips, GPS, incidents, audit logs, and performance.",
  },
  {
    id: "dispatcher",
    label: "Member Services / Ride Booking Agent",
    description:
      "Ride booking desk for scheduling rides, checking trip status, supporting caregivers, and handling issues.",
  },
  {
    id: "provider_admin",
    label: "Transportation Provider Administrator",
    description:
      "Provider operations view for assigned drivers, rides, vehicle readiness, GPS compliance, and scorecard.",
  },
  { id: "driver", label: "Driver", description: "Assigned rides only, GPS lock, route checklist." },
  {
    id: "caregiver",
    label: "Rider / Caregiver",
    description: "Own ride booking, driver ETA, day-of tracking, and support actions.",
  },
  {
    id: "facility_viewer",
    label: "Facility / Care Team Viewer",
    description: "Read-only appointment transportation status for care partners.",
  },
  {
    id: "system_admin",
    label: "Health Plan / Payer Administrator",
    description:
      "Payer oversight for transportation performance, member access risk, compliance issues, and cost-driving failure points.",
  },
];

export interface Rider {
  id: string;
  name: string;
  ageGroup: "child" | "teen" | "adult" | "senior";
  caregiverRequired: boolean;
  mobilityLevel: "independent" | "assisted" | "wheelchair";
  wheelchairRequired: boolean;
  walkerRequired: boolean;
  boosterSeatRequired: boolean;
  sensorySensitivity: "low" | "medium" | "high";
  motionSicknessRisk: boolean;
  needsQuietRide: boolean;
  noStrongScents: boolean;
  noLoudMusic: boolean;
  needsPredictableCommunication: boolean;
  extraPickupPatience: boolean;
  preferredDrivers: string[];
  blockedDrivers: string[];
  triggers: string[];
  deEscalationNotes: string;
  driverInstructions: string;
  fundingSource: string;
  emergencyContact: string;
}

export interface Driver {
  id: string;
  name: string;
  sensoryTrained: boolean;
  pediatricCertified: boolean;
  wheelchairCertified: boolean;
  rating: number;
  onTimeRate: number;
  complaintRate: number;
  providerId: string;
}

export interface DriverTelemetry {
  driverId: string;
  currentRideId?: string;
  lat: number;
  lng: number;
  heading: number;
  speedMph: number;
  speedLimitMph: number;
  gpsLastUpdateISO: string;
  gpsLastUpdateMin: number;
  gpsPermission: "accepted" | "pending" | "denied";
  gpsLocked: boolean;
  deviceStatus: "live" | "stale" | "offline";
  locationSource: "driver_app" | "vehicle_device";
}

export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  wheelchairAccessible: boolean;
  hasBooster: boolean;
  features: string[];
  providerId: string;
}

export interface Provider {
  id: string;
  name: string;
  tier: "Gold" | "Standard" | "Watch List";
  completedRides: number;
  onTimeRate: number;
  complaintRate: number;
  canceledRides: number;
  disputedNoShows: number;
  staleGpsEvents: number;
  etaAccuracy: number;
  riderSatisfaction: number;
  sensoryFailureRate: number;
  highSensitivitySuccessRate: number;
}

export type RideStatus =
  | "scheduled"
  | "en_route_pickup"
  | "arrived_pickup"
  | "in_transit"
  | "completed"
  | "no_show"
  | "canceled";

export type EtaConfidence = "high" | "medium" | "low";

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  vehicleId?: string;
  providerId: string;
  assignmentMode?: "internal_nemt" | "external_tnc" | "manual_review";
  externalPartner?: "lyft" | "uber";
  assignmentConfidence?: number;
  dispatchRecommendation?: string[];
  estimatedTripMinutes?: number;
  pickupAddress: string;
  dropoffAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  returnRideNeeded: boolean;
  caregiverAttending: boolean;
  specialInstructions: string;
  fundingSource: string;
  status: RideStatus;
  etaConfidence: EtaConfidence;
  etaReasons: string[];
  gpsLastUpdateMin: number; // minutes since last ping
  driverMoving: boolean;
  scheduledPickupISO: string;
  insurance?: InsuranceDetails;
}

export interface Incident {
  id: string;
  rideId: string;
  riderId: string;
  driverId?: string;
  providerId: string;
  issueType: string;
  reporterStatement: string;
  status: "open" | "investigating" | "resolved";
  filedAt: string;
}

export interface AuditLog {
  id: string;
  ts: string;
  actor: string;
  action: string;
  entityId: string;
  details: string;
}

export const ISSUE_TYPES = [
  "Driver late",
  "Driver never arrived",
  "Driver location inaccurate",
  "False no show",
  "Wrong vehicle type",
  "Unsafe driving",
  "Sensory accommodation ignored",
  "Vehicle smelled like smoke",
  "Loud music",
  "Caregiver issue",
  "Other",
];

export const FUNDING_SOURCES = ["Medicaid", "MCO", "Private Pay", "School District", "VA"];

export const APPOINTMENT_TYPES = [
  "Therapy",
  "Medical",
  "Adult Daycare",
  "Behavioral Health",
  "Counselor",
  "Psychologist",
  "Social Worker",
  "Day Treatment Program",
  "Dental Services",
  "Dialysis",
  "Drug Rehabilitation",
  "Extended Pediatric Center",
  "Non-Medical Trip",
  "Occupational Therapy",
  "Pain Management",
  "Physical Therapy",
  "Primary Care Physician or Specialist",
  "Pediatric checkup",
  "Imaging",
  "Lab work",
  "School transport",
  "Speech Therapy",
  "Other",
];

export const INSURANCE_TYPES = [
  "Medicaid",
  "Medicare",
  "Private Insurance",
  "CHIP",
  "Self-pay",
  "VA Benefits",
  "Other",
];

export interface InsuranceDetails {
  insuranceType: string;
  companyName: string;
  memberId: string;
  groupNumber: string;
  policyHolderName: string;
  authorizationNumber: string;
}

export const providers: Provider[] = [
  {
    id: "p1",
    name: "Lighthouse Mobility",
    tier: "Gold",
    completedRides: 1284,
    onTimeRate: 0.96,
    complaintRate: 0.012,
    canceledRides: 14,
    disputedNoShows: 3,
    staleGpsEvents: 6,
    etaAccuracy: 0.94,
    riderSatisfaction: 4.8,
    sensoryFailureRate: 0.02,
    highSensitivitySuccessRate: 0.95,
  },
  {
    id: "p2",
    name: "Cedar Valley Transit",
    tier: "Standard",
    completedRides: 942,
    onTimeRate: 0.88,
    complaintRate: 0.041,
    canceledRides: 31,
    disputedNoShows: 8,
    staleGpsEvents: 22,
    etaAccuracy: 0.81,
    riderSatisfaction: 4.2,
    sensoryFailureRate: 0.07,
    highSensitivitySuccessRate: 0.81,
  },
  {
    id: "p3",
    name: "Northwind NEMT",
    tier: "Watch List",
    completedRides: 612,
    onTimeRate: 0.74,
    complaintRate: 0.092,
    canceledRides: 58,
    disputedNoShows: 19,
    staleGpsEvents: 47,
    etaAccuracy: 0.62,
    riderSatisfaction: 3.6,
    sensoryFailureRate: 0.18,
    highSensitivitySuccessRate: 0.58,
  },
  {
    id: "p-ext",
    name: "External TNC Network",
    tier: "Standard",
    completedRides: 218,
    onTimeRate: 0.9,
    complaintRate: 0.025,
    canceledRides: 9,
    disputedNoShows: 2,
    staleGpsEvents: 3,
    etaAccuracy: 0.88,
    riderSatisfaction: 4.4,
    sensoryFailureRate: 0.03,
    highSensitivitySuccessRate: 0.72,
  },
];

export const drivers: Driver[] = [
  {
    id: "d1",
    name: "Marcus Hale",
    sensoryTrained: true,
    pediatricCertified: true,
    wheelchairCertified: true,
    rating: 4.9,
    onTimeRate: 0.97,
    complaintRate: 0.005,
    providerId: "p1",
  },
  {
    id: "d2",
    name: "Priya Anand",
    sensoryTrained: true,
    pediatricCertified: true,
    wheelchairCertified: false,
    rating: 4.8,
    onTimeRate: 0.95,
    complaintRate: 0.01,
    providerId: "p1",
  },
  {
    id: "d3",
    name: "Tomas Reyes",
    sensoryTrained: false,
    pediatricCertified: false,
    wheelchairCertified: true,
    rating: 4.4,
    onTimeRate: 0.89,
    complaintRate: 0.03,
    providerId: "p2",
  },
  {
    id: "d4",
    name: "Janelle Brooks",
    sensoryTrained: true,
    pediatricCertified: false,
    wheelchairCertified: true,
    rating: 4.6,
    onTimeRate: 0.91,
    complaintRate: 0.018,
    providerId: "p2",
  },
  {
    id: "d5",
    name: "Ray Okafor",
    sensoryTrained: false,
    pediatricCertified: false,
    wheelchairCertified: false,
    rating: 3.7,
    onTimeRate: 0.72,
    complaintRate: 0.11,
    providerId: "p3",
  },
];

export const initialDriverTelemetry: DriverTelemetry[] = [
  {
    driverId: "d1",
    currentRideId: "RD-1001",
    lat: 40.7128,
    lng: -74.006,
    heading: 38,
    speedMph: 28,
    speedLimitMph: 35,
    gpsLastUpdateISO: new Date().toISOString(),
    gpsLastUpdateMin: 1,
    gpsPermission: "accepted",
    gpsLocked: true,
    deviceStatus: "live",
    locationSource: "driver_app",
  },
  {
    driverId: "d2",
    currentRideId: "RD-1003",
    lat: 40.7196,
    lng: -73.9944,
    heading: 12,
    speedMph: 0,
    speedLimitMph: 25,
    gpsLastUpdateISO: new Date().toISOString(),
    gpsLastUpdateMin: 0,
    gpsPermission: "accepted",
    gpsLocked: true,
    deviceStatus: "live",
    locationSource: "driver_app",
  },
  {
    driverId: "d3",
    currentRideId: "RD-1006",
    lat: 40.7041,
    lng: -74.0122,
    heading: 284,
    speedMph: 47,
    speedLimitMph: 35,
    gpsLastUpdateISO: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    gpsLastUpdateMin: 2,
    gpsPermission: "accepted",
    gpsLocked: true,
    deviceStatus: "live",
    locationSource: "vehicle_device",
  },
  {
    driverId: "d4",
    currentRideId: "RD-1002",
    lat: 40.7282,
    lng: -73.9866,
    heading: 90,
    speedMph: 41,
    speedLimitMph: 30,
    gpsLastUpdateISO: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    gpsLastUpdateMin: 4,
    gpsPermission: "accepted",
    gpsLocked: true,
    deviceStatus: "live",
    locationSource: "driver_app",
  },
  {
    driverId: "d5",
    currentRideId: "RD-1004",
    lat: 40.7359,
    lng: -73.9911,
    heading: 0,
    speedMph: 0,
    speedLimitMph: 25,
    gpsLastUpdateISO: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    gpsLastUpdateMin: 14,
    gpsPermission: "pending",
    gpsLocked: false,
    deviceStatus: "stale",
    locationSource: "driver_app",
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    plate: "LMB-104",
    type: "Accessible Van",
    capacity: 4,
    wheelchairAccessible: true,
    hasBooster: true,
    features: ["Lift", "Ramp", "Booster", "Quiet Cabin"],
    providerId: "p1",
  },
  {
    id: "v2",
    plate: "LMB-220",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "Car Seat", "Quiet Cabin"],
    providerId: "p1",
  },
  {
    id: "v3",
    plate: "CVT-318",
    type: "Accessible Van",
    capacity: 4,
    wheelchairAccessible: true,
    hasBooster: false,
    features: ["Lift", "Ramp"],
    providerId: "p2",
  },
  {
    id: "v4",
    plate: "CVT-401",
    type: "Minivan",
    capacity: 5,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "Car Seat", "Quiet Cabin", "High-Capacity"],
    providerId: "p2",
  },
  {
    id: "v5",
    plate: "NW-077",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: false,
    features: [],
    providerId: "p3",
  },
];

export const riders: Rider[] = [
  {
    id: "r1",
    name: "Avery K.",
    ageGroup: "child",
    caregiverRequired: true,
    mobilityLevel: "independent",
    wheelchairRequired: false,
    walkerRequired: false,
    boosterSeatRequired: true,
    sensorySensitivity: "high",
    motionSicknessRisk: true,
    needsQuietRide: true,
    noStrongScents: true,
    noLoudMusic: true,
    needsPredictableCommunication: true,
    extraPickupPatience: true,
    preferredDrivers: ["d1", "d2"],
    blockedDrivers: ["d5"],
    triggers: ["Sudden loud noises", "Strong perfumes", "Honking"],
    deEscalationNotes:
      "Use calm low voice. Offer noise-canceling headphones from caregiver bag. Avoid touching shoulder.",
    driverInstructions:
      "Park in shaded spot. Caregiver will bring rider out. Allow 3–5 min after arrival.",
    fundingSource: "Medicaid",
    emergencyContact: "Caregiver — on file",
  },
  {
    id: "r2",
    name: "Mr. Davies",
    ageGroup: "senior",
    caregiverRequired: false,
    mobilityLevel: "wheelchair",
    wheelchairRequired: true,
    walkerRequired: false,
    boosterSeatRequired: false,
    sensorySensitivity: "low",
    motionSicknessRisk: false,
    needsQuietRide: false,
    noStrongScents: false,
    noLoudMusic: false,
    needsPredictableCommunication: false,
    extraPickupPatience: false,
    preferredDrivers: [],
    blockedDrivers: [],
    triggers: [],
    deEscalationNotes: "",
    driverInstructions: "Wheelchair ramp required. Greet at front lobby of senior center.",
    fundingSource: "Medicaid",
    emergencyContact: "Daughter — on file",
  },
  {
    id: "r3",
    name: "Sasha M.",
    ageGroup: "teen",
    caregiverRequired: true,
    mobilityLevel: "assisted",
    wheelchairRequired: false,
    walkerRequired: true,
    boosterSeatRequired: false,
    sensorySensitivity: "medium",
    motionSicknessRisk: true,
    needsQuietRide: true,
    noStrongScents: true,
    noLoudMusic: true,
    needsPredictableCommunication: true,
    extraPickupPatience: true,
    preferredDrivers: ["d2"],
    blockedDrivers: [],
    triggers: ["Air freshener", "Bright sun in eyes"],
    deEscalationNotes: "Sasha may need 2 min to settle in. Don't initiate conversation.",
    driverInstructions: "Walker folds into trunk. Caregiver rides up front.",
    fundingSource: "MCO",
    emergencyContact: "Parent — on file",
  },
  {
    id: "r4",
    name: "Mrs. Lin",
    ageGroup: "senior",
    caregiverRequired: false,
    mobilityLevel: "assisted",
    wheelchairRequired: false,
    walkerRequired: true,
    boosterSeatRequired: false,
    sensorySensitivity: "low",
    motionSicknessRisk: false,
    needsQuietRide: false,
    noStrongScents: true,
    noLoudMusic: false,
    needsPredictableCommunication: false,
    extraPickupPatience: false,
    preferredDrivers: [],
    blockedDrivers: [],
    triggers: ["Strong fragrance"],
    deEscalationNotes: "",
    driverInstructions: "Recurring dialysis. Help with walker into clinic.",
    fundingSource: "Medicaid",
    emergencyContact: "Son — on file",
  },
];

const today = new Date();
const iso = (h: number, m = 0, dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const dateStr = (dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
};

export const initialRides: Ride[] = [
  {
    id: "RD-1001",
    riderId: "r1",
    driverId: "d1",
    vehicleId: "v1",
    providerId: "p1",
    pickupAddress: "412 Maple St",
    dropoffAddress: "Children's Therapy Center",
    appointmentDate: dateStr(0),
    appointmentTime: "10:30",
    appointmentType: "Therapy",
    returnRideNeeded: true,
    caregiverAttending: true,
    specialInstructions: "Quiet ride; booster pre-installed.",
    fundingSource: "Medicaid",
    status: "en_route_pickup",
    etaConfidence: "high",
    etaReasons: ["GPS current", "Driver moving"],
    gpsLastUpdateMin: 1,
    driverMoving: true,
    scheduledPickupISO: iso(10, 15),
  },
  {
    id: "RD-1002",
    riderId: "r2",
    driverId: "d4",
    vehicleId: "v3",
    providerId: "p2",
    pickupAddress: "88 Oak Ridge",
    dropoffAddress: "Riverside Dialysis",
    appointmentDate: dateStr(0),
    appointmentTime: "11:00",
    appointmentType: "Dialysis",
    returnRideNeeded: true,
    caregiverAttending: false,
    specialInstructions: "Wheelchair ramp.",
    fundingSource: "Medicaid",
    status: "in_transit",
    etaConfidence: "medium",
    etaReasons: ["GPS slightly stale (4 min)"],
    gpsLastUpdateMin: 4,
    driverMoving: true,
    scheduledPickupISO: iso(10, 45),
  },
  {
    id: "RD-1003",
    riderId: "r3",
    driverId: "d2",
    vehicleId: "v2",
    providerId: "p1",
    pickupAddress: "1207 Birch Ln",
    dropoffAddress: "Westside Behavioral Health",
    appointmentDate: dateStr(0),
    appointmentTime: "13:15",
    appointmentType: "Behavioral health",
    returnRideNeeded: true,
    caregiverAttending: true,
    specialInstructions: "No air freshener. Allow extra patience.",
    fundingSource: "MCO",
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Pickup not yet started"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(13, 0),
  },
  {
    id: "RD-1004",
    riderId: "r4",
    driverId: "d5",
    vehicleId: "v5",
    providerId: "p3",
    pickupAddress: "55 Elm Ct",
    dropoffAddress: "Riverside Dialysis",
    appointmentDate: dateStr(0),
    appointmentTime: "09:00",
    appointmentType: "Dialysis",
    returnRideNeeded: true,
    caregiverAttending: false,
    specialInstructions: "Walker assistance.",
    fundingSource: "Medicaid",
    status: "en_route_pickup",
    etaConfidence: "low",
    etaReasons: ["GPS stale (14 min)", "Driver not moving", "Pickup time close"],
    gpsLastUpdateMin: 14,
    driverMoving: false,
    scheduledPickupISO: iso(8, 50),
  },
  {
    id: "RD-1005",
    riderId: "r1",
    driverId: undefined,
    vehicleId: undefined,
    providerId: "p2",
    pickupAddress: "412 Maple St",
    dropoffAddress: "Children's Therapy Center",
    appointmentDate: dateStr(1),
    appointmentTime: "10:30",
    appointmentType: "Therapy",
    returnRideNeeded: true,
    caregiverAttending: true,
    specialInstructions: "",
    fundingSource: "Medicaid",
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Pickup not yet started"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(10, 15, 1),
  },
  {
    id: "RD-1006",
    riderId: "r3",
    driverId: "d3",
    vehicleId: "v4",
    providerId: "p2",
    pickupAddress: "1207 Birch Ln",
    dropoffAddress: "Northgate High School",
    appointmentDate: dateStr(0),
    appointmentTime: "15:30",
    appointmentType: "School transport",
    returnRideNeeded: false,
    caregiverAttending: true,
    specialInstructions: "Walker folds in trunk. No air freshener.",
    fundingSource: "School District",
    // Sasha is medium sensory + has preferred driver d2; assigning d3 (no sensory training) is a soft warning
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Pickup not yet started"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(15, 15),
  },
  {
    id: "RD-1007",
    riderId: "r2",
    driverId: "d2",
    vehicleId: "v2",
    providerId: "p1",
    pickupAddress: "Riverside Dialysis",
    dropoffAddress: "88 Oak Ridge",
    appointmentDate: dateStr(0),
    appointmentTime: "14:30",
    appointmentType: "Dialysis return",
    returnRideNeeded: false,
    caregiverAttending: false,
    // HARD FAIL: wheelchair rider in non-accessible sedan — should block dispatch
    specialInstructions: "Return from dialysis.",
    fundingSource: "Medicaid",
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Pickup not yet started"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(14, 15),
  },
  {
    id: "RD-1008",
    riderId: "r4",
    driverId: "d1",
    vehicleId: "v1",
    providerId: "p1",
    pickupAddress: "55 Elm Ct",
    dropoffAddress: "Riverside Imaging",
    appointmentDate: dateStr(1),
    appointmentTime: "08:15",
    appointmentType: "Imaging",
    returnRideNeeded: true,
    caregiverAttending: false,
    specialInstructions: "Help with walker into clinic.",
    fundingSource: "Medicaid",
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Pickup not yet started"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(8, 0, 1),
  },
  {
    id: "RD-0999",
    riderId: "r3",
    driverId: "d2",
    vehicleId: "v2",
    providerId: "p1",
    pickupAddress: "Westside Behavioral Health",
    dropoffAddress: "1207 Birch Ln",
    appointmentDate: dateStr(-1),
    appointmentTime: "16:00",
    appointmentType: "Behavioral health return",
    returnRideNeeded: false,
    caregiverAttending: true,
    specialInstructions: "",
    fundingSource: "MCO",
    status: "completed",
    etaConfidence: "high",
    etaReasons: ["Completed on time"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(16, 0, -1),
  },
];

export const initialIncidents: Incident[] = [
  {
    id: "INC-501",
    rideId: "RD-0998",
    riderId: "r1",
    driverId: "d5",
    providerId: "p3",
    issueType: "Sensory accommodation ignored",
    reporterStatement: "Driver played loud radio despite quiet-ride flag. Rider became distressed.",
    status: "investigating",
    filedAt: iso(8, 12, -1),
  },
  {
    id: "INC-502",
    rideId: "RD-0991",
    riderId: "r4",
    driverId: "d5",
    providerId: "p3",
    issueType: "False no show",
    reporterStatement:
      "Rider was at pickup at 8:55. Driver marked no-show at 9:01 without arrival.",
    status: "open",
    filedAt: iso(14, 30, -2),
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "L-9001",
    ts: iso(8, 1),
    actor: "dispatcher@lighthouse",
    action: "ride.created",
    entityId: "RD-1005",
    details: "Scheduled for tomorrow 10:30",
  },
  {
    id: "L-9002",
    ts: iso(8, 14),
    actor: "dispatcher@lighthouse",
    action: "driver.assigned",
    entityId: "RD-1001",
    details: "Driver d1 → RD-1001",
  },
  {
    id: "L-9003",
    ts: iso(8, 22),
    actor: "system",
    action: "eta.confidence_dropped",
    entityId: "RD-1004",
    details: "high → low (GPS stale)",
  },
  {
    id: "L-9004",
    ts: iso(8, 31),
    actor: "caregiver@parent",
    action: "incident.filed",
    entityId: "INC-501",
    details: "Sensory accommodation ignored",
  },
  {
    id: "L-9005",
    ts: iso(9, 5),
    actor: "admin@broker",
    action: "rider.profile_changed",
    entityId: "r3",
    details: "Added trigger: bright sun",
  },
];

export const SCHEMA_TABLES: { table: string; purpose: string }[] = [
  { table: "users", purpose: "Auth identities for all platform users." },
  { table: "organizations", purpose: "Brokers, providers, facilities, care orgs." },
  { table: "providers", purpose: "Transportation providers with performance tier." },
  { table: "riders", purpose: "Rider profiles with care + accommodation needs." },
  { table: "caregivers", purpose: "Caregivers linked to one or more riders." },
  { table: "drivers", purpose: "Drivers with certifications + scorecard refs." },
  { table: "vehicles", purpose: "Fleet vehicles with accessibility flags." },
  { table: "rides", purpose: "Scheduled and live rides." },
  { table: "ride_events", purpose: "State transitions: dispatched, arrived, picked up, etc." },
  { table: "gps_pings", purpose: "Time-series GPS for ETA truth engine." },
  { table: "incidents", purpose: "Reported issues with status workflow." },
  { table: "incident_evidence", purpose: "Photos, statements, GPS snapshots." },
  { table: "accommodations", purpose: "Normalized accommodation requirements." },
  { table: "driver_checklists", purpose: "Pre-trip checklist completions." },
  { table: "provider_scorecards", purpose: "Aggregated provider performance." },
  { table: "audit_logs", purpose: "Tamper-evident sensitive activity log." },
];
