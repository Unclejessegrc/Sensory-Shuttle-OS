import { cn } from "@/lib/utils";

export const clickableSurfaceClassName =
  "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function clickableSurface(extra?: string) {
  return cn(clickableSurfaceClassName, extra);
}
