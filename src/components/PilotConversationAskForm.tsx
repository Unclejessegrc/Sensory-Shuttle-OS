import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_DEMO_PATH,
  getDemoDestinationLabel,
  normalizePendingDemoPath,
  PENDING_DEMO_VIEW_KEY,
} from "@/lib/demo-access";
import {
  PILOT_ASK_FORM_NAME,
  submitPilotAskToNetlify,
  unlockDemoAfterPilotAsk,
} from "@/lib/pilot-ask-submission";

type PilotAskFormState = {
  fullName: string;
  organization: string;
  roleTitle: string;
  email: string;
  phone: string;
  organizationType: string;
  interest: string;
  message: string;
  acknowledgement: boolean;
};

const initialForm: PilotAskFormState = {
  fullName: "",
  organization: "",
  roleTitle: "",
  email: "",
  phone: "",
  organizationType: "",
  interest: "",
  message: "",
  acknowledgement: false,
};

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
  "Viewing the software demo",
  "Discussing a pilot program",
  "Partnership conversation",
  "Funding or sponsorship",
  "Feedback only",
  "Other",
];

const inputClass =
  "mt-1.5 border-border bg-background text-foreground placeholder:text-muted-foreground";

export function PilotConversationAskForm({
  pendingPathOverride,
}: {
  pendingPathOverride?: string;
}) {
  const [form, setForm] = useState<PilotAskFormState>(initialForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPath, setPendingPath] = useState(pendingPathOverride ?? DEFAULT_DEMO_PATH);

  useEffect(() => {
    if (pendingPathOverride) {
      setPendingPath(normalizePendingDemoPath(pendingPathOverride));
      return;
    }

    const stored = window.sessionStorage.getItem(PENDING_DEMO_VIEW_KEY);
    setPendingPath(normalizePendingDemoPath(stored));
  }, [pendingPathOverride]);

  const selectedLabel = useMemo(() => getDemoDestinationLabel(pendingPath), [pendingPath]);

  const updateField = (field: keyof PilotAskFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const nextErrors: string[] = [];
    if (!form.fullName.trim()) nextErrors.push("Full name is required.");
    if (!form.email.trim()) nextErrors.push("Email is required.");
    if (!form.organizationType) nextErrors.push("Organization type is required.");
    if (!form.interest) nextErrors.push("Interest is required.");
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

    const destination = normalizePendingDemoPath(pendingPath);
    const submission = {
      ...form,
      intendedDemoView: destination,
      intendedDemoLabel: getDemoDestinationLabel(destination),
      submittedAt: new Date().toISOString(),
      source: "gated-demo-access",
    };

    setSubmitting(true);
    try {
      await submitPilotAskToNetlify(submission);
      unlockDemoAfterPilotAsk(submission);
      setSubmitted(true);

      window.setTimeout(() => {
        window.location.assign(destination);
      }, 800);
    } catch {
      setErrors([
        "We could not submit the pilot conversation request. Please try again before opening the demo.",
      ]);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="border-primary/40 text-primary">
          Pilot Conversation Ask
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Pilot Conversation Ask</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          Before viewing the live demo, please complete this short Pilot Conversation Ask form.
          Sensory Shuttle OS is currently being presented as a pilot-ready concept, and this helps
          us understand who is reviewing the platform, what type of transportation operation they
          represent, and whether there may be a fit for a deeper conversation.
        </p>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          You selected: <span className="font-semibold">{selectedLabel}</span>. Complete the form
          below to continue.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Request demo access</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm font-medium">
              Thank you. Your demo access is now unlocked.
            </div>
          ) : (
            <form
              name={PILOT_ASK_FORM_NAME}
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="form-name" value={PILOT_ASK_FORM_NAME} />
              <input type="hidden" name="subject" value="Sensory Shuttle Pilot Conversation Ask" />
              <input
                type="hidden"
                name="intendedDemoView"
                value={normalizePendingDemoPath(pendingPath)}
              />
              <input type="hidden" name="intendedDemoLabel" value={selectedLabel} />
              <input type="hidden" name="source" value="gated-demo-access" />
              <p className="hidden">
                <label>
                  Do not fill this out: <input name="bot-field" />
                </label>
              </p>
              {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {errors.map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Full name <span className="text-destructive">*</span>
                  <Input
                    name="fullName"
                    className={inputClass}
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                  <Input
                    name="email"
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Organization or company
                  <Input
                    name="organization"
                    className={inputClass}
                    value={form.organization}
                    onChange={(event) => updateField("organization", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Role or title
                  <Input
                    name="roleTitle"
                    className={inputClass}
                    value={form.roleTitle}
                    onChange={(event) => updateField("roleTitle", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Phone
                  <Input
                    name="phone"
                    className={inputClass}
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Organization type <span className="text-destructive">*</span>
                  <select
                    name="organizationType"
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    value={form.organizationType}
                    onChange={(event) => updateField("organizationType", event.target.value)}
                    required
                  >
                    <option value="">Select one</option>
                    {organizationTypes.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium">
                What are you interested in? <span className="text-destructive">*</span>
                <select
                  name="interest"
                  className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  value={form.interest}
                  onChange={(event) => updateField("interest", event.target.value)}
                  required
                >
                  <option value="">Select one</option>
                  {interestOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Short message
                <Textarea
                  name="message"
                  className={`${inputClass} min-h-28`}
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                />
              </label>

              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <input
                  id="pilot-ask-acknowledgement"
                  name="acknowledgement"
                  type="checkbox"
                  value="yes"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={form.acknowledgement}
                  onChange={(event) => updateField("acknowledgement", event.target.checked)}
                  required
                />
                <Label htmlFor="pilot-ask-acknowledgement" className="text-sm leading-6">
                  I understand this is a prototype demonstration and not a live transportation
                  dispatch system.
                </Label>
              </div>

              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Pilot Conversation Request"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
