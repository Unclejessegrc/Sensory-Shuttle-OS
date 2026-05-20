import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ClipboardCheck,
  Lock,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/app/strategy")({
  component: () => (
    <RoleGate
      allow={[
        "admin",
        "broker",
        "provider",
        "dispatcher",
        "driver",
        "caregiver",
        "facility_viewer",
      ]}
    >
      <Strategy />
    </RoleGate>
  ),
});

const positioning = [
  "School District Pilot Pathway",
  "Clinic + Therapy Center Partnerships",
  "Parent Visibility",
  "Sensory-Aware Driver Workflows",
  "Incident Documentation",
  "Rhode Island Focus",
];

const whyCards = [
  "Standard ride assignment is not enough",
  "Some children need sensory-informed transportation",
  "Parents need visibility",
  "Drivers need clear instructions",
  "Schools and clinics need documentation",
  "Incidents need evidence, not scattered phone calls",
];

const pathways = [
  {
    title: "School District / IEP Transportation",
    body: "For students whose IEP teams identify specialized transportation needs, Sensory Shuttle is designed to support predictable driver assignment, sensory profiles, safe handoffs, parent visibility, and documentation for district transportation teams.",
  },
  {
    title: "Pediatric Clinics + Therapy Centers",
    body: "Clinics and therapy centers often feel the impact of failed transportation through missed appointments, dysregulated arrivals, and staff time spent tracking rides. Sensory Shuttle can support clinic-aligned pilot programs for high-support pediatric riders.",
  },
  {
    title: "MCO / Health Plan Pilot Programs",
    body: "For managed care organizations and health plans, the platform can support targeted transportation pilots for pediatric members whose needs are not well-served by standard ride workflows.",
  },
  {
    title: "Private Pay + Family-Funded Concierge Rides",
    body: "For families who need specialized, predictable support outside standard transportation systems, Sensory Shuttle can be positioned for future private-pay service options, subject to licensing, insurance, and medical/legal guidance.",
  },
];

const softwareFeatures = [
  {
    title: "Sensory Rider Profiles",
    body: "Stores rider-specific needs such as quiet ride requirements, scent sensitivity, motion sickness risk, preferred communication style, known triggers, caregiver requirements, and driver instructions.",
  },
  {
    title: "Consistent Driver Matching",
    body: "Prioritizes familiar, trained drivers and flags bad matches before the ride begins.",
  },
  {
    title: "Fit Score Warnings",
    body: "Alerts coordinators when the assigned driver or vehicle does not match the rider's needs, such as missing booster seat, blocked driver, no sensory training, or wrong vehicle type.",
  },
  {
    title: "Parent / Caregiver Visibility",
    body: "Gives families a simpler way to see ride status, driver details, ETA confidence, and report issues.",
  },
  {
    title: "Driver Pre-Trip Checklist",
    body: "Requires drivers to review rider notes and confirm key accommodations before starting the route.",
  },
  {
    title: "Incident Evidence Packets",
    body: "Turns ride complaints into structured case files with trip details, accommodation requirements, GPS timeline placeholders, driver confirmations, and reporter statements.",
  },
  {
    title: "Program Scorecards",
    body: "Helps districts, clinics, or provider networks monitor on-time performance, complaint trends, accommodation failures, and provider reliability.",
  },
  {
    title: "Audit-Ready Logs",
    body: "Tracks sensitive actions by role, timestamp, and record, supporting safer oversight workflows.",
  },
];

const audiences = [
  {
    title: "Special Education Directors",
    body: "Need reliable, documented, student-specific transportation options when standard school transportation is not enough.",
  },
  {
    title: "District Transportation Coordinators",
    body: "Need predictable handoffs, driver readiness, parent communication, and a record of what happened when a ride fails.",
  },
  {
    title: "Pediatric Clinic Social Workers",
    body: "Need visibility when transportation failures cause missed appointments, late arrivals, or distressed patients.",
  },
  {
    title: "Autism Therapy Centers",
    body: "Need transportation partners who understand sensory regulation, transition time, caregiver handoffs, and appointment readiness.",
  },
  {
    title: "Managed Care / MCO Innovation Teams",
    body: "Need targeted pilot models for pediatric members whose transportation needs exceed standard ride workflows.",
  },
  {
    title: "Transportation Providers Serving Children",
    body: "Need clearer rider instructions, safer matching, and documentation that proves the right support was delivered.",
  },
  {
    title: "Parents and Caregivers",
    body: "Need to know who is picking up their child, whether the ride is on track, and whether the driver understands the child's needs.",
  },
];

const demonstrated = [
  "Role-based dashboards",
  "Sensory rider profiles",
  "Driver instructions",
  "Fit score warnings",
  "ETA confidence labels",
  "Parent/caregiver ride tracking",
  "Driver pre-trip checklist",
  "Incident evidence packet",
  "Provider/program scorecards",
  "Audit logs",
  "Mock ride booking",
  "Fictional sample data",
];

const responsible = [
  "Commercial auto insurance planning",
  "Driver background checks",
  "CPR / First Aid training",
  "Pediatric passenger safety",
  "Sensory and de-escalation training",
  "Parent/caregiver communication protocols",
  "Secure data handling",
  "Role-based access",
  "Audit logs",
  "District/clinic handoff procedures",
];

