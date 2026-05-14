import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/mock-data";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarPlus,
  Car,
  FileSearch,
  Heart,
  LayoutDashboard,
  PlayCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo mode - Sensory Shuttle OS" },
      {
        name: "description",
        content:
          "Role-based NEMT operating system demo for payers, brokers, providers, drivers, riders, caregivers, and care teams.",
      },
    ],
  }),
  component: DemoFlow,
});

type DemoTarget =
  | "/app/dashboard"
  | "/app/dispatch"
  | "/app/providers"
  | "/app/driver"
  | "/app/caregiver"
  | "/app/facility"
  | "/app/broker"
  | "/app/incidents"
  | "/app/audit"
  | "/app/strategy";

const PERSONAS: {
  id: Role;
  label: string;
  level: string;
  description: string;
  target: DemoTarget;
  sees: string[];
}[] = [
  {
    id: "system_admin",
    label: "Health Plan / Payer Administrator",
    level: "Top level",
    description:
      "Sees network-level transportation performance, member access risks, missed ride patterns, provider performance, complaint trends, compliance issues, and cost-driving failure points.",
    target: "/app/dashboard",
    sees: ["Payer oversight", "Network performance", "Access risks", "Provider scorecards"],
  },
  {
    id: "broker_admin",
    label: "Transportation Broker Administrator",
    level: "Network operations level",
    description:
      "Sees all ride operations across providers, active trips, GPS accountability, ETA confidence, provider tiers, dispatch risk, incidents, audit logs, and network-level performance.",
    target: "/app/broker",
    sees: ["Broker network", "Live GPS", "Dispatch risk", "Audit logs"],
  },
  {
    id: "dispatcher",
    label: "Member Services / Ride Booking Agent",
    level: "Booking/support level",
    description:
      "Uses the ride booking desk to schedule rides, look up riders, check trip status, support caregivers, review driver details, and handle issues without full administrator access.",
    target: "/app/dispatch",
    sees: ["Dispatch", "Book ride", "Registered riders", "Incidents"],
  },
  {
    id: "provider_admin",
    label: "Transportation Provider Administrator",
    level: "Provider operations level",
    description:
      "Sees only that provider company's assigned drivers, assigned rides, vehicle readiness, GPS compliance, rider transport needs, incidents, and provider scorecard.",
    target: "/app/providers",
    sees: ["Provider operations", "Assigned drivers", "GPS compliance", "Scorecard"],
  },
  {
    id: "driver",
    label: "Driver",
    level: "Field operations level",
    description:
      "Sees only assigned rides, pickup and drop-off details, rider support needs, route status, GPS lock, pre-trip checklist, and issue reporting.",
    target: "/app/driver",
    sees: ["Assigned rides only", "GPS lock", "Checklist", "Issue reporting"],
  },
  {
    id: "caregiver",
    label: "Rider / Caregiver",
    level: "Member-facing level",
    description:
      "Sees only their own ride booking, driver ETA, day-of tracking, support instructions, return ride options, and report/support actions.",
    target: "/app/caregiver",
    sees: ["Request a ride", "Driver ETA", "Tracking", "Support actions"],
  },
  {
    id: "facility_viewer",
    label: "Facility / Care Team Viewer",
    level: "Optional read-only partner level",
    description:
      "Read-only view for clinics, therapy offices, hospitals, schools, or care coordinators to confirm arrival windows, ride status, and appointment transportation status.",
    target: "/app/facility",
    sees: ["Arrival windows", "Ride status", "ETA confidence", "Read-only"],
  },
];

