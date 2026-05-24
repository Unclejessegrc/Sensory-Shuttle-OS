import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { RoleGate } from "@/components/RoleGate";
import { PublicPageNav } from "@/components/PublicPageNav";
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
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { DEFAULT_DEMO_PATH, getDemoDestinationLabel } from "@/lib/demo-access";
import {
  PILOT_ASK_FORM_NAME,
  submitPilotAskToNetlify,
  unlockDemoAfterPilotAsk,
} from "@/lib/pilot-ask-submission";

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
  "Rhode Island pilot focus",
  "School district / IEP pathway",
  "Clinic + therapy center pilots",
  "Parent visibility",
  "Consistent driver matching",
  "Incident-ready documentation",
];

const whyCards = [
  "Standard ride assignment is not enough",
  "Some children need sensory-informed transportation",
  "Parents need visibility",
  "Schools need safe handoff documentation",
  "Clinics need fewer missed or disrupted appointments",
  "Incidents need evidence, not scattered phone calls",
];

const pathways = [
  {
    title: "School District / IEP Transportation",
    body: "For students whose IEP teams identify specialized transportation needs, Sensory Shuttle is designed to support consistent driver assignment, sensory profiles, parent communication, handoff documentation, and safer student-specific transportation planning.",
  },
  {
    title: "Pediatric Clinics + Therapy Centers",
    body: "Clinics and therapy centers often feel the impact of failed transportation through missed appointments, late arrivals, dysregulated children, and staff time spent tracking rides. Sensory Shuttle can support clinic-aligned pilots for high-support pediatric riders.",
  },
  {
    title: "MCO / Health Plan Pilot Programs",
    body: "For health plans and managed care organizations, Sensory Shuttle can support targeted pilot programs for pediatric members whose transportation needs are not well served by standard ride workflows.",
  },
  {
    title: "Private-Pay / Family-Funded Concierge Rides",
    body: "Some families may explore private-pay transportation when specialized support is needed outside standard systems. Any HSA, FSA, reimbursement, or medical-necessity pathway would require appropriate medical, tax, benefits, and legal guidance and would remain subject to plan rules.",
  },
];

const softwareFeatures = [
  {
    title: "Sensory Rider Profiles",
    body: "Document quiet ride needs, scent sensitivity, transition supports, motion sickness risk, preferred communication style, caregiver requirements, triggers, calming tools, and driver instructions.",
  },
  {
    title: "Consistent Driver Matching",
    body: "Prioritize familiar trained drivers and familiar vehicle setups when routine and predictability matter.",
  },
  {
    title: "Fit Score Warnings",
    body: "Flag mismatches before the ride begins, including blocked drivers, missing equipment, lack of training, wrong vehicle type, overcrowding risk, or accommodation conflicts.",
  },
  {
    title: "Parent / Caregiver Visibility",
    body: "Show ride status, driver details, ETA confidence, pickup progress, return ride information, and issue reporting in a caregiver-safe view.",
  },
  {
    title: "Driver Pre-Trip Checklist",
    body: "Require drivers to review key rider instructions before pickup, including handoff notes, communication style, sensory needs, equipment, and special instructions.",
  },
  {
    title: "Secure Handoff Workflow",
    body: "Demonstrate pickup and dropoff confirmation, caregiver attending status, facility handoff notes, and chain-of-custody-style documentation.",
  },
  {
    title: "Incident Evidence Packets",
    body: "Turn transportation complaints into structured case files with trip details, rider accommodation requirements, driver confirmations, timeline notes, and reporter statements.",
  },
  {
    title: "Program Scorecards",
    body: "Help districts, clinics, networks, or providers monitor on-time performance, complaint patterns, accommodation failures, missed rides, and reliability trends.",
  },
  {
    title: "Audit-Ready Logs",
    body: "Track sensitive actions by role, timestamp, and record so oversight teams can review who accessed, edited, or escalated key information.",
  },
];

const audiences = [
  {
    title: "Special Education Directors",
    body: "Need student-specific transportation options when standard transportation does not meet a child's documented needs.",
  },
  {
    title: "District Transportation Coordinators",
    body: "Need reliable handoffs, driver readiness, parent communication, and documentation when rides fail.",
  },
  {
    title: "Pediatric Clinic Social Workers",
    body: "Need visibility when transportation problems cause missed care, late arrivals, or distressed patients.",
  },
  {
    title: "Autism Therapy Centers",
    body: "Need transportation partners who understand sensory regulation, transitions, caregiver coordination, and appointment readiness.",
  },
  {
    title: "MCO / Health Plan Innovation Teams",
    body: "Need targeted pilots for members whose transportation needs are creating care-access barriers.",
  },
  {
    title: "Transportation Providers Serving Children",
    body: "Need clearer rider instructions, safer driver matching, and documentation that shows the right support was provided.",
  },
  {
    title: "Parents and Caregivers",
    body: "Need to know who is picking up their child, whether the ride is on track, and whether the driver understands the child's needs.",
  },
];

