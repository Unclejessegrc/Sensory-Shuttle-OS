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
  licensePlate?: string;
  vehicleId?: string;
  vehicleType?: string;
  certifications?: string[];
  serviceRadiusMiles?: number;
  shiftStart?: string;
  shiftEnd?: string;
  availability?: string;
  acceptingRides?: boolean;
  currentRideStatus?: string;
  fitScoreHistory?: number[];
  complaintCount?: number;
  missedRideCount?: number;
  latePickupCount?: number;
  noShowCount?: number;
  hardFailHistory?: string[];
  reviewNotes?: string;
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
  assignedDriverId?: string;
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
  businessAddress?: string;
  coveredServiceArea?: string;
  contactPhone?: string;
  contactEmail?: string;
  companyLicenseNumber?: string;
  licenseExpirationDate?: string;
  insuranceExpirationDate?: string;
  activeStatus?: string;
  complianceStatus?: string;
  accountabilityScore?: number;
  contractStatus?: string;
  reviewNotes?: string;
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
  externalFallbackReason?: string;
  externalFallbackSelectedByRole?: Role;
  externalFallbackSelectedAt?: string;
  externalFallbackWarnings?: string[];
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
  pickupWindowMinutes?: number;
  dropoffWindowMinutes?: number;
  returnWindowMinutes?: number;
  bufferMinutes?: number;
  estimatedDistanceMiles?: number;
  vehicleTypeRequired?: string;
  noSharedRideRequired?: boolean;
  extraPassengers?: number;
  unrelatedSharedRiders?: number;
  explicitlyApprovedSharedRide?: boolean;
  pickupLocationType?: string;
  dropoffLocationType?: string;
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
    id: "p4",
    name: "Harbor Care Rides",
    tier: "Standard",
    completedRides: 433,
    onTimeRate: 0.86,
    complaintRate: 0.038,
    canceledRides: 22,
    disputedNoShows: 5,
    staleGpsEvents: 18,
    etaAccuracy: 0.79,
    riderSatisfaction: 4.1,
    sensoryFailureRate: 0.06,
    highSensitivitySuccessRate: 0.84,
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

providers.forEach((p) => {
  const suffix = p.id.toUpperCase().replace("-", "");
  p.businessAddress = `${100 + suffix.length} Demo Commerce Way, Suite ${suffix.length}0`;
  p.coveredServiceArea =
    p.id === "p3"
      ? "North demo zone with limited pediatric coverage"
      : "Metro demo zone and adjacent clinic corridor";
  p.contactPhone = "555-010" + suffix.length;
  p.contactEmail = `ops+${p.id}@example-demo.test`;
  p.companyLicenseNumber = `DEMO-LIC-${suffix}-26`;
  p.licenseExpirationDate = p.id === "p3" ? "2026-07-31" : "2027-04-30";
  p.insuranceExpirationDate = p.id === "p3" ? "2026-06-15" : "2027-02-28";
  p.activeStatus = p.id === "p3" ? "Active - monitored" : "Active";
  p.complianceStatus = p.id === "p3" ? "Conditional review" : "Compliant";
  p.accountabilityScore = Math.round(p.onTimeRate * 70 + (1 - p.complaintRate) * 30);
  p.contractStatus = p.id === "p-ext" ? "Overflow only" : "In network";
  p.reviewNotes =
    p.id === "p3"
      ? "Watch unresolved sensory and no-show investigations before assigning high-support riders."
      : "Demo provider profile; all contact and license data is fictional.";
});

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
  {
    id: "d6",
    name: "Elena Park",
    sensoryTrained: true,
    pediatricCertified: true,
    wheelchairCertified: false,
    rating: 4.7,
    onTimeRate: 0.93,
    complaintRate: 0.014,
    providerId: "p4",
  },
  {
    id: "d7",
    name: "Owen Price",
    sensoryTrained: true,
    pediatricCertified: false,
    wheelchairCertified: true,
    rating: 4.5,
    onTimeRate: 0.87,
    complaintRate: 0.026,
    providerId: "p4",
  },
  {
    id: "d8",
    name: "Nia Sutton",
    sensoryTrained: false,
    pediatricCertified: true,
    wheelchairCertified: false,
    rating: 4.2,
    onTimeRate: 0.84,
    complaintRate: 0.045,
    providerId: "p2",
  },
  {
    id: "d9",
    name: "Caleb Stone",
    sensoryTrained: true,
    pediatricCertified: true,
    wheelchairCertified: true,
    rating: 4.9,
    onTimeRate: 0.98,
    complaintRate: 0.004,
    providerId: "p1",
  },
  {
    id: "d10",
    name: "Mira Cole",
    sensoryTrained: false,
    pediatricCertified: false,
    wheelchairCertified: false,
    rating: 4.0,
    onTimeRate: 0.8,
    complaintRate: 0.06,
    providerId: "p3",
  },
  {
    id: "d11",
    name: "Theo Quinn",
    sensoryTrained: true,
    pediatricCertified: false,
    wheelchairCertified: false,
    rating: 4.3,
    onTimeRate: 0.86,
    complaintRate: 0.03,
    providerId: "p-ext",
  },
  {
    id: "d12",
    name: "Iris Vale",
    sensoryTrained: true,
    pediatricCertified: true,
    wheelchairCertified: false,
    rating: 4.8,
    onTimeRate: 0.94,
    complaintRate: 0.009,
    providerId: "p4",
  },
];

