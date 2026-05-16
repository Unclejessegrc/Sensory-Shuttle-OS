import type { Ride, Rider, Role } from "@/lib/mock-data";
import type { RegisteredRider } from "@/lib/registered-riders";
import type { ExternalPartner } from "@/lib/ai-dispatch";

export const EXTERNAL_RIDESHARE_FALLBACK_REASONS = [
  "Emergency appointment",
  "Same-day sick visit",
  "Ride booked outside required 24-hour scheduling window",
  "Assigned provider unavailable",
  "Assigned driver unavailable",
  "No in-network driver available within pickup window",
  "Original ride canceled by provider",
  "Original driver no-show",
  "Vehicle accommodation mismatch",
  "ETA risk would cause missed appointment",
  "Caregiver requested urgent fallback",
  "Broker supervisor approved fallback",
  "Weather or traffic disruption",
  "System outage or dispatch failure",
  "Other approved operational exception",
] as const;

export type ExternalRideshareFallbackReason = (typeof EXTERNAL_RIDESHARE_FALLBACK_REASONS)[number];

export type RideshareWarningId =
  | "pediatric"
  | "high_sensory"
  | "wheelchair"
  | "caregiver"
  | "specialty_equipment";

export type RideshareWarning = {
  id: RideshareWarningId;
  title: string;
  message: string;
};

export type RideshareWarningFlags = {
  pediatric: boolean;
  highSensory: boolean;
  wheelchair: boolean;
  caregiver: boolean;
  boosterSeat: boolean;
  walker: boolean;
  specialtyEquipment: boolean;
};

export function ridesharePartnerLabel(partner: ExternalPartner) {
  return partner === "lyft" ? "Lyft Concierge" : "Uber Health";
}

function hasAny(items: string[] | undefined, values: string[]) {
  return (items ?? []).some((item) => values.includes(item));
}

export function buildRideshareWarningContext(
  rider?: Rider,
  registeredRider?: RegisteredRider,
): { warnings: RideshareWarning[]; flags: RideshareWarningFlags } {
  const pediatric =
    rider?.ageGroup === "child" ||
    rider?.ageGroup === "teen" ||
    registeredRider?.ageGroup === "Pediatric";
  const highSensory =
    rider?.sensorySensitivity === "high" || registeredRider?.sensorySupport === "High";
  const wheelchair =
    !!rider?.wheelchairRequired ||
    hasAny(registeredRider?.mobilityNeeds, ["Wheelchair", "Power Wheelchair"]);
  const caregiver = !!rider?.caregiverRequired || !!registeredRider?.caregiverRequired;
  const boosterSeat =
    !!rider?.boosterSeatRequired ||
    hasAny(registeredRider?.mobilityNeeds, ["Booster Seat", "Car Seat"]);
  const walker = !!rider?.walkerRequired || hasAny(registeredRider?.mobilityNeeds, ["Walker"]);
  const specialtyEquipment =
    wheelchair ||
    boosterSeat ||
    walker ||
    hasAny(registeredRider?.mobilityNeeds, ["Stretcher"]) ||
    (registeredRider?.requiredVehicleFeatures.length ?? 0) > 0;

  const warnings: RideshareWarning[] = [];
  if (pediatric) {
    warnings.push({
      id: "pediatric",
      title: "Pediatric rider warning",
      message:
        "Pediatric rider warning: This rider is a child. Confirm caregiver attendance, pickup handoff instructions, and appointment urgency before booking external rideshare.",
    });
  }
  if (highSensory) {
    warnings.push({
      id: "high_sensory",
      title: "High sensory warning",
      message:
        "This rider has documented high sensory needs. Confirm the fallback reason and review support needs before booking external rideshare.",
    });
  }
  if (wheelchair) {
    warnings.push({
      id: "wheelchair",
      title: "Wheelchair warning",
      message:
        "This rider has documented wheelchair accommodations. Confirm the fallback reason and review support needs before booking external rideshare.",
    });
  }
  if (caregiver) {
    warnings.push({
      id: "caregiver",
      title: "Caregiver attendance warning",
      message:
        "This rider requires caregiver attendance. Confirm the fallback reason, handoff instructions, and caregiver availability before booking external rideshare.",
    });
  }
  if (specialtyEquipment) {
    warnings.push({
      id: "specialty_equipment",
      title: "Specialty equipment warning",
      message:
        "This rider has documented accommodations. Confirm the fallback reason and review support needs before booking external rideshare.",
    });
  }

  return {
    warnings,
    flags: {
      pediatric,
      highSensory,
      wheelchair,
      caregiver,
      boosterSeat,
      walker,
      specialtyEquipment,
    },
  };
}

export function rideshareAuditDetails({
  rideId,
  riderId,
  role,
  reason,
  timestamp,
  warnings,
  flags,
  partner,
}: {
  rideId: string;
  riderId: string;
  role: Role;
  reason: ExternalRideshareFallbackReason;
  timestamp: string;
  warnings: RideshareWarning[];
  flags: RideshareWarningFlags;
  partner: ExternalPartner;
}) {
  const warningsShown = warnings.map((warning) => warning.title).join(", ") || "None";
  return [
    `Ride ID: ${rideId}`,
    `Rider ID: ${riderId}`,
    `User role: ${role}`,
    `External rideshare partner: ${ridesharePartnerLabel(partner)}`,
    `Selected fallback reason: ${reason}`,
    `Timestamp: ${timestamp}`,
    `Accommodation warnings shown: ${warningsShown}`,
    `Pediatric rider: ${flags.pediatric ? "yes" : "no"}`,
    `High sensory needs: ${flags.highSensory ? "yes" : "no"}`,
    `Wheelchair required: ${flags.wheelchair ? "yes" : "no"}`,
    `Caregiver required: ${flags.caregiver ? "yes" : "no"}`,
    `Booster seat required: ${flags.boosterSeat ? "yes" : "no"}`,
    `Walker required: ${flags.walker ? "yes" : "no"}`,
    `Specialty equipment required: ${flags.specialtyEquipment ? "yes" : "no"}`,
    `Supervisor approval selected as reason: ${
      reason === "Broker supervisor approved fallback" ? "yes" : "no"
    }`,
  ].join(" | ");
}

export function rideshareDetailNotes(
  reason: ExternalRideshareFallbackReason,
  warnings: RideshareWarning[],
) {
  return [
    `Fallback reason required: ${reason}`,
    ...warnings.map((warning) => `Accommodation warning shown: ${warning.title}`),
  ];
}

export function rideLinkedRegisteredRider(ride: Ride, registeredRiders: RegisteredRider[]) {
  return registeredRiders.find(
    (rider) =>
      rider.id === ride.riderId ||
      rider.id.toLowerCase().replace("rr-", "r") === ride.riderId ||
      ride.riderId.toLowerCase().replace("r", "rr-100") === rider.id.toLowerCase(),
  );
}
