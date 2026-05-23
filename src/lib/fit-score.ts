import type { Driver, Incident, Provider, Ride, Rider, Vehicle } from "./mock-data";

export interface FitScoreResult {
  score: number;
  pass: boolean;
  hardFails: string[];
  warnings: string[];
  factors: { label: string; weight: number; earned: number }[];
}

function toMinutes(value?: string) {
  if (!value) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function rideStartMinutes(ride: Ride) {
  const d = new Date(ride.scheduledPickupISO);
  return d.getHours() * 60 + d.getMinutes();
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function evaluateDriverForRide(
  ride: Ride,
  rider: Rider,
  driver: Driver,
  vehicle: Vehicle,
  provider: Provider,
  allRides: Ride[] = [],
  incidents: Incident[] = [],
): FitScoreResult {
  const hardFails: string[] = [];
  const warnings: string[] = [];
  const tripMinutes = ride.estimatedTripMinutes ?? 55;
  const bufferMinutes = ride.bufferMinutes ?? 15;
  const requiredMinutes = tripMinutes + bufferMinutes;
  const start = rideStartMinutes(ride);
  const end = start + requiredMinutes;
  const shiftStart = toMinutes(driver.shiftStart ?? "07:00");
  const shiftEnd = toMinutes(driver.shiftEnd ?? "18:00");
  const availableMinutes = Math.max(0, shiftEnd - start);
  const sameDayBookings = allRides.filter(
    (booked) =>
      booked.id !== ride.id &&
      booked.driverId === driver.id &&
      booked.appointmentDate === ride.appointmentDate &&
      !["canceled", "completed", "no_show"].includes(booked.status),
  );
  const overlappingBooking = sameDayBookings.find((booked) => {
    const bookedStart = rideStartMinutes(booked);
    const bookedEnd =
      bookedStart + (booked.estimatedTripMinutes ?? 55) + (booked.bufferMinutes ?? 15);
    return overlaps(start, end, bookedStart, bookedEnd);
  });
  const openSafetyIncident = incidents.find(
    (incident) =>
      incident.driverId === driver.id &&
      incident.status !== "resolved" &&
      /unsafe|sensory|no show|wrong vehicle|never arrived/i.test(incident.issueType),
  );

  if (
    ride.estimatedDistanceMiles &&
    driver.serviceRadiusMiles &&
    ride.estimatedDistanceMiles > driver.serviceRadiusMiles
  ) {
    hardFails.push(
      `Driver is outside service radius: ride is ${ride.estimatedDistanceMiles} miles and driver radius is ${driver.serviceRadiusMiles} miles.`,
    );
  }
  if (start < shiftStart || end > shiftEnd || availableMinutes < requiredMinutes) {
    hardFails.push(
      `Driver has ${availableMinutes} minutes available. Proposed ride requires ${tripMinutes} minutes plus a ${bufferMinutes} minute buffer. Do not assign.`,
    );
  }
  if (overlappingBooking) {
    hardFails.push(
      `Driver is overbooked with ${overlappingBooking.id} in the same pickup/dropoff window.`,
    );
  }
  if (rider.ageGroup === "child" && !driver.pediatricCertified) {
    hardFails.push("Pediatric rider requires a pediatric-trained driver.");
  }
  if (rider.sensorySensitivity === "high" && !driver.sensoryTrained) {
    hardFails.push("High sensory rider requires a sensory-trained driver.");
  }
  if (
    rider.sensorySensitivity === "high" &&
    !ride.explicitlyApprovedSharedRide &&
    ((ride.extraPassengers ?? 0) > (ride.caregiverAttending ? 1 : 0) ||
      (ride.unrelatedSharedRiders ?? 0) > 0 ||
      (ride.noSharedRideRequired && vehicle.capacity < (ride.caregiverAttending ? 3 : 2)))
  ) {
    hardFails.push(
      "High sensory rider requires no overcrowding or extra passengers. This driver/vehicle is not eligible for this assignment.",
    );
  }
  if (rider.wheelchairRequired && !vehicle.wheelchairAccessible) {
    hardFails.push("Wheelchair required but vehicle is not wheelchair accessible.");
  }
  if (rider.boosterSeatRequired && !vehicle.hasBooster) {
    hardFails.push("Booster seat required but no booster available.");
  }
  if (ride.vehicleTypeRequired && vehicle.type !== ride.vehicleTypeRequired) {
    hardFails.push(`Driver lacks required vehicle type: ${ride.vehicleTypeRequired}.`);
  }
  if (rider.blockedDrivers.includes(driver.id))
    hardFails.push("Driver is on the rider's blocked list.");
  if (openSafetyIncident)
    hardFails.push(`Driver has unresolved safety incident ${openSafetyIncident.id}.`);
  if (provider.complianceStatus && provider.complianceStatus !== "Compliant") {
    hardFails.push(
      "Driver has expired provider compliance status or conditional compliance review.",
    );
  }
  if (driver.acceptingRides === false) hardFails.push("Driver is not accepting rides right now.");

  const factors = [
    {
      label: "Distance from pickup / service radius",
      weight: 12,
      earned:
        ride.estimatedDistanceMiles && driver.serviceRadiusMiles
          ? Math.max(
              0,
              Math.round(
                12 * (1 - ride.estimatedDistanceMiles / (driver.serviceRadiusMiles * 1.4)),
              ),
            )
          : 8,
    },
    {
      label: "Available time and buffer",
      weight: 14,
      earned: overlappingBooking || availableMinutes < requiredMinutes ? 0 : 14,
    },
    {
      label: "Certification match",
      weight: 16,
      earned:
        (driver.wheelchairCertified || !rider.wheelchairRequired ? 5 : 0) +
        (driver.pediatricCertified || rider.ageGroup !== "child" ? 6 : 0) +
        (driver.sensoryTrained || rider.sensorySensitivity !== "high" ? 5 : 0),
    },
    {
      label: "Sensory training match",
      weight: 12,
      earned: driver.sensoryTrained ? 12 : rider.sensorySensitivity === "low" ? 7 : 0,
    },
    {
      label: "Vehicle suitability",
      weight: 12,
      earned:
        (rider.wheelchairRequired ? (vehicle.wheelchairAccessible ? 6 : 0) : 6) +
        (rider.boosterSeatRequired ? (vehicle.hasBooster ? 6 : 0) : 6),
    },
    { label: "On-time history", weight: 10, earned: Math.round(driver.onTimeRate * 10) },
    {
      label: "Complaint / incident history",
      weight: 10,
      earned: Math.max(0, 10 - (driver.complaintCount ?? 0) - (openSafetyIncident ? 5 : 0)),
    },
    {
      label: "Current workload / overbooking risk",
      weight: 8,
      earned: sameDayBookings.length > 2 ? 3 : overlappingBooking ? 0 : 8,
    },
    {
      label: "No shared ride requirement",
      weight: 6,
      earned: hardFails.some((f) => f.includes("High sensory rider requires no overcrowding"))
        ? 0
        : 6,
    },
  ];

  if (driver.complaintRate > 0.05) warnings.push("Driver complaint rate above 5%.");
  if (sameDayBookings.length >= 2) warnings.push("Driver already has multiple booked rides today.");
  if (rider.needsQuietRide && !vehicle.features.includes("Quiet Cabin"))
    warnings.push("Quiet ride preferred but quiet cabin is not listed.");

  let score = factors.reduce((sum, factor) => sum + factor.earned, 0);
  if (hardFails.length) score = Math.min(score, 35);
  return { score, pass: hardFails.length === 0 && score >= 70, hardFails, warnings, factors };
}

export function computeFitScore(
  rider: Rider,
  driver: Driver,
  vehicle: Vehicle,
  providerOnTime = 0.9,
): FitScoreResult {
  const provider: Provider = {
    id: driver.providerId,
    name: "Demo provider",
    tier: "Standard",
    completedRides: 0,
    onTimeRate: providerOnTime,
    complaintRate: driver.complaintRate,
    canceledRides: 0,
    disputedNoShows: 0,
    staleGpsEvents: 0,
    etaAccuracy: providerOnTime,
    riderSatisfaction: 4.5,
    sensoryFailureRate: 0,
    highSensitivitySuccessRate: providerOnTime,
    complianceStatus: "Compliant",
  };
  const demoRide: Ride = {
    id: "fit-preview",
    riderId: rider.id,
    providerId: driver.providerId,
    pickupAddress: "Mock pickup site",
    dropoffAddress: "Mock dropoff site",
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTime: "10:00",
    appointmentType: "Fit preview",
    returnRideNeeded: false,
    caregiverAttending: rider.caregiverRequired,
    specialInstructions: "",
    fundingSource: rider.fundingSource,
    status: "scheduled",
    etaConfidence: "high",
    etaReasons: [],
    gpsLastUpdateMin: 0,
    driverMoving: false,
    scheduledPickupISO: new Date().toISOString(),
    noSharedRideRequired: rider.sensorySensitivity === "high",
  };
  return evaluateDriverForRide(demoRide, rider, driver, vehicle, provider);
}
