import { Badge } from "@/components/ui/badge";
import type { EtaConfidence, RideStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

export function EtaBadge({ level }: { level: EtaConfidence }) {
  const cfg =
    level === "high"
      ? {
          cls: "bg-success/15 text-success border border-success/30",
          dot: "bg-success",
          label: "ETA on track",
        }
      : level === "medium"
        ? {
            cls: "bg-warning/20 text-warning-foreground border border-warning/40",
            dot: "bg-warning",
            label: "ETA watch",
          }
        : {
            cls: "bg-destructive/15 text-destructive border border-destructive/40",
            dot: "bg-destructive animate-pulse",
            label: "ETA stale",
          };
  return (
    <Badge variant="outline" className={cn(cfg.cls, "gap-1.5 font-medium text-[11px]")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}

export function RideStatusBadge({ status }: { status: RideStatus }) {
  const map: Record<RideStatus, { cls: string; dot: string; label: string }> = {
    scheduled: {
      cls: "bg-secondary text-secondary-foreground border-border",
      dot: "bg-muted-foreground/60",
      label: "Scheduled",
    },
    en_route_pickup: {
      cls: "bg-primary/10 text-primary border-primary/30",
      dot: "bg-primary",
      label: "En route",
    },
    arrived_pickup: {
      cls: "bg-primary/15 text-primary border-primary/40",
      dot: "bg-primary",
      label: "At pickup",
    },
    in_transit: {
      cls: "bg-primary text-primary-foreground border-primary",
      dot: "bg-primary-foreground",
      label: "In transit",
    },
    completed: {
      cls: "bg-success/15 text-success border-success/30",
      dot: "bg-success",
      label: "Completed",
    },
    no_show: {
      cls: "bg-destructive/15 text-destructive border-destructive/40",
      dot: "bg-destructive",
      label: "No-show",
    },
    canceled: {
      cls: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground/50",
      label: "Canceled",
    },
  };
  const c = map[status];
  return (
    <Badge variant="outline" className={cn(c.cls, "gap-1.5 font-medium text-[11px]")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </Badge>
  );
}

export function TierBadge({ tier }: { tier: "Gold" | "Standard" | "Watch List" }) {
  const cls =
    tier === "Gold"
      ? "bg-warning/20 text-warning-foreground border-warning/40"
      : tier === "Standard"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/15 text-destructive border-destructive/40";
  return (
    <Badge variant="outline" className={cls}>
      {tier}
    </Badge>
  );
}

/**
 * Big, unmistakable warning banner used when a rider/driver pairing has a
 * hard fit-score failure (e.g. wheelchair rider + non-accessible vehicle).
 * Designed to grab dispatcher attention even in dense ride lists.
 */
export function MismatchAlert({
  level = "danger",
  title,
  items,
}: {
  level?: "danger" | "warning";
  title: string;
  items: string[];
}) {
  const isDanger = level === "danger";
  const Icon = isDanger ? ShieldAlert : AlertTriangle;
  return (
    <div
      className={cn(
        "rounded-lg border-2 p-3 flex items-start gap-3 shadow-sm",
        isDanger
          ? "border-destructive/60 bg-destructive/8 text-destructive"
          : "border-warning/60 bg-warning/15 text-warning-foreground",
      )}
      role="alert"
    >
      <div
        className={cn(
          "h-8 w-8 shrink-0 rounded-md flex items-center justify-center",
          isDanger
            ? "bg-destructive text-destructive-foreground"
            : "bg-warning text-warning-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <ul className="mt-1 space-y-0.5 text-xs">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 h-1 w-1 rounded-full bg-current shrink-0" />
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FitPassBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-success/10 text-success border-success/40 gap-1.5 font-medium text-[11px]"
    >
      <ShieldCheck className="h-3 w-3" /> Fit pass
    </Badge>
  );
}
