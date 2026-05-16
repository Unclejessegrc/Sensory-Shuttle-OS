import type { DbRole } from "@/lib/auth";
import {
  drivers,
  providers,
  riders,
  type Driver,
  type DriverTelemetry,
  type Incident,
  type Provider,
  type Ride,
  type Rider,
  type Role,
} from "@/lib/mock-data";
import type { RegisteredRider } from "@/lib/registered-riders";

export type AccessScope = {
  role: DbRole | "pending";
  label: string;
  scopeLabel: string;
  network: boolean;
  sensitive: boolean;
  providerId?: string;
  driverId?: string;
  riderIds: string[];
};
export type AccessRole = DbRole | Role;

const DEMO_PROVIDER_ID = "p1";
const DEMO_DRIVER_ID = "d1";
const DEMO_CAREGIVER_RIDER_IDS = ["r1", "RR-1001"];

const REGISTERED_TO_LEGACY_RIDER: Record<string, string> = {
  "RR-1001": "r1",
  "RR-1002": "r2",
  "RR-1006": "r3",
};

const LEGACY_TO_REGISTERED_RIDER = Object.fromEntries(
  Object.entries(REGISTERED_TO_LEGACY_RIDER).map(([registeredId, legacyId]) => [
    legacyId,
    registeredId,
  ]),
) as Record<string, string>;

export function primaryDbRole(roles: DbRole[]): DbRole | "pending" {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("broker")) return "broker";
  if (roles.includes("provider")) return "provider";
  if (roles.includes("dispatcher")) return "dispatcher";
  if (roles.includes("driver")) return "driver";
  if (roles.includes("caregiver")) return "caregiver";
  return "pending";
}

export function roleToPersona(role: DbRole | "pending"): Role | undefined {
  if (role === "admin") return "system_admin";
  if (role === "broker") return "broker_admin";
  if (role === "provider") return "provider_admin";
  if (role === "dispatcher") return "dispatcher";
  if (role === "driver") return "driver";
  if (role === "caregiver") return "caregiver";
  return undefined;
}

export function personaToDbRole(role: Role): DbRole {
  if (role === "system_admin") return "admin";
  if (role === "broker_admin") return "broker";
  if (role === "provider_admin") return "provider";
  if (role === "driver") return "driver";
  if (role === "caregiver") return "caregiver";
  return "dispatcher";
}

export function personaCanAccess(persona: Role, allow: AccessRole[]) {
  if (!allow.length) return false;
  if (allow.includes(persona)) return true;
  const role = personaToDbRole(persona);
  if (persona === "system_admin" || persona === "broker_admin") return true;
  return allow.includes(role);
}

export function getAccessScope(roles: DbRole[], persona?: Role): AccessScope {
  const role = persona ? personaToDbRole(persona) : primaryDbRole(roles);

  if (persona === "facility_viewer") {
    return {
      role: "pending",
      label: "Facility / care team",
      scopeLabel: "Read-only appointment transportation status",
      network: false,
      sensitive: false,
      riderIds: [],
    };
  }

  if (role === "admin" || role === "broker") {
    return {
      role,
      label: role === "admin" ? "Health plan / payer administrator" : "Transportation broker admin",
      scopeLabel: role === "admin" ? "Payer oversight" : "Broker network operations",
      network: true,
      sensitive: true,
      riderIds: [],
    };
  }

  if (persona === "dispatcher") {
    return {
      role: "dispatcher",
      label: "Member services / ride booking agent",
      scopeLabel: "Ride booking desk",
      network: true,
      sensitive: false,
      riderIds: [],
    };
  }

  if (role === "provider" || role === "dispatcher") {
    const provider = providers.find((item) => item.id === DEMO_PROVIDER_ID);
    return {
      role,
      label: role === "provider" ? "Transportation provider" : "Member services",
      scopeLabel: provider ? `${provider.name} provider operations` : "Assigned provider only",
      network: false,
      sensitive: false,
      providerId: DEMO_PROVIDER_ID,
      riderIds: [],
    };
  }

  if (role === "driver") {
    const driver = drivers.find((item) => item.id === DEMO_DRIVER_ID);
    const provider = providers.find((item) => item.id === driver?.providerId);
    return {
      role,
      label: "Driver",
      scopeLabel: driver ? `${driver.name} assigned rides only` : "Assigned driver rides only",
      network: false,
      sensitive: false,
      providerId: driver?.providerId,
      driverId: DEMO_DRIVER_ID,
      riderIds: [],
    };
  }

  if (role === "caregiver") {
    return {
      role,
      label: "Rider / caregiver",
      scopeLabel: "Your rider's trips only",
      network: false,
      sensitive: false,
      riderIds: DEMO_CAREGIVER_RIDER_IDS,
    };
  }

  return {
    role,
    label: "Access pending",
    scopeLabel: "No records assigned yet",
    network: false,
    sensitive: false,
    riderIds: [],
  };
}

export function linkedRiderIds(riderId: string): string[] {
  const ids = new Set([riderId]);
  const legacyId = REGISTERED_TO_LEGACY_RIDER[riderId];
  const registeredId = LEGACY_TO_REGISTERED_RIDER[riderId];
  if (legacyId) ids.add(legacyId);
  if (registeredId) ids.add(registeredId);
  return [...ids];
}

export function hasRiderAccess(scope: AccessScope, riderId: string) {
  if (scope.network) return true;
  const allowed = new Set(scope.riderIds.flatMap(linkedRiderIds));
  return linkedRiderIds(riderId).some((id) => allowed.has(id));
}

