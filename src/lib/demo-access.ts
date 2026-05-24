export const PILOT_ASK_COMPLETED_KEY = "sensoryShuttlePilotAskCompleted";
export const PILOT_ASK_SUBMISSION_KEY = "sensoryShuttlePilotAskSubmission";
export const PENDING_DEMO_VIEW_KEY = "sensoryShuttlePendingDemoView";
export const DEMO_ACCESS_UNLOCKED_EVENT = "sensory-shuttle-demo-unlocked";
export const DEFAULT_DEMO_PATH = "/app/dashboard";
export const DEMO_ACCESS_GRANTED_NOTICE =
  "Demo access granted after Pilot Conversation Ask submission.";

const UNGATED_APP_PATHS = ["/app/strategy", "/app/pilot-ask"];

const DESTINATION_LABELS: Array<{ path: string; label: string }> = [
  { path: "/app/dashboard", label: "Dashboard" },
  { path: "/app/book", label: "Ride booking" },
  { path: "/app/registered-riders", label: "Registered riders" },
  { path: "/app/riders", label: "Riders" },
  { path: "/app/dispatch", label: "Dispatch" },
  { path: "/app/driver", label: "Driver View" },
  { path: "/app/caregiver", label: "Caregiver" },
  { path: "/app/facility", label: "Facility / Clinic Viewer" },
  { path: "/app/incidents", label: "Incidents" },
  { path: "/app/providers", label: "Scorecards" },
  { path: "/app/broker", label: "Broker" },
  { path: "/app/accountability", label: "Quality Engine" },
  { path: "/app/audit", label: "Audit Logs" },
  { path: "/app/live-gps", label: "Live GPS" },
  { path: "/app/details", label: "Operational detail" },
  { path: "/app/admin", label: "Admin" },
];

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function isDemoAccessUnlocked() {
  if (!hasBrowserStorage()) return false;
  return window.localStorage.getItem(PILOT_ASK_COMPLETED_KEY) === "true";
}

export function isUngatedAppPath(pathname: string) {
  return UNGATED_APP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isGatedDemoPath(pathname: string) {
  return pathname.startsWith("/app") && !isUngatedAppPath(pathname);
}

export function getCurrentBrowserPath() {
  if (typeof window === "undefined") return DEFAULT_DEMO_PATH;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function getDemoDestinationLabel(pathnameOrUrl: string | null | undefined) {
  const raw = pathnameOrUrl || DEFAULT_DEMO_PATH;
  const pathname = raw.split("?")[0]?.split("#")[0] || DEFAULT_DEMO_PATH;
  const match = DESTINATION_LABELS.find(
    (destination) => pathname === destination.path || pathname.startsWith(`${destination.path}/`),
  );
  return match?.label ?? "Dashboard";
}

export function normalizePendingDemoPath(path: string | null | undefined) {
  if (!path || path === "/app/pilot-ask" || path.startsWith("/app/pilot-ask?")) {
    return DEFAULT_DEMO_PATH;
  }
  return path;
}
