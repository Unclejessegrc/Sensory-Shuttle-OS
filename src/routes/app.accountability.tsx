import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  MapPin,
  Clock,
  UserX,
  Car,
  Activity,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Gavel,
  Building2,
  User,
  Star,
  TriangleAlert,
  CircleX,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/accountability")({
  component: () => (
    <RoleGate allow={["broker"]}>
      <AccountabilityEngine />
    </RoleGate>
  ),
});

// ─── Types ───────────────────────────────────────────────────────────────────

type ViolationType =
  | "false_no_show"
  | "stale_gps"
  | "sensory_accommodation_failure"
  | "wrong_vehicle"
  | "wrong_driver"
  | "late_pickup"
  | "inaccurate_eta"
  | "unresolved_incident"
  | "driver_training_mismatch"
  | "geofence_bypass";

type Severity = "critical" | "high" | "medium" | "low";
type ConsequenceLevel = 1 | 2 | 3 | 4 | 5;
type ReviewStatus = "pending" | "under_review" | "escalated" | "closed";

interface Violation {
  id: string;
  rideId: string;
  riderName: string;
  riderSensitivity: "low" | "medium" | "high";
  driverName: string;
  driverId: string;
  providerName: string;
  providerId: string;
  violationType: ViolationType;
  severity: Severity;
  occurredAt: string;
  evidenceAvailable: string[];
  recommendedAction: string;
  consequenceLevel: ConsequenceLevel;
  reviewStatus: ReviewStatus;
  details: ViolationDetails;
}

interface ViolationDetails {
  requiredAccommodations: string[];
  whatFailed: string;
  gpsEvidence: GpsEvent[];
  etaHistory: EtaEvent[];
  checklistConfirmations: ChecklistItem[];
  incidentStatement: string;
  auditLog: AuditEntry[];
  recommendedConsequence: string;
}

interface GpsEvent {
  ts: string;
  lat: number;
  lng: number;
  accuracy: string;
  note: string;
}
interface EtaEvent {
  ts: string;
  eta: string;
  confidence: string;
  delta: string;
}
interface ChecklistItem {
  item: string;
  confirmed: boolean;
  ts?: string;
}
interface AuditEntry {
  ts: string;
  actor: string;
  action: string;
  detail: string;
}

interface ProviderScore {
  id: string;
  name: string;
  tier: "Gold" | "Standard" | "Watch List";
  score: number;
  onTimeRate: number;
  complaintRate: number;
  sensoryFailureRate: number;
  staleGpsEvents: number;
  falseNoShowDisputes: number;
  missedPickups: number;
  unresolvedIncidents: number;
  correctiveActionsOnTime: number;
  trend: "up" | "down" | "stable";
  activeViolations: number;
  lastReviewDate: string;
}

interface DriverScore {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  score: number;
  onTimeRate: number;
  gpsReliability: number;
  statusAccuracy: number;
  checklistCompletion: number;
  complaintRate: number;
  accommodationCompliance: number;
  falseNoShowDisputes: number;
  blockedRiderHistory: number;
  restricted: boolean;
  restrictionReason?: string;
  activeViolations: number;
  consequenceLevel: ConsequenceLevel;
}