function Strategy() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
        <div className="max-w-4xl">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
            Built from lived experience with Rhode Island transportation barriers
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Specialized Transportation for Neurodivergent Children in Rhode Island
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
            Care-aware transportation planning, sensory rider profiles, consistent driver matching,
            parent visibility, and incident-ready documentation for children whose needs exceed
            standard ride workflows.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#pilot-conversation">Request a Pilot Conversation</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo">View Software Demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Demo and pilot-planning phase. Fictional rider data only.
          </p>
        </div>
        <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {positioning.map((item) => (
            <div key={item} className="rounded-lg border bg-background/70 p-3 text-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      <Section
        id="why"
        eyebrow="Why this exists"
        title="Transportation can determine whether a child arrives regulated, safe, and ready."
        body="Many children do not struggle because they cannot get a ride. They struggle because the ride is unpredictable, loud, rushed, poorly matched, or handled by someone who does not understand their needs. Sensory Shuttle is designed around the reality that transportation itself can determine whether a child arrives regulated, safe, and ready for care or school."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {whyCards.map((item) => (
            <MiniCard key={item} icon={AlertTriangle} title={item} />
          ))}
        </div>
      </Section>

      <Section
        id="pilot-pathways"
        eyebrow="Primary pilot pathways"
        title="Alternative funding pathways and specialized transportation pilots."
        body="Sensory Shuttle is not a replacement for Rhode Island's Medicaid NEMT broker. The near-term focus is school-district and clinic-aligned transportation, pediatric pilots, and carefully reviewed private-pay options."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {pathways.map((item) => (
            <MiniCard key={item.title} icon={RouteIcon} title={item.title} body={item.body} />
          ))}
        </div>
      </Section>

      <Section
        id="software"
        eyebrow="Software backbone"
        title="What makes the software different"
        body="Sensory Shuttle is not just a ride. It is a managed transportation environment for children and families who need predictability, safety, sensory awareness, and accountability."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {softwareFeatures.map((item) => (
            <MiniCard key={item.title} icon={Sparkles} title={item.title} body={item.body} />
          ))}
        </div>
      </Section>

      <Section id="who" eyebrow="Who this is for" title="Rhode Island teams who see the gap first.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {audiences.map((item) => (
            <MiniCard key={item.title} icon={UserCheck} title={item.title} body={item.body} />
          ))}
        </div>
      </Section>

      <Section
        id="features"
        eyebrow="Features already demonstrated"
        title="A working software demo with fictional data"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {demonstrated.map((item) => (
            <Badge key={item} variant="secondary" className="justify-start rounded-lg px-3 py-2">
              <ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" />
              {item}
            </Badge>
          ))}
        </div>
      </Section>

      <Section
        id="status"
        eyebrow="Current status"
        title="Demo and pilot-planning phase"
        body="Sensory Shuttle is currently in demo and pilot-planning phase. The software uses fictional sample data and is not yet handling real rider information. The next step is feedback from Rhode Island school transportation leaders, special education teams, pediatric clinics, therapy centers, and transportation providers."
      >
        <div className="flex flex-wrap gap-2">
          {[
            "Demo built",
            "Fictional data only",
            "Pilot conversations open",
            "Rhode Island focus",
            "Compliance planning required before live deployment",
          ].map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      </Section>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            Responsible Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            {[
              "We are not currently replacing Rhode Island's Medicaid NEMT broker.",
              "We are not currently billing standard Medicaid directly for routine NEMT rides.",
              "We are not claiming production HIPAA compliance yet.",
              "We are not transporting children until licensing, insurance, training, and operational requirements are complete.",
              "We are currently seeking pilot feedback, partnerships, and validation.",
            ].map((item) => (
              <div key={item} className="rounded-lg border bg-background p-3 text-sm">
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Some families may explore private-pay reimbursement options with their tax, medical, or
            benefits advisor when transportation is medically necessary. Sensory Shuttle does not
            provide tax, legal, or benefits advice.
          </p>
        </CardContent>
      </Card>

      <Section
        id="responsible-pilot"
        eyebrow="Built for responsible pilot development"
        title="Planned requirements before any live service"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {responsible.map((item) => (
            <MiniCard key={item} icon={ClipboardCheck} title={item} />
          ))}
        </div>
      </Section>

      <Section
        id="pilot-conversation"
        eyebrow="Pilot conversation ask"
        title="We are looking for 20-minute Rhode Island feedback conversations."
        body="We are looking for 20-minute feedback conversations with Rhode Island professionals who understand student transportation, pediatric care coordination, special education, autism services, NEMT operations, or clinic-based transportation barriers."
      >
        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <Field label="Name" />
            <Field label="Organization" />
            <Field label="Role" />
            <Field label="Email" type="email" />
            <Field label="Phone optional" />
            <div>
              <Label>I am interested in</Label>
              <select className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option>School district pilot</option>
                <option>Clinic/therapy center pilot</option>
                <option>Transportation provider feedback</option>
                <option>Parent/caregiver feedback</option>
                <option>MCO/health plan pilot</option>
                <option>Software demo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Message</Label>
              <Textarea className="mt-2" rows={4} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button>Request a Pilot Conversation</Button>
              <Button variant="outline" asChild>
                <Link to="/demo">View the Demo</Link>
              </Button>
              <Button variant="ghost">Give Feedback on the Workflow</Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      <footer className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
        Sensory Shuttle is currently a concept-stage pilot and software demo. All sample rider,
        driver, provider, and trip information shown in the demo is fictional. Live transportation
        service would require appropriate licensing, insurance, training, data privacy review, and
        contractual approvals.
      </footer>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  body,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        {body && <p className="mt-3 max-w-4xl text-sm text-muted-foreground">{body}</p>}
      </div>
      {children}
    </section>
  );
}

function MiniCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Icon className="mb-3 h-4 w-4 text-primary" />
        <div className="font-medium">{title}</div>
        {body && <p className="mt-2 text-sm text-muted-foreground">{body}</p>}
      </CardContent>
    </Card>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} className="mt-2" />
    </div>
  );
}
