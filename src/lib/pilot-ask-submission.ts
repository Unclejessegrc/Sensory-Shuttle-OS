import {
  DEMO_ACCESS_UNLOCKED_EVENT,
  PENDING_DEMO_VIEW_KEY,
  PILOT_ASK_COMPLETED_KEY,
  PILOT_ASK_SUBMISSION_KEY,
} from "@/lib/demo-access";

export const PILOT_ASK_FORM_NAME = "pilot-conversation-ask";

export type PilotAskSubmissionPayload = {
  fullName: string;
  organization: string;
  roleTitle: string;
  email: string;
  phone: string;
  organizationType: string;
  interest: string;
  message: string;
  acknowledgement: boolean;
  intendedDemoView: string;
  intendedDemoLabel: string;
  submittedAt: string;
  source: string;
};

function isLocalDevelopment() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export async function submitPilotAskToNetlify(submission: PilotAskSubmissionPayload) {
  const formData = new URLSearchParams();
  formData.set("form-name", PILOT_ASK_FORM_NAME);
  formData.set("subject", "Sensory Shuttle Pilot Conversation Ask");
  formData.set("fullName", submission.fullName);
  formData.set("organization", submission.organization);
  formData.set("roleTitle", submission.roleTitle);
  formData.set("email", submission.email);
  formData.set("phone", submission.phone);
  formData.set("organizationType", submission.organizationType);
  formData.set("interest", submission.interest);
  formData.set("message", submission.message);
  formData.set("acknowledgement", submission.acknowledgement ? "yes" : "no");
  formData.set("intendedDemoView", submission.intendedDemoView);
  formData.set("intendedDemoLabel", submission.intendedDemoLabel);
  formData.set("submittedAt", submission.submittedAt);
  formData.set("source", submission.source);
  formData.set("bot-field", "");

  const response = await fetch("/__forms.html", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok && !isLocalDevelopment()) {
    throw new Error("Netlify form submission failed.");
  }
}

export function unlockDemoAfterPilotAsk(submission: PilotAskSubmissionPayload) {
  window.localStorage.setItem(PILOT_ASK_COMPLETED_KEY, "true");
  window.localStorage.setItem(PILOT_ASK_SUBMISSION_KEY, JSON.stringify(submission));
  window.sessionStorage.removeItem(PENDING_DEMO_VIEW_KEY);
  window.dispatchEvent(new Event(DEMO_ACCESS_UNLOCKED_EVENT));
}