const WALKTHROUGH = [
  {
    n: "01",
    icon: Sparkles,
    title: "Operating system layer",
    duration: "30 sec",
    body: "Sensory Shuttle OS is not only a booking form. It gives transportation networks one care-aware accountability layer for ride matching, ETA confidence, GPS reliability, incidents, provider performance, and rider-specific needs.",
    cta: {
      label: "Read strategy",
      to: "/app/strategy" as DemoTarget,
      role: "system_admin" as Role,
    },
  },
  {
    n: "02",
    icon: LayoutDashboard,
    title: "Payer oversight",
    duration: "1 min",
    body: "Health plan and payer leaders see access risk, missed ride patterns, network performance, complaint trends, and compliance issues without opening field-only workflows.",
    cta: {
      label: "View payer oversight",
      to: "/app/dashboard" as DemoTarget,
      role: "system_admin" as Role,
    },
  },
  {
    n: "03",
    icon: Building2,
    title: "Broker network operations",
    duration: "1 min",
    body: "Transportation broker administrators monitor providers, GPS accountability, provider tiers, ETA confidence, dispatch risk, incidents, and audit logs.",
    cta: {
      label: "Open network oversight",
      to: "/app/broker" as DemoTarget,
      role: "broker_admin" as Role,
    },
  },
  {
    n: "04",
    icon: Radio,
    title: "Ride booking desk",
    duration: "2 min",
    body: "Member services teams can book rides, look up registered riders, support caregivers, review trip status, and handle incidents without full administrator permissions.",
    cta: {
      label: "View booking desk",
      to: "/app/dispatch" as DemoTarget,
      role: "dispatcher" as Role,
    },
  },
  {
    n: "05",
    icon: BarChart3,
    title: "Provider operations",
    duration: "1 min",
    body: "Transportation providers see only their company roster, assigned rides, vehicle readiness, GPS compliance, rider transport needs, incidents, and scorecard.",
    cta: {
      label: "View provider ops",
      to: "/app/providers" as DemoTarget,
      role: "provider_admin" as Role,
    },
  },
  {
    n: "06",
    icon: Car,
    title: "Driver field view",
    duration: "1 min",
    body: "Drivers see assigned work, route status, pickup and drop-off details, support needs, GPS lock, pre-trip checklist, and issue reporting.",
    cta: { label: "View driver", to: "/app/driver" as DemoTarget, role: "driver" as Role },
  },
  {
    n: "07",
    icon: Heart,
    title: "Rider and caregiver access",
    duration: "1 min",
    body: "Riders and caregivers request rides, track day-of ETA, review support instructions, request return rides, and report issues from their own locked view.",
    cta: {
      label: "View rider/caregiver",
      to: "/app/caregiver" as DemoTarget,
      role: "caregiver" as Role,
    },
  },
  {
    n: "08",
    icon: Stethoscope,
    title: "Facility read-only status",
    duration: "30 sec",
    body: "Care teams can confirm arrival windows and appointment transportation status without seeing dispatch controls or unnecessary member information.",
    cta: {
      label: "View facility status",
      to: "/app/facility" as DemoTarget,
      role: "facility_viewer" as Role,
    },
  },
  {
    n: "09",
    icon: AlertTriangle,
    title: "Incident and audit trail",
    duration: "1 min",
    body: "Incidents capture statements, ride telemetry, GPS context, and role-based audit history so disputes can be reviewed by the right person.",
    cta: {
      label: "Open incidents",
      to: "/app/incidents" as DemoTarget,
      role: "dispatcher" as Role,
    },
  },
];

function demoHref(target: DemoTarget, role: Role) {
  return `${target}#demoRole=${role}`;
}

function DemoFlow() {
  const { setRole } = useStore();
  const enterAs = (role: Role) => setRole(role);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/demo" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              S
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">Sensory Shuttle OS</div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                Care-aware NEMT operating system
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline">No login required</Badge>
            <Button asChild>
              <a
                href={demoHref("/app/dashboard", "system_admin")}
                onPointerDown={() => enterAs("system_admin")}
                onClick={() => enterAs("system_admin")}
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                View payer oversight
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-4xl">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
            Demo mode - mock data only
          </Badge>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Role-based NEMT software for every layer of the transportation network
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Demonstrate how payers, brokers, providers, drivers, caregivers, and facilities each see
            the right information, actions, and accountability controls without exposing unnecessary
            data.
          </p>
        </div>

        <div className="mt-10 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Role pyramid
          </div>
          <div className="mt-4 grid gap-3">
            {PERSONAS.map((persona) => (
              <Card key={persona.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {persona.level}
                      </div>
                      <h2 className="mt-1 text-xl font-semibold">{persona.label}</h2>
                    </div>
                    <Button asChild>
                      <a
                        href={demoHref(persona.target, persona.id)}
                        onPointerDown={() => enterAs(persona.id)}
                        onClick={() => enterAs(persona.id)}
                      >
                        View role
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{persona.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.sees.map((item) => (
                      <Badge key={item} variant="secondary" className="text-[10px]">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-12 space-y-3">
          {WALKTHROUGH.map((step, index) => (
            <Card key={step.n} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex items-start gap-5">
                <div className="hidden sm:flex flex-col items-center w-14 shrink-0">
                  <div className="text-xs font-mono text-muted-foreground">{step.n}</div>
                  <div className="mt-2 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <step.icon className="h-5 w-5" />
                  </div>
                  {index < WALKTHROUGH.length - 1 && (
                    <div className="flex-1 w-px bg-border mt-2 min-h-[24px]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-lg font-semibold">{step.title}</h2>
                    <Badge variant="secondary" className="text-[10px]">
                      {step.duration}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <a
                    href={demoHref(step.cta.to, step.cta.role)}
                    onPointerDown={() => enterAs(step.cta.role)}
                    onClick={() => enterAs(step.cta.role)}
                  >
                    {step.cta.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-xl border-2 border-primary/30 bg-primary/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Presentation-ready transportation network demo</div>
            <div className="text-sm text-muted-foreground">
              This version is mock-data-only. Once a purchaser is ready, the same role model can be
              enforced with live backend data, authentication, and database rules.
            </div>
          </div>
          <Button size="lg" asChild>
            <a
              href={demoHref("/app/dashboard", "system_admin")}
              onPointerDown={() => enterAs("system_admin")}
              onClick={() => enterAs("system_admin")}
            >
              Start with payer oversight
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