interface CorrectiveAction {
  id: string;
  entityType: "driver" | "provider";
  entityName: string;
  actionRequired: string;
  dueDate: string;
  status: "pending" | "in_progress" | "overdue" | "completed";
  assignedTo: string;
  violationRef: string;
  consequenceLevel: ConsequenceLevel;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const VIOLATIONS: Violation[] = [
  {
    id: "VIO-001",
    rideId: "R-4821",
    riderName: "Marcus T.",
    riderSensitivity: "high",
    driverName: "Derek Walls",
    driverId: "DRV-09",
    providerName: "Sunrise Medical Transport",
    providerId: "PRV-02",
    violationType: "false_no_show",
    severity: "critical",
    occurredAt: "2026-05-11T09:14:00Z",
    evidenceAvailable: ["GPS log", "Geofence map", "Timestamp record", "Rider caregiver statement"],
    recommendedAction:
      "Block driver from high-sensitivity assignments. Require corrective statement. Escalate to broker review.",
    consequenceLevel: 3,
    reviewStatus: "under_review",
    details: {
      requiredAccommodations: [
        "Quiet vehicle",
        "No sudden stops",
        "Pre-arrival call 10 min before",
        "High sensory sensitivity protocol",
      ],
      whatFailed:
        "Driver marked 'Rider No-Show' at 09:14 AM. GPS data confirms driver was 0.8 miles from pickup address at time of no-show declaration. Geofence boundary is 0.15 miles. Driver did not enter the required geofence zone. No pre-arrival call was made. No timestamp photo was captured. Driver failed to comply with no-show documentation requirements.",
      gpsEvidence: [
        {
          ts: "09:08 AM",
          lat: 40.7589,
          lng: -73.9851,
          accuracy: "High",
          note: "Driver departed depot",
        },
        {
          ts: "09:12 AM",
          lat: 40.7612,
          lng: -73.9823,
          accuracy: "High",
          note: "Driver 0.8 mi from pickup",
        },
        {
          ts: "09:14 AM",
          lat: 40.7615,
          lng: -73.982,
          accuracy: "Medium",
          note: "No-show marked — OUTSIDE geofence",
        },
        {
          ts: "09:16 AM",
          lat: 40.763,
          lng: -73.9801,
          accuracy: "High",
          note: "Driver departed area",
        },
      ],
      etaHistory: [
        { ts: "08:55 AM", eta: "9:10 AM", confidence: "High", delta: "—" },
        { ts: "09:05 AM", eta: "9:15 AM", confidence: "Medium", delta: "+5 min" },
        { ts: "09:11 AM", eta: "9:20 AM", confidence: "Low", delta: "+10 min" },
      ],
      checklistConfirmations: [
        { item: "Pre-trip vehicle inspection", confirmed: true, ts: "08:30 AM" },
        { item: "Rider profile reviewed", confirmed: false },
        { item: "Pre-arrival call placed", confirmed: false },
        { item: "Geofence arrival confirmed", confirmed: false },
        { item: "Timestamp photo captured", confirmed: false },
        { item: "No-show notes completed", confirmed: false },
      ],
      incidentStatement:
        "Rider's caregiver confirms they were waiting at the front entrance of 412 Elmwood Ave at the scheduled time. No vehicle arrived. No call was received. Rider waited 28 minutes.",
      auditLog: [
        {
          ts: "09:14 AM",
          actor: "DRV-09 (Derek Walls)",
          action: "status.no_show",
          detail: "Marked rider no-show via driver app",
        },
        {
          ts: "09:22 AM",
          actor: "Caregiver App",
          action: "dispute.filed",
          detail: "Caregiver filed no-show dispute via rider portal",
        },
        {
          ts: "09:45 AM",
          actor: "System",
          action: "violation.auto_created",
          detail: "Geofence mismatch detected — VIO-001 auto-generated",
        },
        {
          ts: "10:02 AM",
          actor: "dispatcher@sunrise.com",
          action: "review.initiated",
          detail: "Dispatcher opened review",
        },
      ],
      recommendedConsequence:
        "Level 3 — Assignment restriction. Driver should be blocked from high-sensitivity rider assignments pending retraining completion and signed acknowledgment of no-show protocols.",
    },
  },
  {
    id: "VIO-002",
    rideId: "R-4799",
    riderName: "Eloise M.",
    riderSensitivity: "medium",
    driverName: "Terrence Holt",
    driverId: "DRV-14",
    providerName: "Sunrise Medical Transport",
    providerId: "PRV-02",
    violationType: "stale_gps",
    severity: "high",
    occurredAt: "2026-05-10T14:33:00Z",
    evidenceAvailable: ["GPS log", "Ping timestamps", "System alert log"],
    recommendedAction:
      "Flag vehicle for GPS audit. Require provider corrective action plan within 5 business days.",
    consequenceLevel: 2,
    reviewStatus: "pending",
    details: {
      requiredAccommodations: ["Wheelchair accessible vehicle", "Lift assistance"],
      whatFailed:
        "GPS beacon went silent for 47 consecutive minutes while ride was in 'in_transit' status. Dispatcher unable to confirm rider safety or vehicle location. Broker and caregiver received stale ETA data for the duration. Three automated alerts were generated; no acknowledgment from driver.",
      gpsEvidence: [
        {
          ts: "2:01 PM",
          lat: 40.722,
          lng: -73.9955,
          accuracy: "High",
          note: "Last confirmed GPS ping",
        },
        {
          ts: "2:08 PM",
          lat: 40.722,
          lng: -73.9955,
          accuracy: "Stale",
          note: "No update — showing prior position",
        },
        {
          ts: "2:21 PM",
          lat: 40.722,
          lng: -73.9955,
          accuracy: "Stale",
          note: "47 min silence — system flagged",
        },
        {
          ts: "2:48 PM",
          lat: 40.7401,
          lng: -73.981,
          accuracy: "High",
          note: "GPS restored — 2.1 miles from last known",
        },
      ],
      etaHistory: [
        { ts: "2:00 PM", eta: "2:22 PM", confidence: "High", delta: "—" },
        { ts: "2:15 PM", eta: "2:22 PM", confidence: "Stale", delta: "0 (frozen)" },
        { ts: "2:35 PM", eta: "2:22 PM", confidence: "Stale", delta: "0 (frozen)" },
        { ts: "2:49 PM", eta: "3:05 PM", confidence: "Low", delta: "+43 min actual" },
      ],
      checklistConfirmations: [
        { item: "Pre-trip vehicle inspection", confirmed: true, ts: "1:10 PM" },
        { item: "GPS device tested pre-shift", confirmed: false },
        { item: "Rider profile reviewed", confirmed: true, ts: "1:08 PM" },
        { item: "Dispatcher check-in protocol", confirmed: false },
      ],
      incidentStatement:
        "Dispatcher attempted to reach driver by phone at 2:21 PM and 2:35 PM. No response. Caregiver filed concern at 2:40 PM. Rider arrived safely at destination at 3:03 PM. No physical harm. Broker notified at 2:45 PM.",
      auditLog: [
        {
          ts: "2:01 PM",
          actor: "System",
          action: "gps.last_ping",
          detail: "GPS beacon active — last confirmed signal",
        },
        {
          ts: "2:23 PM",
          actor: "System",
          action: "alert.stale_gps_1",
          detail: "GPS stale >20 min — dispatcher notified",
        },
        {
          ts: "2:35 PM",
          actor: "System",
          action: "alert.stale_gps_2",
          detail: "GPS stale >34 min — broker notified",
        },
        {
          ts: "2:40 PM",
          actor: "Caregiver Portal",
          action: "concern.filed",
          detail: "Caregiver submitted safety concern",
        },
        {
          ts: "2:48 PM",
          actor: "System",
          action: "gps.restored",
          detail: "GPS signal restored — 2.1 mi from last known",
        },
        {
          ts: "2:50 PM",
          actor: "System",
          action: "violation.auto_created",
          detail: "Stale GPS threshold exceeded — VIO-002 generated",
        },
      ],
      recommendedConsequence:
        "Level 2 — Required retraining on GPS protocol compliance. Vehicle must pass GPS device inspection before next assignment. Provider must submit written corrective action plan.",
    },
  },
  {
    id: "VIO-003",
    rideId: "R-4812",
    riderName: "Jonah C.",
    riderSensitivity: "high",
    driverName: "Sandra Mejia",
    driverId: "DRV-22",
    providerName: "Ridgeline Care Transit",
    providerId: "PRV-04",
    violationType: "sensory_accommodation_failure",
    severity: "critical",
    occurredAt: "2026-05-12T08:22:00Z",
    evidenceAvailable: ["Caregiver complaint", "Rider profile", "Incident report INC-587"],
    recommendedAction:
      "Immediate review. Driver lacks sensory training certification. Provider violated assignment rules. Provider must submit corrective plan.",
    consequenceLevel: 4,
    reviewStatus: "escalated",
    details: {
      requiredAccommodations: [
        "No music or radio",
        "No strong scents or air fresheners",
        "Pre-arrival text (not call)",
        "Slow deliberate communication",
        "Extra pickup patience — 10 min window",
        "High sensory sensitivity protocol",
        "Sensory-trained driver required",
      ],
      whatFailed:
        "Driver Sandra Mejia was assigned to high-sensitivity rider Jonah C. despite not holding sensory training certification (required for riders with sensitivity level 'high'). Driver had air freshener in vehicle, played talk radio during transport, honked horn twice at intersection. Rider entered sensory distress. Caregiver filed complaint immediately upon pickup completion. Driver's training record shows certification expired 8 months ago.",
      gpsEvidence: [
        {
          ts: "8:10 AM",
          lat: 40.6892,
          lng: -73.9442,
          accuracy: "High",
          note: "Driver departed depot",
        },
        {
          ts: "8:22 AM",
          lat: 40.6901,
          lng: -73.9455,
          accuracy: "High",
          note: "Pickup confirmed — geofence entered",
        },
        { ts: "9:05 AM", lat: 40.715, lng: -73.9712, accuracy: "High", note: "Dropoff confirmed" },
      ],
      etaHistory: [
        { ts: "8:00 AM", eta: "8:20 AM", confidence: "High", delta: "—" },
        { ts: "8:15 AM", eta: "8:22 AM", confidence: "High", delta: "+2 min" },
      ],
      checklistConfirmations: [
        { item: "Pre-trip vehicle inspection", confirmed: true, ts: "7:55 AM" },
        { item: "Rider sensory profile reviewed", confirmed: false },
        { item: "Vehicle scent check completed", confirmed: false },
        { item: "Sensory training certification valid", confirmed: false },
        { item: "Music/radio off confirmed", confirmed: false },
      ],
      incidentStatement:
        "Caregiver report: 'Driver had a pine tree air freshener hanging from mirror. Talk radio was playing. Driver honked twice. Jonah covered his ears and began stimming. He was distressed for 2+ hours after the ride. This should never have happened — the profile is explicit.'",
      auditLog: [
        {
          ts: "7:40 AM",
          actor: "System",
          action: "assignment.created",
          detail: "DRV-22 assigned to R-4812 — sensory training check bypassed by dispatcher",
        },
        {
          ts: "7:41 AM",
          actor: "System",
          action: "warning.training_expired",
          detail: "ALERT: DRV-22 sensory cert expired — assignment created anyway",
        },
        {
          ts: "8:22 AM",
          actor: "DRV-22",
          action: "status.arrived",
          detail: "Driver marked arrived at pickup",
        },
        {
          ts: "9:06 AM",
          actor: "DRV-22",
          action: "status.completed",
          detail: "Ride marked complete",
        },
        {
          ts: "9:15 AM",
          actor: "Caregiver Portal",
          action: "complaint.filed",
          detail: "Sensory accommodation failure — complaint INC-587",
        },
        {
          ts: "9:30 AM",
          actor: "System",
          action: "violation.auto_created",
          detail: "Sensory training mismatch + complaint — VIO-003 escalated",
        },
      ],
      recommendedConsequence:
        "Level 4 — Provider watchlist. Ridgeline Care Transit failed to enforce training-based assignment rules. Driver must not be assigned to high-sensitivity riders until re-certified. Provider must audit all current driver certifications and submit compliance report within 48 hours.",
    },
  },
  {
    id: "VIO-004",
    rideId: "R-4790",
    riderName: "Pearl D.",
    riderSensitivity: "low",
    driverName: "Andre Thompson",
    driverId: "DRV-07",
    providerName: "Ridgeline Care Transit",
    providerId: "PRV-04",
    violationType: "wrong_vehicle",
    severity: "high",
    occurredAt: "2026-05-09T11:05:00Z",
    evidenceAvailable: ["Ride manifest", "Vehicle assignment log", "Rider profile"],
    recommendedAction:
      "Dispatcher review of vehicle assignment workflow. Provider fleet audit required.",
    consequenceLevel: 2,
    reviewStatus: "pending",
    details: {
      requiredAccommodations: [
        "Wheelchair accessible vehicle with power lift",
        "Securements for power wheelchair",
      ],
      whatFailed:
        "Pearl D. requires a wheelchair accessible vehicle with power lift. Vehicle assigned was a standard sedan (VEH-12) — non-WAV, no lift equipment. Driver arrived, could not accommodate rider. Rider was left without transport for 52 minutes until a replacement vehicle was dispatched. Appointment missed.",
      gpsEvidence: [
        {
          ts: "11:02 AM",
          lat: 40.7051,
          lng: -74.0134,
          accuracy: "High",
          note: "Driver arrived at pickup",
        },
        {
          ts: "11:07 AM",
          lat: 40.7051,
          lng: -74.0134,
          accuracy: "High",
          note: "Driver idle — vehicle mismatch discovered",
        },
        {
          ts: "11:09 AM",
          lat: 40.706,
          lng: -74.0121,
          accuracy: "High",
          note: "Driver departed — no pickup",
        },
      ],
      etaHistory: [{ ts: "10:45 AM", eta: "11:05 AM", confidence: "High", delta: "—" }],
      checklistConfirmations: [
        { item: "Vehicle equipment matched to rider profile", confirmed: false },
        { item: "WAV requirement verified", confirmed: false },
        { item: "Power lift operational", confirmed: false },
        { item: "Pre-trip inspection", confirmed: true, ts: "10:15 AM" },
      ],
      incidentStatement:
        "Driver arrived and informed dispatch he could not transport rider. Replacement WAV dispatched at 11:09 AM, arrived 12:01 PM. Rider missed her nephrology appointment. Second missed appointment this month due to vehicle assignment errors.",
      auditLog: [
        {
          ts: "10:00 AM",
          actor: "dispatcher@ridgeline.com",
          action: "assignment.vehicle",
          detail: "VEH-12 assigned to R-4790 — WAV flag not checked",
        },
        {
          ts: "11:06 AM",
          actor: "DRV-07",
          action: "dispatch.alert",
          detail: "Driver reported vehicle mismatch to dispatch",
        },
        {
          ts: "11:09 AM",
          actor: "dispatcher@ridgeline.com",
          action: "reassignment.initiated",
          detail: "WAV replacement dispatched",
        },
        {
          ts: "11:15 AM",
          actor: "System",
          action: "violation.auto_created",
          detail: "WAV assignment mismatch — VIO-004 generated",
        },
      ],
      recommendedConsequence:
        "Level 2 — Required retraining for dispatcher on vehicle-rider matching protocol. Provider must audit assignment workflow and confirm WAV flag enforcement is active.",
    },
  },
];

const PROVIDER_SCORES: ProviderScore[] = [
  {
    id: "PRV-01",
    name: "Metro Access Solutions",
    tier: "Gold",
    score: 91,
    onTimeRate: 0.94,
    complaintRate: 0.02,
    sensoryFailureRate: 0.01,
    staleGpsEvents: 1,
    falseNoShowDisputes: 0,
    missedPickups: 2,
    unresolvedIncidents: 1,
    correctiveActionsOnTime: 100,
    trend: "stable",
    activeViolations: 0,
    lastReviewDate: "2026-04-15",
  },
  {
    id: "PRV-02",
    name: "Sunrise Medical Transport",
    tier: "Standard",
    score: 67,
    onTimeRate: 0.82,
    complaintRate: 0.07,
    sensoryFailureRate: 0.06,
    staleGpsEvents: 9,
    falseNoShowDisputes: 4,
    missedPickups: 11,
    unresolvedIncidents: 5,
    correctiveActionsOnTime: 60,
    trend: "down",
    activeViolations: 2,
    lastReviewDate: "2026-03-28",
  },
  {
    id: "PRV-03",
    name: "Clearview Community Rides",
    tier: "Standard",
    score: 79,
    onTimeRate: 0.89,
    complaintRate: 0.04,
    sensoryFailureRate: 0.03,
    staleGpsEvents: 3,
    falseNoShowDisputes: 1,
    missedPickups: 4,
    unresolvedIncidents: 2,
    correctiveActionsOnTime: 85,
    trend: "up",
    activeViolations: 0,
    lastReviewDate: "2026-04-22",
  },
  {
    id: "PRV-04",
    name: "Ridgeline Care Transit",
    tier: "Watch List",
    score: 44,
    onTimeRate: 0.71,
    complaintRate: 0.14,
    sensoryFailureRate: 0.18,
    staleGpsEvents: 22,
    falseNoShowDisputes: 8,
    missedPickups: 19,
    unresolvedIncidents: 12,
    correctiveActionsOnTime: 33,
    trend: "down",
    activeViolations: 2,
    lastReviewDate: "2026-02-14",
  },
];

const DRIVER_SCORES: DriverScore[] = [
  {
    id: "DRV-03",
    name: "Carla Simmons",
    providerId: "PRV-01",
    providerName: "Metro Access Solutions",
    score: 96,
    onTimeRate: 0.97,
    gpsReliability: 0.99,
    statusAccuracy: 0.98,
    checklistCompletion: 1.0,
    complaintRate: 0.01,
    accommodationCompliance: 0.99,
    falseNoShowDisputes: 0,
    blockedRiderHistory: 0,
    restricted: false,
    activeViolations: 0,
    consequenceLevel: 1,
  },
  {
    id: "DRV-09",
    name: "Derek Walls",
    providerId: "PRV-02",
    providerName: "Sunrise Medical Transport",
    score: 51,
    onTimeRate: 0.78,
    gpsReliability: 0.81,
    statusAccuracy: 0.64,
    checklistCompletion: 0.55,
    complaintRate: 0.12,
    accommodationCompliance: 0.7,
    falseNoShowDisputes: 3,
    blockedRiderHistory: 1,
    restricted: true,
    restrictionReason:
      "False no-show (VIO-001) — blocked from high-sensitivity rider assignments pending retraining",
    activeViolations: 1,
    consequenceLevel: 3,
  },
  {
    id: "DRV-14",
    name: "Terrence Holt",
    providerId: "PRV-02",
    providerName: "Sunrise Medical Transport",
    score: 63,
    onTimeRate: 0.84,
    gpsReliability: 0.67,
    statusAccuracy: 0.8,
    checklistCompletion: 0.72,
    complaintRate: 0.06,
    accommodationCompliance: 0.85,
    falseNoShowDisputes: 1,
    blockedRiderHistory: 0,
    restricted: false,
    activeViolations: 1,
    consequenceLevel: 2,
  },
  {
    id: "DRV-22",
    name: "Sandra Mejia",
    providerId: "PRV-04",
    providerName: "Ridgeline Care Transit",
    score: 38,
    onTimeRate: 0.75,
    gpsReliability: 0.88,
    statusAccuracy: 0.72,
    checklistCompletion: 0.41,
    complaintRate: 0.19,
    accommodationCompliance: 0.52,
    falseNoShowDisputes: 2,
    blockedRiderHistory: 1,
    restricted: true,
    restrictionReason:
      "Sensory accommodation failure (VIO-003) — blocked from all high-sensitivity assignments until re-certification",
    activeViolations: 1,
    consequenceLevel: 4,
  },
];

const CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: "CA-001",
    entityType: "driver",
    entityName: "Derek Walls",
    actionRequired: "Complete no-show protocol retraining module and sign acknowledgment",
    dueDate: "2026-05-18",
    status: "pending",
    assignedTo: "Sunrise Medical Transport — Training Coordinator",
    violationRef: "VIO-001",
    consequenceLevel: 3,
  },
  {
    id: "CA-002",
    entityType: "provider",
    entityName: "Sunrise Medical Transport",
    actionRequired: "Submit corrective action plan for GPS device inspection protocol",
    dueDate: "2026-05-16",
    status: "overdue",
    assignedTo: "Provider Admin — operations@sunrise-transport.com",
    violationRef: "VIO-002",
    consequenceLevel: 2,
  },
  {
    id: "CA-003",
    entityType: "driver",
    entityName: "Sandra Mejia",
    actionRequired: "Complete sensory training re-certification (8-hour course)",
    dueDate: "2026-05-22",
    status: "in_progress",
    assignedTo: "Ridgeline Care Transit — Training",
    violationRef: "VIO-003",
    consequenceLevel: 4,
  },
  {
    id: "CA-004",
    entityType: "provider",
    entityName: "Ridgeline Care Transit",
    actionRequired: "Audit all driver sensory certifications and submit compliance report",
    dueDate: "2026-05-14",
    status: "overdue",
    assignedTo: "Ridgeline Admin — compliance@ridgeline.com",
    violationRef: "VIO-003",
    consequenceLevel: 4,
  },
  {
    id: "CA-005",
    entityType: "provider",
    entityName: "Ridgeline Care Transit",
    actionRequired: "Implement WAV-flag enforcement in dispatcher assignment workflow",
    dueDate: "2026-05-20",
    status: "pending",
    assignedTo: "Ridgeline Admin",
    violationRef: "VIO-004",
    consequenceLevel: 2,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VIOLATION_LABELS: Record<ViolationType, string> = {
  false_no_show: "False No-Show",
  stale_gps: "Stale GPS",
  sensory_accommodation_failure: "Sensory Accommodation Failure",
  wrong_vehicle: "Wrong Vehicle Assignment",
  wrong_driver: "Wrong Driver Assignment",
  late_pickup: "Late Pickup",
  inaccurate_eta: "Inaccurate ETA",
  unresolved_incident: "Unresolved Incident",
  driver_training_mismatch: "Training Mismatch",
  geofence_bypass: "Geofence Bypass",
};

const SEVERITY_CONFIG: Record<Severity, { label: string; className: string; dot: string }> = {
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-800 border-orange-300",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  },
};

const CONSEQUENCE_CONFIG: Record<ConsequenceLevel, { label: string; color: string; bg: string }> = {
  1: { label: "Warning", color: "text-slate-600", bg: "bg-slate-100" },
  2: { label: "Retraining Required", color: "text-yellow-700", bg: "bg-yellow-50" },
  3: { label: "Assignment Restriction", color: "text-orange-700", bg: "bg-orange-50" },
  4: { label: "Provider Watchlist", color: "text-red-700", bg: "bg-red-50" },
  5: { label: "Contract Review / Suspension", color: "text-red-900", bg: "bg-red-100" },
};

const ACTION_STATUS_CONFIG: Record<CorrectiveAction["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700" },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
};

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; cls: string }> = {
  pending: { label: "Pending Review", cls: "bg-slate-100 text-slate-700" },
  under_review: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
  escalated: { label: "Escalated", cls: "bg-red-100 text-red-700" },
  closed: { label: "Closed", cls: "bg-green-100 text-green-700" },
};