drivers.forEach((d, index) => {
  d.licensePlate = `DEMO-${String(index + 101).padStart(3, "0")}`;
  d.vehicleId = `v${index + 1}`;
  d.vehicleType = index % 3 === 0 ? "Accessible Van" : index % 3 === 1 ? "Sedan" : "Minivan";
  d.certifications = [
    d.sensoryTrained ? "Sensory trained" : "Standard NEMT",
    d.pediatricCertified ? "Pediatric certified" : "Adult transport",
    d.wheelchairCertified ? "Wheelchair securement" : "Ambulatory only",
  ];
  d.serviceRadiusMiles = index === 4 ? 6 : index === 9 ? 8 : 18 + (index % 4) * 6;
  d.shiftStart = index % 4 === 0 ? "09:00" : "07:00";
  d.shiftEnd = index % 5 === 0 ? "12:00" : "18:00";
  d.availability = index % 5 === 4 ? "Limited" : index % 4 === 2 ? "Busy" : "Available";
  d.acceptingRides = !["d5", "d10"].includes(d.id);
  d.currentRideStatus =
    index % 3 === 0
      ? "On active trip"
      : index % 3 === 1
        ? "Staged for next pickup"
        : "Available for dispatch";
  d.fitScoreHistory = [88 - index, 91 - (index % 5), 79 + (index % 9)];
  d.complaintCount = Math.round(d.complaintRate * 100);
  d.missedRideCount = index % 4;
  d.latePickupCount = index % 5;
  d.noShowCount = index % 3;
  d.hardFailHistory =
    d.id === "d5"
      ? ["Unresolved safety incident", "High sensory accommodation missed"]
      : d.id === "d10"
        ? ["Outside service radius"]
        : [];
  d.reviewNotes =
    d.id === "d5"
      ? "Do not use for high sensory riders while incident review is open."
      : "Demo broker review note; no real driver information used.";
});

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
    plate: "DEMO-201",
    type: "Accessible Van",
    capacity: 4,
    wheelchairAccessible: true,
    hasBooster: true,
    features: ["Lift", "Ramp", "Booster", "Quiet Cabin"],
    providerId: "p1",
  },
  {
    id: "v2",
    plate: "DEMO-202",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "Car Seat", "Quiet Cabin"],
    providerId: "p1",
  },
  {
    id: "v3",
    plate: "DEMO-203",
    type: "Accessible Van",
    capacity: 4,
    wheelchairAccessible: true,
    hasBooster: false,
    features: ["Lift", "Ramp"],
    providerId: "p2",
  },
  {
    id: "v4",
    plate: "DEMO-204",
    type: "Minivan",
    capacity: 5,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "Car Seat", "Quiet Cabin", "High-Capacity"],
    providerId: "p2",
  },
  {
    id: "v5",
    plate: "DEMO-205",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: false,
    features: [],
    providerId: "p3",
  },
  {
    id: "v6",
    plate: "DEMO-206",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "Quiet Cabin"],
    providerId: "p4",
  },
  {
    id: "v7",
    plate: "DEMO-207",
    type: "Accessible Van",
    capacity: 4,
    wheelchairAccessible: true,
    hasBooster: false,
    features: ["Ramp", "Lift"],
    providerId: "p4",
  },
  {
    id: "v8",
    plate: "DEMO-208",
    type: "Minivan",
    capacity: 5,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "High-Capacity"],
    providerId: "p2",
  },
  {
    id: "v9",
    plate: "DEMO-209",
    type: "Accessible Van",
    capacity: 4,
    wheelchairAccessible: true,
    hasBooster: true,
    features: ["Ramp", "Booster", "Quiet Cabin"],
    providerId: "p1",
  },
  {
    id: "v10",
    plate: "DEMO-210",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: false,
    features: [],
    providerId: "p3",
  },
  {
    id: "v11",
    plate: "DEMO-211",
    type: "Sedan",
    capacity: 3,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Quiet Cabin"],
    providerId: "p-ext",
  },
  {
    id: "v12",
    plate: "DEMO-212",
    type: "Minivan",
    capacity: 5,
    wheelchairAccessible: false,
    hasBooster: true,
    features: ["Booster", "Quiet Cabin"],
    providerId: "p4",
  },
];

