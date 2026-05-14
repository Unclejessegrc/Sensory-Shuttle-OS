import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ROLES, type Role } from "@/lib/mock-data";
import { getAccessScope, personaCanAccess, type AccessRole } from "@/lib/access-control";
import {
  LayoutDashboard,
  Radio,
  Users,
  Car,
  AlertTriangle,
  BarChart3,
  Building2,
  FileSearch,
  CalendarPlus,
  Heart,
  Home,
  BookOpen,
  UserCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Each nav item declares which demo roles may see/access it.
const NAV: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allow: AccessRole[];
}[] = [
  {
    to: "/app/dashboard",
    label: "Operations",
    icon: LayoutDashboard,
    allow: ["broker", "provider"],
  },
  {
    to: "/app/dispatch",
    label: "Dispatch",
    icon: Radio,
    allow: ["dispatcher", "provider", "broker"],
  },
  {
    to: "/app/book",
    label: "Book ride",
    icon: CalendarPlus,
    allow: ["dispatcher", "broker", "caregiver"],
  },
  {
    to: "/app/registered-riders",
    label: "Registered Riders",
    icon: UserCheck,
    allow: ["dispatcher", "broker", "provider"],
  },
  { to: "/app/riders", label: "Riders", icon: Users, allow: ["dispatcher", "broker", "provider"] },
  {
    to: "/app/driver",
    label: "Driver view",
    icon: Car,
    allow: ["driver", "dispatcher", "broker", "provider"],
  },
  {
    to: "/app/caregiver",
    label: "Rider / Caregiver",
    icon: Heart,
    allow: ["caregiver", "dispatcher", "broker"],
  },
  {
    to: "/app/facility",
    label: "Facility view",
    icon: Building2,
    allow: ["facility_viewer"],
  },
  {
    to: "/app/incidents",
    label: "Incidents",
    icon: AlertTriangle,
    allow: ["dispatcher", "broker", "provider"],
  },
  {
    to: "/app/providers",
    label: "Provider operations",
    icon: BarChart3,
    allow: ["provider", "broker"],
  },
  { to: "/app/broker", label: "Network oversight", icon: Building2, allow: ["broker"] },
  {
    to: "/app/accountability",
    label: "Accountability Engine",
    icon: Shield,
    allow: ["broker"],
  },
  { to: "/app/audit", label: "Audit logs", icon: FileSearch, allow: ["broker"] },
  {
    to: "/app/strategy",
    label: "Product strategy",
    icon: BookOpen,
    allow: ["broker", "provider"],
  },
];

const DEMO_ROLE_ORDER: Role[] = [
  "system_admin",
  "broker_admin",
  "dispatcher",
  "provider_admin",
  "driver",
  "caregiver",
  "facility_viewer",
];

const DEMO_ROLES = DEMO_ROLE_ORDER.map((id) => ROLES.find((r) => r.id === id)!).filter(Boolean);

export function AppShell() {
  const { role, setRole } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const accessScope = getAccessScope([], role);

  const visible = NAV.filter((n) => personaCanAccess(role, n.allow));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
            S
          </div>
          <div>
            <div className="font-semibold leading-tight text-sm">Sensory Shuttle</div>
            <div className="text-[11px] text-sidebar-foreground/60">Care-aware NEMT OS</div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 mb-1.5 px-1">
            View demo as
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEMO_ROLES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 px-1">
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
              Access scope
            </div>
            <div className="text-xs truncate text-sidebar-foreground/90">{accessScope.label}</div>
            <div className="text-[10px] text-sidebar-foreground/60 mt-0.5">
              {accessScope.scopeLabel}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visible.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/demo"
              className="flex items-center gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <Home className="h-3.5 w-3.5" /> Demo home
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden border-b bg-card px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-sm">
            Sensory Shuttle OS
          </Link>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEMO_ROLES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>
        <nav className="md:hidden border-b bg-card px-3 py-2 flex gap-2 overflow-x-auto">
          {visible.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-b bg-card px-6 py-2 hidden md:flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">
            Mock data · No real PHI
          </Badge>
          <div className="text-xs text-muted-foreground">
            Viewing as{" "}
            <span className="font-medium text-foreground">
              {DEMO_ROLES.find((r) => r.id === role)?.label}
            </span>{" "}
            · {accessScope.scopeLabel}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