const demonstrated = [
  "Role-based dashboards",
  "Fictional registered rider profiles",
  "Sensory rider flags",
  "Rider profile detail pages",
  "Past trips",
  "Incident / complaint records",
  "Driver profiles",
  "Provider profiles",
  "Vehicle details",
  "Driver fit scoring",
  "AI dispatch intelligence placeholders",
  "ETA confidence labels",
  "15-mile radius assignment rule",
  "Gap-time feasibility logic",
  "Parent / caregiver ride tracking",
  "Facility viewer",
  "Ride booking workflow",
  "Insurance type fields",
  "Calendar ride scheduling",
  "Driver pre-trip checklist",
  "Incident evidence packet",
  "Provider scorecards",
  "Audit logs",
  "Upper-management sensitive access controls",
];

const walkthrough = [
  {
    title: "Start as School / Clinic / Program Viewer",
    body: "Show the problem at the program or network level: active rides, access risk, provider reliability, ETA confidence, and issue volume.",
  },
  {
    title: "Open a fictional rider profile",
    body: "Show sensory needs, caregiver needs, flags, past trips, current or upcoming rides, and risk notes.",
  },
  {
    title: "Book or review a ride",
    body: "Show pickup, dropoff, date, time, appointment type, caregiver attending, return ride, insurance type, and special instructions.",
  },
  {
    title: "Review driver match",
    body: "Show fit score warnings, blocked driver warnings, sensory training needs, vehicle requirements, gap-time logic, and the 15-mile assignment rule.",
  },
  {
    title: "Open caregiver view",
    body: "Show parent visibility, ETA confidence, driver information, ride status, return ride actions, and issue reporting.",
  },
  {
    title: "Open incident packet",
    body: "Show how a complaint becomes documented evidence with trip details, accommodation context, timeline notes, and reporter statement.",
  },
  {
    title: "Open scorecards / audit logs",
    body: "Show how leadership can monitor patterns instead of relying on scattered phone calls.",
  },
];

const responsible = [
  "Demo built with fictional data only",
  "Not currently handling real rider information",
  "Not currently claiming production HIPAA compliance",
  "Not currently transporting children",
  "Not replacing Rhode Island's Medicaid NEMT broker",
  "Not billing standard Medicaid directly for routine rides",
  "Live operations would require licensing, commercial auto insurance, driver screening, CPR/First Aid, pediatric passenger safety procedures, sensory/de-escalation training, privacy review, contracts, and compliance guidance",
  "Current goal: feedback conversations and pilot planning",
];