function scoreColor(s: number) {
  if (s >= 85) return "text-emerald-700";
  if (s >= 70) return "text-yellow-700";
  if (s >= 55) return "text-orange-700";
  return "text-red-700";
}

function scoreBarColor(s: number) {
  if (s >= 85) return "bg-emerald-500";
  if (s >= 70) return "bg-yellow-500";
  if (s >= 55) return "bg-orange-500";
  return "bg-red-500";
}

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ConsequenceBadge({ level }: { level: ConsequenceLevel }) {
  const cfg = CONSEQUENCE_CONFIG[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        cfg.bg,
        cfg.color,
      )}
    >
      <Gavel className="h-3 w-3" /> L{level} — {cfg.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: ProviderScore["tier"] }) {
  if (tier === "Gold")
    return <Badge className="bg-amber-100 text-amber-800 border-amber-300 border">Gold</Badge>;
  if (tier === "Watch List")
    return <Badge className="bg-red-100 text-red-800 border-red-300 border">Watch List</Badge>;
  return <Badge variant="outline">Standard</Badge>;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", scoreBarColor(score * 100))}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Violation Detail Modal ───────────────────────────────────────────────────

function ViolationDetail({ v, onClose }: { v: Violation; onClose: () => void }) {
  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <span className="font-mono text-muted-foreground">{v.id}</span>
          <SeverityBadge severity={v.severity} />
          <ConsequenceBadge level={v.consequenceLevel} />
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 pt-1">
        {/* Header grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Ride</div>
            <div className="font-semibold font-mono">{v.rideId}</div>
            <div className="text-muted-foreground">
              {v.occurredAt.replace("T", " ").slice(0, 16)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Rider</div>
            <div className="font-semibold">{v.riderName}</div>
            <div className="flex items-center gap-1 text-muted-foreground">
              Sensitivity:
              <span
                className={cn(
                  "font-medium",
                  v.riderSensitivity === "high"
                    ? "text-red-600"
                    : v.riderSensitivity === "medium"
                      ? "text-orange-600"
                      : "text-slate-600",
                )}
              >
                {v.riderSensitivity}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Driver</div>
            <div className="font-semibold">{v.driverName}</div>
            <div className="text-muted-foreground text-xs font-mono">{v.driverId}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Provider</div>
            <div className="font-semibold">{v.providerName}</div>
            <div className="text-muted-foreground text-xs font-mono">{v.providerId}</div>
          </div>
        </div>

        {/* Required accommodations */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Required Accommodations
          </div>
          <div className="flex flex-wrap gap-1.5">
            {v.details.requiredAccommodations.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* What failed */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-destructive" /> What Failed
          </div>
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm leading-relaxed">
            {v.details.whatFailed}
          </div>
        </div>

        {/* GPS Evidence */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> GPS Evidence
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Time</th>
                  <th className="text-left px-3 py-2">Location</th>
                  <th className="text-left px-3 py-2">Accuracy</th>
                  <th className="text-left px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {v.details.gpsEvidence.map((g, i) => (
                  <tr key={i} className={cn(g.accuracy === "Stale" && "bg-orange-50")}>
                    <td className="px-3 py-2 font-mono">{g.ts}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {g.lat.toFixed(4)}, {g.lng.toFixed(4)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs",
                          g.accuracy === "High"
                            ? "bg-green-100 text-green-700"
                            : g.accuracy === "Stale"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700",
                        )}
                      >
                        {g.accuracy}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{g.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ETA History */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> ETA Confidence History
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Timestamp</th>
                  <th className="text-left px-3 py-2">ETA Shown</th>
                  <th className="text-left px-3 py-2">Confidence</th>
                  <th className="text-left px-3 py-2">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {v.details.etaHistory.map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono">{e.ts}</td>
                    <td className="px-3 py-2 font-mono">{e.eta}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs",
                          e.confidence === "High"
                            ? "bg-green-100 text-green-700"
                            : e.confidence === "Stale"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700",
                        )}
                      >
                        {e.confidence}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{e.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> Driver Checklist Confirmations
          </div>
          <div className="space-y-1.5">
            {v.details.checklistConfirmations.map((c, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between p-2 rounded text-sm",
                  c.confirmed
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200",
                )}
              >
                <div className="flex items-center gap-2">
                  {c.confirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={c.confirmed ? "text-green-800" : "text-red-800"}>{c.item}</span>
                </div>
                {c.ts && <span className="text-xs font-mono text-muted-foreground">{c.ts}</span>}
                {!c.confirmed && (
                  <span className="text-xs text-red-600 font-medium">NOT COMPLETED</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Incident Statement */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> Incident Statement
          </div>
          <blockquote className="p-3 rounded-lg border-l-4 border-l-primary bg-muted/30 text-sm italic">
            {v.details.incidentStatement}
          </blockquote>
        </div>

        {/* Audit Log */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" /> Audit Log
          </div>
          <div className="space-y-1">
            {v.details.auditLog.map((l, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="font-mono text-muted-foreground w-20 shrink-0">{l.ts}</span>
                <span className="text-primary font-medium shrink-0">{l.actor}</span>
                <span className="text-muted-foreground font-mono shrink-0">{l.action}</span>
                <span>{l.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended consequence */}
        <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-1">
            <Gavel className="h-3.5 w-3.5" /> Recommended Consequence
          </div>
          <p className="text-sm leading-relaxed">{v.details.recommendedConsequence}</p>
          <div className="mt-3 flex items-center gap-2">
            <ConsequenceBadge level={v.consequenceLevel} />
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                REVIEW_STATUS_CONFIG[v.reviewStatus].cls,
              )}
            >
              {REVIEW_STATUS_CONFIG[v.reviewStatus].label}
            </span>
          </div>
        </div>

        {/* Evidence */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Evidence Available
          </div>
          <div className="flex flex-wrap gap-1.5">
            {v.evidenceAvailable.map((e) => (
              <span
                key={e}
                className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1"
              >
                <FileText className="h-3 w-3" /> {e}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function AccountabilityEngine() {
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [activeTab, setActiveTab] = useState("violations");

  const criticalCount = VIOLATIONS.filter((v) => v.severity === "critical").length;
  const openActions = CORRECTIVE_ACTIONS.filter((a) => a.status !== "completed").length;
  const overdueActions = CORRECTIVE_ACTIONS.filter((a) => a.status === "overdue").length;
  const watchlistProviders = PROVIDER_SCORES.filter((p) => p.tier === "Watch List").length;
  const restrictedDrivers = DRIVER_SCORES.filter((d) => d.restricted).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Accountability Engine</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Broker-facing compliance dashboard · NEMT provider oversight · Medicaid transportation
            accountability
          </p>
        </div>
        <Badge variant="outline" className="text-xs hidden md:flex">
          For: Brokers · Managed Care Plans · Medicaid Admins
        </Badge>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className={cn(criticalCount > 0 && "border-red-300 bg-red-50/60")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Critical Violations</span>
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                criticalCount > 0 ? "text-red-700" : "text-foreground",
              )}
            >
              {criticalCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TriangleAlert className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Active Violations</span>
            </div>
            <div className="text-2xl font-bold">{VIOLATIONS.length}</div>
          </CardContent>
        </Card>
        <Card className={cn(overdueActions > 0 && "border-red-300")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Overdue Actions</span>
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                overdueActions > 0 ? "text-red-700" : "text-foreground",
              )}
            >
              {overdueActions}
            </div>
          </CardContent>
        </Card>
        <Card className={cn(watchlistProviders > 0 && "border-red-300 bg-red-50/40")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Watch List Providers</span>
            </div>
            <div
              className={cn(
                "text-2xl font-bold",
                watchlistProviders > 0 ? "text-red-700" : "text-foreground",
              )}
            >
              {watchlistProviders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <UserX className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Restricted Drivers</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">{restrictedDrivers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="violations" className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Active Violations
          </TabsTrigger>
          <TabsTrigger value="consequence" className="flex items-center gap-1.5 text-xs">
            <Gavel className="h-3.5 w-3.5" /> Consequence Ladder
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1.5 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Corrective Actions
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" /> Provider Scores
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-1.5 text-xs">
            <Car className="h-3.5 w-3.5" /> Driver Scores
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Active Violations ── */}
        <TabsContent value="violations" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {VIOLATIONS.length} active violations requiring review. Click any row to see full
              evidence.
            </p>
            <Badge variant="outline" className="text-xs">
              {VIOLATIONS.filter((v) => v.reviewStatus === "escalated").length} escalated
            </Badge>
          </div>
          <div className="space-y-2">
            {VIOLATIONS.map((v) => (
              <Card
                key={v.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow border-l-4",
                  v.severity === "critical"
                    ? "border-l-red-500"
                    : v.severity === "high"
                      ? "border-l-orange-500"
                      : "border-l-yellow-400",
                )}
                onClick={() => setSelectedViolation(v)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">{v.id}</span>
                        <span className="text-muted-foreground font-mono text-xs">{v.rideId}</span>
                        <SeverityBadge severity={v.severity} />
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            REVIEW_STATUS_CONFIG[v.reviewStatus].cls,
                          )}
                        >
                          {REVIEW_STATUS_CONFIG[v.reviewStatus].label}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        {VIOLATION_LABELS[v.violationType]}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {v.riderName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" /> {v.driverName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {v.providerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {v.occurredAt.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ConsequenceBadge level={v.consequenceLevel} />
                      <div className="flex flex-wrap gap-1">
                        {v.evidenceAvailable.slice(0, 2).map((e) => (
                          <span
                            key={e}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border"
                          >
                            {e}
                          </span>
                        ))}
                        {v.evidenceAvailable.length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            +{v.evidenceAvailable.length - 2}
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                        <Eye className="h-3.5 w-3.5" /> Review <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Recommended action: </span>
                    {v.recommendedAction}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Consequence Ladder ── */}
        <TabsContent value="consequence" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Structured escalation framework. Repeated violations automatically advance to the next
            level. All decisions are logged.
          </p>
          <div className="space-y-3">
            {([1, 2, 3, 4, 5] as ConsequenceLevel[]).map((level) => {
              const cfg = CONSEQUENCE_CONFIG[level];
              const violationsAtLevel = VIOLATIONS.filter((v) => v.consequenceLevel === level);
              const driversAtLevel = DRIVER_SCORES.filter((d) => d.consequenceLevel === level);
              const icons = [null, Shield, Activity, UserX, Building2, Gavel];
              const Icon = icons[level]!;
              const descriptions = {
                1: "First-time or minor violation. Driver or provider is issued a formal written warning. Warning is logged in the audit trail and counts toward escalation if a second violation occurs within 60 days.",
                2: "Second violation or first violation with significant impact. Required completion of relevant retraining module (e.g. no-show protocol, GPS compliance, sensory accommodation). Assignment continues with monitoring.",
                3: "Third violation, pattern of non-compliance, or single critical safety event (e.g. false no-show on high-sensitivity rider). Driver blocked from specific ride types (high-sensitivity, pediatric, WAV) until retraining is certified complete.",
                4: "Provider-level failure pattern or uncorrected Level 3 issue. Provider placed on formal watchlist. Broker-level monitoring required. Provider must submit Corrective Action Plan (CAP) within 5 business days.",
                5: "Repeated Level 4 failures, fraudulent activity, or risk to rider safety. Formal contract review initiated. Suspension recommended pending state or plan escalation. Requires human broker decision.",
              };
              return (
                <Card
                  key={level}
                  className={cn(
                    "border-l-4",
                    level === 5
                      ? "border-l-red-600"
                      : level === 4
                        ? "border-l-red-400"
                        : level === 3
                          ? "border-l-orange-400"
                          : level === 2
                            ? "border-l-yellow-400"
                            : "border-l-slate-300",
                  )}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        {level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <div className={cn("font-semibold text-sm", cfg.color)}>
                            Level {level} — {cfg.label}
                          </div>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                          {violationsAtLevel.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {violationsAtLevel.length} active{" "}
                              {violationsAtLevel.length === 1 ? "violation" : "violations"}
                            </Badge>
                          )}
                          {driversAtLevel.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {driversAtLevel.length}{" "}
                              {driversAtLevel.length === 1 ? "driver" : "drivers"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {descriptions[level]}
                        </p>
                        {(violationsAtLevel.length > 0 || driversAtLevel.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {violationsAtLevel.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => {
                                  setSelectedViolation(v);
                                  setActiveTab("violations");
                                }}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
                              >
                                {v.id} · {v.driverName}
                              </button>
                            ))}
                            {driversAtLevel.map((d) => (
                              <span
                                key={d.id}
                                className={cn(
                                  "text-[11px] px-2 py-0.5 rounded-full border",
                                  d.restricted
                                    ? "bg-red-50 border-red-300 text-red-700"
                                    : "bg-slate-100 border-slate-300 text-slate-700",
                                )}
                              >
                                {d.name} {d.restricted && "· Restricted"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground mb-2">Automatic Escalation Rules</div>
                <div>• 2nd violation within 60 days → automatically advances to next level</div>
                <div>• Critical severity + high-sensitivity rider → skips to Level 3 minimum</div>
                <div>
                  • Provider-level pattern (3+ violations across drivers in 30 days) → Level 4
                </div>
                <div>
                  • Unresolved Level 4 after 14 days → automatic Level 5 flag for broker review
                </div>
                <div>• All escalations are logged to the audit trail with timestamp and actor</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Corrective Actions ── */}
        <TabsContent value="actions" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {openActions} open corrective actions · {overdueActions} overdue
            </p>
            {overdueActions > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-300 border text-xs">
                {overdueActions} OVERDUE
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {CORRECTIVE_ACTIONS.map((a) => {
              const cfg = ACTION_STATUS_CONFIG[a.status];
              return (
                <Card
                  key={a.id}
                  className={cn(a.status === "overdue" && "border-red-300 bg-red-50/30")}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-wrap items-start gap-3 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              a.entityType === "driver"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700",
                            )}
                          >
                            {a.entityType === "driver" ? "Driver" : "Provider"}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", cfg.cls)}>
                            {cfg.label}
                          </span>
                          <ConsequenceBadge level={a.consequenceLevel} />
                        </div>
                        <div className="font-medium text-sm">{a.entityName}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {a.actionRequired}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Ref: {a.violationRef}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {a.assignedTo}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 font-medium",
                              a.status === "overdue" ? "text-red-600" : "",
                            )}
                          >
                            <Clock className="h-3 w-3" /> Due: {a.dueDate}
                          </span>
                        </div>
                      </div>
                      {a.status === "overdue" && (
                        <div className="flex items-center gap-1 text-xs text-red-700 font-semibold bg-red-100 px-2 py-1 rounded">
                          <AlertTriangle className="h-3.5 w-3.5" /> Broker Action Required
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB: Provider Scores ── */}
        <TabsContent value="providers" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Composite accountability scores derived from on-time rate, complaint rate, sensory
            failures, GPS events, disputes, and corrective action completion.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {PROVIDER_SCORES.sort((a, b) => a.score - b.score).map((p) => (
              <Card
                key={p.id}
                className={cn(
                  p.tier === "Watch List" && "border-red-300 bg-red-50/20",
                  p.trend === "down" && "shadow-sm",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <TierBadge tier={p.tier} />
                        {p.trend === "down" && (
                          <span className="text-xs text-red-600 flex items-center gap-0.5">
                            <TrendingDown className="h-3 w-3" /> Trending down
                          </span>
                        )}
                        {p.trend === "up" && (
                          <span className="text-xs text-green-600 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" /> Improving
                          </span>
                        )}
                        {p.activeViolations > 0 && (
                          <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                            {p.activeViolations} active{" "}
                            {p.activeViolations === 1 ? "violation" : "violations"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-3xl font-bold tabular-nums", scoreColor(p.score))}>
                        {p.score}
                      </div>
                      <div className="text-[10px] text-muted-foreground">/100</div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", scoreBarColor(p.score))}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <ScoreBar score={p.onTimeRate} label="On-time rate" />
                    <ScoreBar score={1 - p.complaintRate} label="Complaint-free rate" />
                    <ScoreBar score={1 - p.sensoryFailureRate} label="Sensory compliance" />
                    <ScoreBar
                      score={Math.max(0, 1 - p.staleGpsEvents / 30)}
                      label="GPS reliability"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      {
                        label: "False No-Shows",
                        value: p.falseNoShowDisputes,
                        bad: p.falseNoShowDisputes > 2,
                      },
                      { label: "Missed Pickups", value: p.missedPickups, bad: p.missedPickups > 8 },
                      {
                        label: "Unresolved Inc.",
                        value: p.unresolvedIncidents,
                        bad: p.unresolvedIncidents > 3,
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className={cn(
                          "text-center p-2 rounded border",
                          m.bad ? "bg-red-50 border-red-200" : "bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            m.bad ? "text-red-700" : "",
                          )}
                        >
                          {m.value}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t">
                    <span className="text-muted-foreground">Corrective actions on-time</span>
                    <span
                      className={cn(
                        "font-semibold",
                        p.correctiveActionsOnTime < 60
                          ? "text-red-600"
                          : p.correctiveActionsOnTime < 80
                            ? "text-orange-600"
                            : "text-green-600",
                      )}
                    >
                      {p.correctiveActionsOnTime}%
                    </span>
                  </div>
                  {p.tier === "Watch List" && (
                    <div className="flex items-center gap-2 p-2 rounded bg-red-100 border border-red-300 text-xs text-red-800">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      On Watch List. Contract review recommended if score does not improve within 30
                      days.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Driver Scores ── */}
        <TabsContent value="drivers" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Individual driver accountability scores. Restricted drivers are blocked from specific
            assignment types based on active violations.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {DRIVER_SCORES.sort((a, b) => a.score - b.score).map((d) => (
              <Card key={d.id} className={cn(d.restricted && "border-red-300 bg-red-50/20")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{d.name}</CardTitle>
                        {d.restricted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                            <UserX className="h-3 w-3" /> RESTRICTED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{d.providerName}</span>
                        <ConsequenceBadge level={d.consequenceLevel} />
                        {d.activeViolations > 0 && (
                          <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                            {d.activeViolations} violation{d.activeViolations > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-3xl font-bold tabular-nums", scoreColor(d.score))}>
                        {d.score}
                      </div>
                      <div className="text-[10px] text-muted-foreground">/100</div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", scoreBarColor(d.score))}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <ScoreBar score={d.onTimeRate} label="On-time rate" />
                    <ScoreBar score={d.gpsReliability} label="GPS reliability" />
                    <ScoreBar score={d.statusAccuracy} label="Status accuracy" />
                    <ScoreBar score={d.checklistCompletion} label="Checklist completion" />
                    <ScoreBar score={1 - d.complaintRate} label="Complaint-free rate" />
                    <ScoreBar score={d.accommodationCompliance} label="Accommodation compliance" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      {
                        label: "False No-Show Disputes",
                        value: d.falseNoShowDisputes,
                        bad: d.falseNoShowDisputes > 1,
                      },
                      {
                        label: "Blocked Rider History",
                        value: d.blockedRiderHistory,
                        bad: d.blockedRiderHistory > 0,
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className={cn(
                          "text-center p-2 rounded border",
                          m.bad ? "bg-red-50 border-red-200" : "bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            m.bad ? "text-red-700" : "",
                          )}
                        >
                          {m.value}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  {d.restricted && d.restrictionReason && (
                    <div className="p-2 rounded bg-red-100 border border-red-300 text-xs text-red-800 flex items-start gap-2">
                      <UserX className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{d.restrictionReason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Violation detail dialog */}
      <Dialog
        open={!!selectedViolation}
        onOpenChange={(open) => !open && setSelectedViolation(null)}
      >
        {selectedViolation && (
          <ViolationDetail v={selectedViolation} onClose={() => setSelectedViolation(null)} />
        )}
      </Dialog>
    </div>
  );
}
