import type { Driver, Rider, Vehicle } from "./mock-data";

export interface FitScoreResult {
  score: number;
  pass: boolean;
  hardFails: string[];
  warnings: string[];
  factors: { label: string; weight: number; earned: number }[];
}

export function computeFitScore(
  rider: Rider,
  driver: Driver,
  vehicle: Vehicle,
  providerOnTime = 0.9,
): FitScoreResult {
  const hardFails: string[] = [];
  const warnings: string[] = [];

  if (rider.wheelchairRequired && !vehicle.wheelchairAccessible)
    hardFails.push("Wheelchair required but vehicle is not wheelchair accessible.");
  if (rider.boosterSeatRequired && !vehicle.hasBooster)
    hardFails.push("Booster seat required but no booster available.");
  if (rider.sensorySensitivity === "high" && !driver.sensoryTrained)
    hardFails.push("High sensory rider assigned to driver without sensory training.");
  if (rider.blockedDrivers.includes(driver.id))
    hardFails.push("Driver is on the rider's blocked list.");
  if (rider.caregiverRequired && vehicle.capacity < 3)
    hardFails.push("Caregiver required but vehicle capacity is too low.");

  const factors = [
    {
      label: "Driver sensory training",
      weight: 20,
      earned: driver.sensoryTrained ? 20 : rider.sensorySensitivity === "low" ? 14 : 4,
    },
    {
      label: "Vehicle accommodation match",
      weight: 25,
      earned: rider.wheelchairRequired ? (vehicle.wheelchairAccessible ? 25 : 0) : 22,
    },
    { label: "Provider on-time rate", weight: 15, earned: Math.round(providerOnTime * 15) },
    {
      label: "Driver complaint rate",
      weight: 10,
      earned: Math.round((1 - Math.min(driver.complaintRate * 10, 1)) * 10),
    },
    {
      label: "Preferred driver match",
      weight: 10,
      earned: rider.preferredDrivers.includes(driver.id) ? 10 : 5,
    },
    { label: "Proximity (placeholder)", weight: 10, earned: 8 },
    { label: "Prior successful rides (placeholder)", weight: 10, earned: 7 },
  ];

  let score = factors.reduce((s, f) => s + f.earned, 0);

  if (rider.sensorySensitivity === "high" && driver.sensoryTrained === false)
    warnings.push("Driver lacks sensory training for a high-sensitivity rider.");
  if (rider.ageGroup === "child" && !driver.pediatricCertified)
    warnings.push("Driver is not pediatric certified.");
  if (driver.complaintRate > 0.05) warnings.push("Driver complaint rate above 5%.");

  if (hardFails.length) score = Math.min(score, 35);

  return { score, pass: hardFails.length === 0 && score >= 70, hardFails, warnings, factors };
}
