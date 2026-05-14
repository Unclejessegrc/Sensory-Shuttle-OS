import type { FitScoreResult } from "@/lib/fit-score";
import { Progress } from "@/components/ui/progress";
import { MismatchAlert } from "@/components/StatusBadge";
import { ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visual explainer for the Fit Score so dispatchers + reviewers understand
 * exactly why a ride was assigned (or flagged). Shows hard fails, soft
 * warnings, weighted factor breakdown, and a one-line plain-English verdict.
 */
export function FitScoreExplainer({ fit }: { fit: FitScoreResult }) {
  const tone =
    fit.hardFails.length > 0
      ? { ring: "ring-destructive", text: "text-destructive", label: "Do not dispatch" }
      : fit.score >= 85
        ? { ring: "ring-success", text: "text-success", label: "Strong fit" }
        : fit.score >= 70
          ? { ring: "ring-primary", text: "text-primary", label: "Acceptable fit" }
          : { ring: "ring-warning", text: "text-warning-foreground", label: "Poor fit — review" };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "h-16 w-16 shrink-0 rounded-full bg-background flex flex-col items-center justify-center ring-4 ring-offset-2 ring-offset-card",
            tone.ring,
          )}
        >
          <div className={cn("text-xl font-bold leading-none", tone.text)}>{fit.score}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
            / 100
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {fit.pass ? (
              <ShieldCheck className={cn("h-4 w-4", tone.text)} />
            ) : (
              <AlertTriangle className={cn("h-4 w-4", tone.text)} />
            )}
            <div className={cn("font-semibold text-sm", tone.text)}>{tone.label}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fit Score weighs driver training, vehicle accommodations, provider reliability,
            preferences, and proximity. Hard fails (wheelchair, sensory, blocked driver) cap the
            score and block dispatch.
          </p>
        </div>
      </div>

      {fit.hardFails.length > 0 && (
        <MismatchAlert
          level="danger"
          title="Hard fail — assignment blocked"
          items={fit.hardFails}
        />
      )}
      {fit.warnings.length > 0 && (
        <MismatchAlert
          level="warning"
          title="Soft warnings — review before dispatch"
          items={fit.warnings}
        />
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Info className="h-3 w-3" /> Weighted factors
        </div>
        <div className="space-y-2">
          {fit.factors.map((f) => {
            const pct = (f.earned / f.weight) * 100;
            const ok = pct >= 80;
            const warn = pct >= 50 && pct < 80;
            return (
              <div key={f.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{f.label}</span>
                  <span
                    className={cn(
                      "font-mono tabular-nums",
                      ok ? "text-success" : warn ? "text-warning-foreground" : "text-destructive",
                    )}
                  >
                    {f.earned} / {f.weight}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
