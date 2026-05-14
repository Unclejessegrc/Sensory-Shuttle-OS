import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DispatchAssistResult, DispatchRecommendation } from "@/lib/ai-dispatch";
import { Bot, Car, CheckCircle2, Clock, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIDispatchCard({
  recommendation,
  onApply,
  compact = false,
}: {
  recommendation: DispatchRecommendation | null;
  onApply?: () => void;
  compact?: boolean;
}) {
  if (!recommendation) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Select a rider and trip time to generate an AI dispatch recommendation.
        </CardContent>
      </Card>
    );
  }

  const modeLabel =
    recommendation.mode === "internal_nemt"
      ? "Internal NEMT"
      : recommendation.mode === "external_tnc"
        ? recommendation.externalPartner === "lyft"
          ? "Lyft Concierge"
          : "Uber Health"
        : "Manual review";
  const tone =
    recommendation.mode === "internal_nemt"
      ? "border-emerald-300 bg-emerald-50/40"
      : recommendation.mode === "external_tnc"
        ? "border-blue-300 bg-blue-50/40"
        : "border-amber-300 bg-amber-50/40";

  return (
    <Card className={cn(tone)}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> AI dispatch bot
          </CardTitle>
          <Badge variant="outline" className="bg-background">
            {modeLabel} - {recommendation.confidence}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{recommendation.title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3.5 w-3.5" /> Estimated trip window:{" "}
              {recommendation.estimatedTripMinutes} min
            </div>
          </div>
          {onApply && (
            <Button size="sm" onClick={onApply} disabled={recommendation.mode === "manual_review"}>
              Apply recommendation
            </Button>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {recommendation.reasons.slice(0, compact ? 2 : 3).map((reason) => (
            <div key={reason} className="rounded-md border bg-background/80 p-2 text-xs">
              <div className="flex items-start gap-1.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{reason}</span>
              </div>
            </div>
          ))}
        </div>

        {recommendation.warnings.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            <div className="font-semibold flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" /> Bot warnings
            </div>
            <ul className="mt-1 list-disc pl-4">
              {recommendation.warnings.slice(0, 3).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <AIAssistPanel assist={recommendation.assist} />

        {!compact && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ranked driver candidates and overbooking check
            </div>
            {recommendation.candidates.slice(0, 4).map((candidate) => (
              <div key={candidate.driver.id} className="rounded-md border bg-background/80 p-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      {candidate.driver.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {candidate.providerName} - {candidate.vehicle?.plate ?? "No vehicle"} -{" "}
                      {candidate.windowLabel}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Score {candidate.score}</Badge>
                    {candidate.available ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Available
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>
                </div>
                {candidate.hardFails.length > 0 && (
                  <div className="mt-1 text-xs text-red-700">
                    {candidate.hardFails.slice(0, 2).join("; ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {recommendation.mode === "external_tnc" && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
            <div className="font-semibold flex items-center gap-1">
              <Car className="h-3.5 w-3.5" /> External ride guardrail
            </div>
            Uber/Lyft assignment is only recommended when the rider is ambulatory, low-risk, and
            does not need specialty equipment, caregiver-required handling, or high sensory support.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AIAssistPanel({ assist }: { assist: DispatchAssistResult }) {
  return (
    <div className="rounded-md border bg-background/90 p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold flex items-center gap-1">
          <Bot className="h-3.5 w-3.5 text-primary" /> Mock AI Dispatch Assist
        </div>
        <Badge className={decisionClass(assist.overallRecommendation)}>
          Overall: {assist.overallRecommendation}
        </Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-2 mt-3">
        <AssistMetric
          title="Gap-time estimate"
          status={assist.gapTime.status}
          body={assist.gapTime.explanation}
        />
        <AssistMetric
          title="15-mile radius rule"
          status={assist.radiusRule.status}
          body={`${assist.radiusRule.explanation} Mock distance: ${assist.radiusRule.distanceMiles} miles.`}
        />
      </div>

      <div className="mt-3 rounded-md border bg-muted/30 p-2">
        <div className="font-semibold">Reasoning</div>
        <ul className="mt-1 list-disc pl-4 space-y-1">
          {assist.reasoning.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      {assist.warnings.length > 0 && (
        <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900">
          <div className="font-semibold flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Warnings
          </div>
          <ul className="mt-1 list-disc pl-4">
            {assist.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AssistMetric({ title, status, body }: { title: string; status: string; body: string }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">{title}</div>
        <Badge variant="outline" className={decisionClass(status)}>
          {status}
        </Badge>
      </div>
      <p className="mt-1 text-muted-foreground">{body}</p>
    </div>
  );
}

function decisionClass(status: string) {
  if (status.includes("blocked") || status.includes("Do not")) {
    return "bg-destructive text-destructive-foreground border-destructive";
  }
  if (status.includes("Risky")) return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-emerald-100 text-emerald-800 border-emerald-300";
}
