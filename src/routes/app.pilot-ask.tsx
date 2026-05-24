import { createFileRoute } from "@tanstack/react-router";
import { PilotConversationAskForm } from "@/components/PilotConversationAskForm";

export const Route = createFileRoute("/app/pilot-ask")({
  component: PilotConversationAskForm,
});
