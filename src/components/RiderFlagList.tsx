import { useState } from "react";
import { ShieldAlert, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DefinitionBadge } from "@/components/DefinitionBadge";
import { flagReason, type RegisteredRider } from "@/lib/registered-riders";
import { cn } from "@/lib/utils";

interface Props {
  rider: RegisteredRider;
  /** How many flags to show inline before collapsing the rest into a dropdown. */
  initialVisible?: number;
  /** Compact badges (used in dense tables). */
  compact?: boolean;
  className?: string;
}

/**
 * Renders a rider's risk flags with the first N visible by default and the
 * remaining accessible from a "+N more" dropdown. Every flag is clickable —
 * the popover/dialog explains what the flag means AND the rider-specific
 * reason it was applied.
 */
export function RiderFlagList({ rider, initialVisible = 3, compact = true, className }: Props) {
  const [open, setOpen] = useState(false);
  const flags = rider.riskFlags;
  if (flags.length === 0) {
    return <span className="text-xs text-muted-foreground">None</span>;
  }
  const inline = flags.slice(0, initialVisible);
  const hidden = flags.slice(initialVisible);
  const badgeClass = cn(
    "bg-warning text-warning-foreground gap-0.5",
    compact ? "text-[10px]" : "text-[11px]",
  );
  const riderName = `${rider.firstName} ${rider.lastName}`;

  return (
    <div className={cn("flex flex-wrap gap-1 items-center", className)} data-testid={`flag-list-${rider.id}`}>
      {inline.map((f) => (
        <DefinitionBadge
          key={f}
          term={f}
          className={badgeClass}
          riderName={riderName}
          reasonForRider={flagReason(rider, f)}
        >
          <ShieldAlert className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} /> {f}
        </DefinitionBadge>
      ))}
      {hidden.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] gap-0.5"
              data-testid={`flag-dropdown-${rider.id}`}
            >
              +{hidden.length} more
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto max-w-xs p-2"
            data-testid={`flag-dropdown-content-${rider.id}`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
              All flags for {riderName}
            </div>
            <div className="flex flex-wrap gap-1">
              {flags.map((f) => (
                <DefinitionBadge
                  key={f}
                  term={f}
                  className={cn(
                    badgeClass,
                    inline.includes(f) ? "" : "ring-1 ring-warning/40",
                  )}
                  riderName={riderName}
                  reasonForRider={flagReason(rider, f)}
                >
                  <ShieldAlert className="h-3 w-3" /> {f}
                </DefinitionBadge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