const plannedRequirements = [
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
    <div className="space-y-14">
      <PublicPageNav current="overview" />

      <nav aria-label="Strategy page sections" className="-mt-8 flex gap-2 overflow-x-auto">
        {[
          { label: "Pilot Pathways", href: "#pilot-pathways" },
          { label: "What the Software Demonstrates", href: "#software" },
          { label: "Who It Helps", href: "#who" },
          { label: "Responsible Development", href: "#responsible" },
          { label: "Request Conversation", href: "#pilot-conversation" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section
        id="overview"
        className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
        <div className="max-w-5xl">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
            Rhode Island pediatric transportation pilot concept
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Specialized Transportation Planning for Neurodivergent Children in Rhode Island
          </h1>
          <p className="mt-5 max-w-4xl text-lg text-muted-foreground">
            Sensory Shuttle combines pediatric transportation planning with care-aware software:
            sensory rider profiles, consistent driver matching, parent visibility, secure handoff
            workflows, and incident-ready documentation for children whose needs exceed standard
            ride workflows.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#pilot-conversation">Request a Pilot Conversation</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo">View Software Demo</Link>
            </Button>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
            Demo and pilot-planning phase. Fictional rider data only. Live service would require
            licensing, insurance, training, privacy review, and contractual approvals.
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

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Rhode Island Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Rhode Island's publicly funded NEMT services are currently coordinated through MTM for
            Medicaid members who need transportation to Medicaid-covered services and have no other
            way to get there. Sensory Shuttle's near-term strategy is not to replace that system.
            The focus is specialized pilot pathways for school districts, pediatric clinics, therapy
            centers, MCO innovation teams, and carefully reviewed family-funded options.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="https://eohhs.ri.gov/Consumer/TransportationServices.aspx"
              className="rounded-md border bg-background px-2.5 py-1 hover:border-primary/40"
            >
              RI EOHHS transportation services
            </a>
            <a
              href="https://www.mtm-inc.net/rhode-island/"
              className="rounded-md border bg-background px-2.5 py-1 hover:border-primary/40"
            >
              MTM Rhode Island NEMT information
            </a>
          </div>
        </CardContent>
      </Card>

      <Section
        id="why"
        eyebrow="Why this exists"
        title="Transportation can determine whether a child arrives regulated, safe, and ready."
        body="Some children do not struggle because they lack transportation. They struggle because the ride is unpredictable, loud, rushed, poorly matched, or handled by someone who has not been given the right support instructions. For neurodivergent children, transportation can affect whether they arrive regulated, safe, and ready for school, therapy, or medical care."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {whyCards.map((item) => (
            <MiniCard key={item} icon={AlertTriangle} title={item} />
          ))}
        </div>
      </Section>

      <Section
        id="pilot-pathways"
        eyebrow="Pilot pathways in Rhode Island"
        title="Specialized transportation pilots where the model may fit."
        body="Sensory Shuttle is not replacing Rhode Island's Medicaid NEMT broker. The near-term focus is specialized, pilot-ready transportation workflows for school districts, pediatric clinics, therapy centers, and care teams that need better sensory accommodation planning, parent visibility, consistent driver matching, and incident documentation."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {pathways.map((item) => (
            <MiniCard key={item.title} icon={RouteIcon} title={item.title} body={item.body} />
          ))}
        </div>
      </Section>

      <Section
        id="software"
        eyebrow="Software advantage"
        title="What the Software Demonstrates"
        body="Sensory Shuttle is not just a ride. It is a managed transportation environment for children whose safety, regulation, transitions, caregiver handoff, and appointment readiness depend on more than distance and pickup time."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {softwareFeatures.map((item) => (
            <MiniCard key={item.title} icon={Sparkles} title={item.title} body={item.body} />
          ))}
        </div>
      </Section>

      <Section id="who" eyebrow="Who this is for" title="Buyer audiences who see the gap first.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {audiences.map((item) => (
            <MiniCard key={item.title} icon={UserCheck} title={item.title} body={item.body} />
          ))}
        </div>
      </Section>

      <Section
        id="features"
        eyebrow="Software proof points"
        title="Features Already Demonstrated in the Software Demo"
        body="The Netlify demo is fictional, but it already shows the operating model: profiles, matching, booking, caregiver visibility, incident documentation, scorecards, and audit history."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {demonstrated.map((item) => (
            <Badge key={item} variant="secondary" className="justify-start rounded-lg px-3 py-2">
              <ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" />
              {item}
            </Badge>
          ))}
        </div>
      </Section>

      <Section
        id="walkthrough"
        eyebrow="Recommended demo walkthrough"
        title="A simple path through the demo for districts, clinics, and plans."
      >
        <div className="grid gap-3">
          {walkthrough.map((item, index) => (
            <Card key={item.title}>
              <CardContent className="flex gap-4 pt-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Card id="responsible" className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            Responsible Development Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 md:grid-cols-2">
            {responsible.map((item) => (
              <div key={item} className="rounded-lg border bg-background p-3 text-sm">
                {item}
              </div>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Planned requirements before live service
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {plannedRequirements.map((item) => (
                <Badge key={item} variant="outline" className="justify-start rounded-lg px-3 py-2">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Some families may explore private-pay reimbursement options with their tax, medical, or
            benefits advisor when transportation is medically necessary. Sensory Shuttle does not
            provide tax, legal, medical, or benefits advice.
          </p>
        </CardContent>
      </Card>

      <Section
        id="pilot-conversation"
        eyebrow="Pilot conversation ask"
        title="Request a 20-Minute Pilot Conversation"
        body="We are looking for feedback conversations with Rhode Island professionals who understand student transportation, special education, pediatric care coordination, autism services, NEMT operations, clinic transportation barriers, or family transportation needs."
      >
        <StrategyPilotConversationForm />
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
  children: ReactNode;
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
  icon: ComponentType<{ className?: string }>;
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

const organizationTypes = [
  "NEMT Provider",
  "Transportation Broker",
  "Health Plan / Payer",
  "School / District",
  "Facility / Clinic",
  "Parent / Caregiver",
  "Advocate / Community Partner",
  "Other",
];

const interestOptions = [
  "School district pilot",
  "Clinic / therapy center pilot",
  "MCO / health plan pilot",
  "Transportation provider feedback",
  "Parent / caregiver feedback",
  "Software demo",
  "Other",
];

function StrategyPilotConversationForm() {
  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    roleTitle: "",
    email: "",
    phone: "",
    organizationType: "",
    interest: "School district pilot",
    message: "",
    acknowledgement: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const nextErrors: string[] = [];
    if (!form.fullName.trim()) nextErrors.push("Name is required.");
    if (!form.email.trim()) nextErrors.push("Email is required.");
    if (!form.organizationType) nextErrors.push("Organization type is required.");
    if (!form.interest) nextErrors.push("Please choose what you are interested in.");
    if (!form.acknowledgement) {
      nextErrors.push("Please confirm this is a prototype demonstration.");
    }
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    const submission = {
      ...form,
      intendedDemoView: DEFAULT_DEMO_PATH,
      intendedDemoLabel: getDemoDestinationLabel(DEFAULT_DEMO_PATH),
      submittedAt: new Date().toISOString(),
      source: "public-strategy-pilot-conversation",
    };

    setSubmitting(true);
    try {
      await submitPilotAskToNetlify(submission);
      unlockDemoAfterPilotAsk(submission);
      setSubmitted(true);
      window.setTimeout(() => {
        window.location.assign(DEFAULT_DEMO_PATH);
      }, 900);
    } catch {
      setErrors([
        "We could not submit the pilot conversation request. Please try again before opening the demo.",
      ]);
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {submitted ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm font-medium">
            Thank you. Your pilot conversation request was submitted, and demo access is now
            unlocked.
          </div>
        ) : (
          <form
            name={PILOT_ASK_FORM_NAME}
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value={PILOT_ASK_FORM_NAME} />
            <input type="hidden" name="subject" value="Sensory Shuttle Pilot Conversation Ask" />
            <input type="hidden" name="intendedDemoView" value={DEFAULT_DEMO_PATH} />
            <input
              type="hidden"
              name="intendedDemoLabel"
              value={getDemoDestinationLabel(DEFAULT_DEMO_PATH)}
            />
            <input type="hidden" name="source" value="public-strategy-pilot-conversation" />
            <p className="hidden">
              <label>
                Do not fill this out: <input name="bot-field" />
              </label>
            </p>

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                {errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="strategy-full-name">Name *</Label>
              <Input
                id="strategy-full-name"
                name="fullName"
                className="mt-2"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="strategy-organization">Organization</Label>
              <Input
                id="strategy-organization"
                name="organization"
                className="mt-2"
                value={form.organization}
                onChange={(event) => updateField("organization", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="strategy-role">Role</Label>
              <Input
                id="strategy-role"
                name="roleTitle"
                className="mt-2"
                value={form.roleTitle}
                onChange={(event) => updateField("roleTitle", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="strategy-email">Email *</Label>
              <Input
                id="strategy-email"
                name="email"
                type="email"
                className="mt-2"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="strategy-phone">Phone optional</Label>
              <Input
                id="strategy-phone"
                name="phone"
                className="mt-2"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="strategy-organization-type">Organization type *</Label>
              <select
                id="strategy-organization-type"
                name="organizationType"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.organizationType}
                onChange={(event) => updateField("organizationType", event.target.value)}
                required
              >
                <option value="">Select one</option>
                {organizationTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="strategy-interest">I am interested in *</Label>
              <select
                id="strategy-interest"
                name="interest"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.interest}
                onChange={(event) => updateField("interest", event.target.value)}
                required
              >
                {interestOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="strategy-message">Message</Label>
              <Textarea
                id="strategy-message"
                name="message"
                className="mt-2"
                rows={4}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
              />
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 md:col-span-2">
              <input
                id="strategy-acknowledgement"
                name="acknowledgement"
                type="checkbox"
                value="yes"
                className="mt-1 h-4 w-4 accent-primary"
                checked={form.acknowledgement}
                onChange={(event) => updateField("acknowledgement", event.target.checked)}
                required
              />
              <Label htmlFor="strategy-acknowledgement" className="text-sm leading-6">
                I understand this is a prototype demonstration and not a live transportation
                dispatch system.
              </Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Request Pilot Conversation"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