vehicles.forEach((v, index) => {
  v.assignedDriverId = `d${index + 1}`;
});

export const riders: Rider[] = [
  {
    id: "r1",
    name: "A.K.",
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
    name: "D.V.",
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
    name: "S.M.",
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
    name: "L.N.",
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
    id: "RD-1009",
    riderId: "r1",
    driverId: undefined,
    vehicleId: undefined,
    providerId: "p4",
    pickupAddress: "Demo apartment lobby",
    dropoffAddress: "Demo pediatric clinic",
    appointmentDate: dateStr(0),
    appointmentTime: "11:45",
    appointmentType: "Pediatric checkup",
    returnRideNeeded: true,
    caregiverAttending: true,
    specialInstructions: "High sensory support; no shared ride.",
    fundingSource: "CHIP",
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Online ride request created"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(11, 30),
    noSharedRideRequired: true,
    extraPassengers: 1,
    unrelatedSharedRiders: 1,
    estimatedDistanceMiles: 9,
    pickupLocationType: "Residence lobby",
    dropoffLocationType: "Pediatric clinic",
  },
  {
    id: "RD-1010",
    riderId: "r2",
    driverId: undefined,
    vehicleId: undefined,
    providerId: "p1",
    pickupAddress: "Demo senior center",
    dropoffAddress: "Demo dialysis entrance",
    appointmentDate: dateStr(0),
    appointmentTime: "12:10",
    appointmentType: "Dialysis",
    returnRideNeeded: true,
    caregiverAttending: false,
    specialInstructions: "Wheelchair ramp required.",
    fundingSource: "Medicaid",
    status: "scheduled",
    etaConfidence: "medium",
    etaReasons: ["Provider availability pending"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(11, 55),
    vehicleTypeRequired: "Accessible Van",
    estimatedDistanceMiles: 14,
    pickupLocationType: "Senior center",
    dropoffLocationType: "Dialysis center",
  },
  {
    id: "RD-1011",
    riderId: "r3",
    driverId: undefined,
    vehicleId: undefined,
    providerId: "p2",
    pickupAddress: "Demo school entrance",
    dropoffAddress: "Demo therapy suite",
    appointmentDate: dateStr(0),
    appointmentTime: "16:05",
    appointmentType: "Therapy",
    returnRideNeeded: false,
    caregiverAttending: true,
    specialInstructions: "Quiet ride preferred.",
    fundingSource: "MCO",
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: ["Auto dispatch simulation"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(15, 50),
    estimatedDistanceMiles: 7,
    pickupLocationType: "School entrance",
    dropoffLocationType: "Therapy clinic",
  },
  {
    id: "RD-1012",
    riderId: "r4",
    driverId: undefined,
    vehicleId: undefined,
    providerId: "p3",
    pickupAddress: "Demo residence porch",
    dropoffAddress: "Demo imaging desk",
    appointmentDate: dateStr(0),
    appointmentTime: "10:05",
    appointmentType: "Imaging",
    returnRideNeeded: true,
    caregiverAttending: false,
    specialInstructions: "Walker assistance.",
    fundingSource: "Medicaid",
    status: "scheduled",
    etaConfidence: "low",
    etaReasons: ["Overbooking risk"],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: iso(9, 50),
    estimatedDistanceMiles: 22,
    pickupLocationType: "Residence",
    dropoffLocationType: "Imaging center",
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

initialRides.forEach((ride, index) => {
  ride.pickupWindowMinutes ??= 15;
  ride.dropoffWindowMinutes ??= 15;
  ride.returnWindowMinutes ??= ride.returnRideNeeded ? 20 : 0;
  ride.bufferMinutes ??= 15;
  ride.estimatedTripMinutes ??= 50 + (index % 4) * 15;
  ride.estimatedDistanceMiles ??= 6 + (index % 5) * 5;
  ride.extraPassengers ??= ride.caregiverAttending ? 1 : 0;
  ride.unrelatedSharedRiders ??= 0;
  ride.noSharedRideRequired ??=
    riders.find((r) => r.id === ride.riderId)?.sensorySensitivity === "high";
  ride.pickupLocationType ??= ride.pickupAddress.includes("Demo")
    ? ride.pickupAddress
    : "Mock pickup site";
  ride.dropoffLocationType ??= ride.dropoffAddress.includes("Demo")
    ? ride.dropoffAddress
    : "Mock care destination";
});

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
