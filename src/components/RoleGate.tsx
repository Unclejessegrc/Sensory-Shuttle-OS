import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { personaCanAccess, type AccessRole } from "@/lib/access-control";
import type { Role } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const DEMO_ROLES: Role[] = [
  "dispatcher",
  "driver",
  "caregiver",
  "provider_admin",
  "broker_admin",
  "facility_viewer",
  "system_admin",
];

function readDemoRoleFromHash(): Role | null {
  if (typeof window === "undefined") return null;
  const demoRole = window.location.hash.match(/demoRole=([^&]+)/)?.[1];
  return DEMO_ROLES.includes(demoRole as Role) ? (demoRole as Role) : null;
}

/**
 * Wrap any page section that requires specific role(s).
 * In demo mode, the selected persona controls what the presenter can show.
 *
 * Persona priority (highest first):
 *   1. URL hash `#demoRole=<value>` — re-read on EVERY location change (covers
 *      both `hashchange` events AND TanStack-Router programmatic navigations
 *      which do not fire `hashchange`).
 *   2. Store role (persisted in localStorage as `ssos-role`).
 */
export function RoleGate({ allow, children }: { allow: AccessRole[]; children: React.ReactNode }) {
  const { role, setRole } = useStore();
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  // useRouterState gives us a fresh location object on every SPA navigation,
  // even when only the hash changes via Link/pushState — which `hashchange`
  // misses. The hash string is used as the effect dependency.
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    const next = readDemoRoleFromHash();
    setDemoRole(next);
    // Propagate to the store so the rest of the app (sidebar, scope label,
    // access-control filters) stays consistent with the URL.
    if (next && next !== role) setRole(next);
    const sync = () => setDemoRole(readDemoRoleFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
    // role/setRole intentionally omitted — setRole is stable, role check is
    // a one-way sync from URL → store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  if (personaCanAccess(demoRole ?? role, allow)) return <>{children}</>;

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Not in this demo role</h2>
          <p className="text-sm text-muted-foreground">
            Switch the demo persona from the sidebar to show this screen for another position.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/demo">Back to demo roles</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
