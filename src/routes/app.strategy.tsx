import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import {
  AlertTriangle,
  Building2,
  Users,
  ShieldCheck,
  DollarSign,
  Sparkles,
  Rocket,
  ClipboardCheck,
  FlagTriangleRight,
  Layers,
  Network,
  Lock,
  Calculator,
  FileText,
  Activity,
  Car,
} from "lucide-react";

export const Route = createFileRoute("/app/strategy")({
  component: () => (
    <RoleGate
      allow={["broker", "provider", "dispatcher", "driver", "caregiver", "facility_viewer"]}
    >
      <Strategy />
    </RoleGate>
  ),
});

/**
 * Internal product strategy page — a single source of truth for the
 * Sensory Shuttle OS go-to-market and product story. Used in investor
 * demos and onboarding new team members.
 */
function Strategy() {
  const [monthlyRides, setMonthlyRides] = useState(12000);
  const [currentOnTime, setCurrentOnTime] = useState(82);
  const [costPerFailure, setCostPerFailure] = useState(48);
  const projectedOnTime = Math.min(97, currentOnTime + 9);
  const avoidedFailures = Math.max(
    0,
    Math.round(monthlyRides * ((projectedOnTime - currentOnTime) / 100)),
  );
  const projectedSavings = avoidedFailures * costPerFailure;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Internal · Product strategy"
        title="Why Sensory Shuttle OS exists"
        description="The thesis, the customer, the moat, and the path from MVP to network."
        actions={<Badge variant="outline">v0.1 · Living document</Badge>}
      />

      <Section icon={AlertTriangle} title="1 · The problem in current NEMT systems" tone="danger">
        <ul className="space-y-2 text-sm">
          <Bullet>
            Brokers and providers run on dispatch tools built for taxi-style ride hailing — none of
            them model rider care needs.
          </Bullet>
          <Bullet>
            Sensory, mobility, and behavioral accommodations live in PDFs, spreadsheets, and Slack —
            not in the assignment engine.
          </Bullet>
          <Bullet>
            "Driver is 5 minutes away" is fiction. GPS pings go stale and ETAs are pulled from the
            schedule, not reality.
          </Bullet>
          <Bullet>
            No-shows are disputed without evidence. Providers lose revenue, families lose
            appointments, brokers lose trust.
          </Bullet>
          <Bullet>
            Caregivers get silence. They watch a stale dot on a map and call dispatch when the rider
            is already late to dialysis.
          </Bullet>
          <Bullet>
            Brokers cannot rank providers by what actually matters: care fit, ETA truth,
            sensory-failure rate.
          </Bullet>
        </ul>
      </Section>

      <Section icon={Users} title="2 · Target customers">
        <Grid>
          <MiniCard title="Transportation brokers and network purchasers">
            Manage networks of 20–500 providers under Medicaid/MCO contracts. Pay for oversight,
            scorecards, and dispute defense.
          </MiniCard>
          <MiniCard title="Mid-market NEMT providers">
            10–200 vehicles. Need dispatch, driver app, and proof-of-performance to win broker
            contracts.
          </MiniCard>
          <MiniCard title="Care organizations & schools">
            School districts, IDD agencies, dialysis networks who book transport and need real-time
            visibility for their riders.
          </MiniCard>
          <MiniCard title="MCOs & state Medicaid agencies">
            Need network-level reporting and incident accountability for member experience and
            compliance.
          </MiniCard>
        </Grid>
      </Section>

      <Section icon={ShieldCheck} title="3 · Product moat">
        <Grid>
          <MiniCard icon={Sparkles} title="Care-aware data model">
            No competitor models sensory triggers, de-escalation notes, or driver sensory training
            as first-class assignment inputs.
          </MiniCard>
          <MiniCard icon={Network} title="ETA Truth Engine">
            Most NEMT tools display the schedule and call it an ETA. We instrument GPS staleness,
            driver motion, and confidence — and surface the truth.
          </MiniCard>
          <MiniCard icon={Layers} title="Two-sided network effects">
            Each broker we win pulls in providers. Each provider we win brings their broker
            contracts. Scorecards become the lingua franca.
          </MiniCard>
          <MiniCard icon={Lock} title="Evidence + audit lock-in">
            Once a broker uses our incident packets in dispute resolution, switching off the
            platform breaks the audit trail.
          </MiniCard>
        </Grid>
      </Section>

      <Section icon={DollarSign} title="4 · Business model">
        <div className="grid md:grid-cols-2 gap-3">
          <MiniCard title="Per-ride fee for providers">
            $0.40–$1.20 per completed ride, tiered by volume. Replaces existing dispatch software
            cost.
          </MiniCard>
          <MiniCard title="Per-seat SaaS for brokers">
            $1,500–$8,000/mo per broker office for oversight, scorecards, dispute tooling.
          </MiniCard>
          <MiniCard title="Network fee for MCOs">
            Annual contract for network-level analytics and member-experience reporting.
          </MiniCard>
          <MiniCard title="Premium add-ons">
            Caregiver app at $4/seat/mo (paid by care org), evidence packet generation as part of
            dispute pricing.
          </MiniCard>
        </div>
      </Section>

      <Section icon={Building2} title="5 · Why brokers and providers would pay">
        <Grid>
          <MiniCard title="Brokers: defend the contract">
            Lose a state Medicaid contract over a single viral incident? Sensory Shuttle gives them
            defensible documentation and proactive scorecards before the state notices.
          </MiniCard>
          <MiniCard title="Brokers: cheaper oversight">
            Replace 3–5 part-time auditors with structured incident workflows and provider
            scorecards generated from telemetry.
          </MiniCard>
          <MiniCard title="Providers: win more rides">
            Gold-tier providers get priority dispatch from brokers using our scorecards. Reputation
            becomes liquid.
          </MiniCard>
          <MiniCard title="Providers: stop losing disputed no-shows">
            Every "no-show" that wasn't a no-show is revenue lost. Evidence packets recover that
            money.
          </MiniCard>
          <MiniCard title="Providers: hire and retain better drivers">
            Sensory-trained, pediatric-certified drivers see they're matched to the right rides —
            not punished for being good at hard work.
          </MiniCard>
          <MiniCard title="Care orgs: end the silent ride">
            Schools, group homes, dialysis centers stop calling dispatch every 10 minutes. Real
            visibility = fewer panic calls.
          </MiniCard>
        </Grid>
      </Section>

      <Section icon={Calculator} title="6 · Buyer ROI and demo proof points">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ROI calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <RoiInput
                label="Monthly rides"
                value={monthlyRides}
                min={100}
                onChange={setMonthlyRides}
              />
              <RoiInput
                label="Current on-time rate"
                value={currentOnTime}
                min={40}
                max={99}
                suffix="%"
                onChange={setCurrentOnTime}
              />
              <RoiInput
                label="Cost per missed or failed ride"
                value={costPerFailure}
                min={10}
                prefix="$"
                onChange={setCostPerFailure}
              />
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="text-xs text-muted-foreground">Projected monthly savings</div>
                <div className="text-2xl font-semibold">${projectedSavings.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Assumes on-time improvement from {currentOnTime}% to {projectedOnTime}% and{" "}
                  {avoidedFailures.toLocaleString()} avoided failures.
                </div>
              </div>
            </CardContent>
          </Card>
          <Grid>
            <MiniCard icon={Car} title="Rideshare backup scenario">
              Show a low-risk ambulatory request where every internal driver is blocked, then
              request Lyft Concierge or Uber Health with ETA and estimated cost.
            </MiniCard>
            <MiniCard icon={FileText} title="Incident evidence packet">
              Walk from incident report to GPS evidence, ETA history, statement, corrective action,
              and printable audit packet.
            </MiniCard>
            <MiniCard icon={Activity} title="Accountability lock">
              Highlight speed violations, stale GPS exceptions, driver app lock, and assignment
              restrictions tied to provider scorecards.
            </MiniCard>
          </Grid>
        </div>
      </Section>

      <Section icon={Rocket} title="7 · First MVP features (this build)">
        <ul className="space-y-2 text-sm">
          <Bullet>
            Care-aware rider profiles with sensory needs, triggers, de-escalation notes
          </Bullet>
          <Bullet>Fit Score engine with hard fails and weighted soft factors</Bullet>
          <Bullet>Dispatch board with ETA truth (GPS staleness, driver motion)</Bullet>
          <Bullet>Driver app with pre-trip checklist gated by rider needs</Bullet>
          <Bullet>Caregiver visibility with calm, honest status messaging</Bullet>
          <Bullet>Incident workflow with statement capture</Bullet>
          <Bullet>Provider scorecards (Gold / Standard / Watch List)</Bullet>
          <Bullet>Broker oversight view across providers</Bullet>
          <Bullet>Tamper-evident audit log of sensitive actions</Bullet>
        </ul>
      </Section>

      <Section icon={FlagTriangleRight} title="8 · Future features (post-pilot)">
        <Grid>
          <MiniCard title="Smart re-dispatch">
            Auto-reassign on ETA-confidence drop with rider-specific re-fit scoring.
          </MiniCard>
          <MiniCard title="Evidence packets as PDF">
            One-click broker-grade dispute pack with GPS, photos, statements, signatures.
          </MiniCard>
          <MiniCard title="Driver onboarding LMS">
            Embedded sensory + pediatric certification courses tied to driver record.
          </MiniCard>
          <MiniCard title="State Medicaid reporting">
            Pre-built encounter reports, fraud signals, on-time compliance feeds.
          </MiniCard>
          <MiniCard title="EHR booking integration">
            Receive ride orders directly from Epic/Athena/CareLogic.
          </MiniCard>
          <MiniCard title="Predictive sensory-incident risk">
            ML scoring per ride based on rider, driver, weather, time of day.
          </MiniCard>
        </Grid>
      </Section>

      <Section icon={ClipboardCheck} title="9 · Compliance notes">
        <ul className="space-y-2 text-sm">
          <Bullet>
            <b>HIPAA:</b> All PHI flows through encrypted channels; row-level security; BAAs with
            all subprocessors.
          </Bullet>
          <Bullet>
            <b>State Medicaid NEMT rules:</b> Modeled per-state (TX HHSC, CA Medi-Cal, NY DOH, FL
            AHCA) for documentation and dispute timelines.
          </Bullet>
          <Bullet>
            <b>ADA + Section 504:</b> Accessibility and accommodation requirements baked into rider
            profile and Fit Score.
          </Bullet>
          <Bullet>
            <b>SOC 2 Type II:</b> Targeted within 12 months of first paid pilot.
          </Bullet>
          <Bullet>
            <b>Audit log immutability:</b> Append-only, hash-chained sensitive activity log for
            dispute defense.
          </Bullet>
          <Bullet>
            <b>Driver background:</b> Integration with national criminal background, MVR, and drug
            screening providers.
          </Bullet>
        </ul>
      </Section>

      <Section icon={Rocket} title="10 · Pilot program plan">
        <div className="grid md:grid-cols-3 gap-3">
          <PilotPhase
            num="01"
            title="Design partner pilot (90 days)"
            bullets={[
              "1 broker + 3 providers + 1 care org",
              "Free pilot, weekly product reviews",
              "Outcome: 1 customer reference, 3 case studies",
            ]}
          />
          <PilotPhase
            num="02"
            title="Paid early access (months 4–9)"
            bullets={[
              "5 brokers, 30 providers across 2 states",
              "Discounted SaaS + per-ride pricing",
              "Outcome: signed multi-year MSAs, $500k ARR",
            ]}
          />
          <PilotPhase
            num="03"
            title="State Medicaid expansion (year 2)"
            bullets={[
              "Co-sell with one state-level broker",
              "MCO-level analytics contracts",
              "Outcome: $3–6M ARR, Series A milestone",
            ]}
          />
        </div>
      </Section>

      <div className="rounded-xl border bg-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Want the investor walkthrough?</div>
          <div className="text-sm text-muted-foreground">
            A guided 6-step demo flow across all roles and capabilities.
          </div>
        </div>
        <Button asChild>
          <Link to="/demo">Open Investor Demo</Link>
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center ${tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="pl-10">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function MiniCard({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function RoiInput({
  label,
  value,
  min,
  max,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex h-9 items-center rounded-md border bg-background px-3">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      <span className="text-foreground">{children}</span>
    </li>
  );
}

function PilotPhase({ num, title, bullets }: { num: string; title: string; bullets: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="text-xs font-mono text-primary">PHASE {num}</div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {bullets.map((b) => (
            <Bullet key={b}>{b}</Bullet>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
