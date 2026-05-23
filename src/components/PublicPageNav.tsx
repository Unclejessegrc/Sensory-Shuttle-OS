import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const PUBLIC_NAV_ITEMS = [
  { label: "Overview", to: "/app/strategy" as const },
  { label: "About the Developer", to: "/about-developer" as const },
  { label: "Software Demo", to: "/demo" as const },
];

export function PublicPageNav({
  current,
  className,
}: {
  current?: "overview" | "about" | "demo";
  className?: string;
}) {
  return (
    <nav
      aria-label="Public site navigation"
      className={cn(
        "sticky top-0 z-20 -mx-4 -mt-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-8 md:px-8",
        className,
      )}
    >
      <div className="flex gap-2 overflow-x-auto">
        {PUBLIC_NAV_ITEMS.map((item) => {
          const selected =
            (current === "overview" && item.to === "/app/strategy") ||
            (current === "about" && item.to === "/about-developer") ||
            (current === "demo" && item.to === "/demo");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "shrink-0 rounded-md border px-3 py-1.5 text-xs transition-colors",
                selected
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