export function canAccessRide(scope: AccessScope, ride: Ride) {
  if (scope.network) return true;
  if (scope.driverId) return ride.driverId === scope.driverId;
  if (scope.providerId) return ride.providerId === scope.providerId;
  return hasRiderAccess(scope, ride.riderId);
}

export function filterRidesForScope(scope: AccessScope, allRides: Ride[]) {
  return allRides.filter((ride) => canAccessRide(scope, ride));
}

export function filterProvidersForScope(scope: AccessScope, allProviders: Provider[] = providers) {
  if (scope.network) return allProviders;
  if (!scope.providerId) return [];
  return allProviders.filter((provider) => provider.id === scope.providerId);
}

export function filterDriversForScope(scope: AccessScope, allDrivers: Driver[] = drivers) {
  if (scope.network) return allDrivers;
  if (scope.driverId) return allDrivers.filter((driver) => driver.id === scope.driverId);
  if (scope.providerId)
    return allDrivers.filter((driver) => driver.providerId === scope.providerId);
  return [];
}

export function filterRidersForScope(
  scope: AccessScope,
  allRides: Ride[],
  allRiders: Rider[] = riders,
) {
  if (scope.network) return allRiders;
  const rideRiderIds = new Set(
    filterRidesForScope(scope, allRides).flatMap((ride) => linkedRiderIds(ride.riderId)),
  );
  return allRiders.filter((rider) => rideRiderIds.has(rider.id) || hasRiderAccess(scope, rider.id));
}

export function filterRegisteredRidersForScope(
  scope: AccessScope,
  allRiders: RegisteredRider[],
  allRides: Ride[],
) {
  if (scope.network) return allRiders;
  const rideRiderIds = new Set(
    filterRidesForScope(scope, allRides).flatMap((ride) => linkedRiderIds(ride.riderId)),
  );
  return allRiders.filter((rider) => rideRiderIds.has(rider.id) || hasRiderAccess(scope, rider.id));
}

export function canAccessRegisteredRider(scope: AccessScope, riderId: string, allRides: Ride[]) {
  if (scope.network || hasRiderAccess(scope, riderId)) return true;
  const allowedRiderIds = new Set(
    filterRidesForScope(scope, allRides).flatMap((ride) => linkedRiderIds(ride.riderId)),
  );
  return linkedRiderIds(riderId).some((id) => allowedRiderIds.has(id));
}

export function canCreateRegisteredRider(persona: Role) {
  return persona === "broker_admin" || persona === "dispatcher" || persona === "system_admin";
}

export function canViewPastIncidentDetails(role: Role) {
  return role === "broker_admin" || role === "system_admin";
}

export function canViewRestrictedIncidentMetadata(role: Role) {
  return role === "dispatcher" || role === "provider_admin";
}

export function canOpenEvidencePacket(
  role: Role,
  incident: Pick<Incident, "id">,
  currentSessionCreatedIncidentId?: string | null,
) {
  return canViewPastIncidentDetails(role) || incident.id === currentSessionCreatedIncidentId;
}

export function canFileNewIssue(role: Role) {
  return (
    role === "dispatcher" ||
    role === "provider_admin" ||
    role === "broker_admin" ||
    role === "system_admin"
  );
}

export function canGenerateNewIssuePacket(
  role: Role,
  incident: Pick<Incident, "id">,
  currentSessionCreatedIncidentId?: string | null,
) {
  return canOpenEvidencePacket(role, incident, currentSessionCreatedIncidentId);
}

export function canAddRiderAuditNote(role: Role) {
  return role === "dispatcher" || role === "broker_admin" || role === "system_admin";
}

export function canViewRiderAuditNotes(role: Role) {
  return role === "broker_admin" || role === "system_admin";
}

export function canViewRestrictedIncidentStatus(role: Role) {
  return (
    canViewPastIncidentDetails(role) ||
    canViewRestrictedIncidentMetadata(role) ||
    role === "dispatcher"
  );
}

export function canAccessLegacyRider(scope: AccessScope, riderId: string, allRides: Ride[]) {
  return canAccessRegisteredRider(scope, riderId, allRides);
}

export function filterTelemetryForScope(
  scope: AccessScope,
  telemetry: DriverTelemetry[],
  allRides: Ride[],
) {
  if (scope.network) return telemetry;
  const visibleRides = filterRidesForScope(scope, allRides);
  const visibleDriverIds = new Set(visibleRides.map((ride) => ride.driverId).filter(Boolean));
  if (scope.driverId) visibleDriverIds.add(scope.driverId);
  if (scope.providerId) {
    filterDriversForScope(scope).forEach((driver) => visibleDriverIds.add(driver.id));
  }
  return telemetry.filter(
    (item) =>
      visibleDriverIds.has(item.driverId) ||
      (!!item.currentRideId && visibleRides.some((ride) => ride.id === item.currentRideId)),
  );
}

export function filterIncidentsForScope(scope: AccessScope, incidents: Incident[]) {
  if (scope.network) return incidents;
  if (scope.driverId) return incidents.filter((incident) => incident.driverId === scope.driverId);
  if (scope.providerId)
    return incidents.filter((incident) => incident.providerId === scope.providerId);
  return incidents.filter((incident) => hasRiderAccess(scope, incident.riderId));
}

export function canSeeSensitiveNetworkData(scope: AccessScope) {
  return scope.sensitive;
}
