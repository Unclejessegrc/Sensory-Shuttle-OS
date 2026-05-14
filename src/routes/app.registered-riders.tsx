import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for /app/registered-riders/*.
 * The list lives at /app/registered-riders (index) and the detail / new pages
 * mount as siblings — this layout only provides the Outlet so children render.
 */
export const Route = createFileRoute("/app/registered-riders")({
  component: () => <Outlet />,
});
