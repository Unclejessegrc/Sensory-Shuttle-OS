import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { drivers, riders, vehicles } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { filterRidesForScope, getAccessScope } from "@/lib/access-control";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  MessageCircle,
  Flag,
  CalendarPlus,
} from "lucide-react";
import { clickableSurface } from "@/components/ClickableSurface";

export const Route = createFileRoute("/app/caregiver")({
  component: () => (
    <RoleGate allow={["caregiver", "dispatcher", "broker"]}>
      <Caregiver />
    </RoleGate>
  ),
});

function friendly(level: "high" | "medium" | "low") {
  if (level === "high")
    return {
      msg: "Your driver is on the way and on track. Everything looks good.",
      icon: CheckCircle2,
      cls: "text-success",
      bg: "bg-success/10 border-success/30",
    };
  if (level === "medium")
    return {
      msg: "Your driver is on the way. We're watching the route closely.",
      icon: CheckCircle2,
      cls: "text-warning-foreground",
      bg: "bg-warning/15 border-warning/40",
    };
  return {
    msg: "Driver location hasn't updated recently. Dispatch has been alerted.",
    icon: AlertTriangle,
    cls: "text-destructive",
    bg: "bg-destructive/10 border-destructive/40",
  };
}

function Caregiver() {
  const { rides, role } = useStore();
  const { roles } = useAuth();
  const accessScope = getAccessScope(roles, role);
  const caregiverRides = filterRidesForScope(accessScope, rides);
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const ride =
    caregiverRides.find((r) => r.appointmentDate === new Date().toISOString().slice(0, 10)) ??
    caregiverRides[0];
  if (!ride) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">My rides</h1>
        <RequestRideCard requestDate={requestDate} setRequestDate={setRequestDate} />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No booked rides are assigned to your rider yet.
          </CardContent>
        </Card>
      </div>
    );
  }
  const rider = riders.find((r) => r.id === ride.riderId)!;
  const driver = drivers.find((d) => d.id === ride.driverId);
  const vehicle = vehicles.find((v) => v.id === ride.vehicleId);
  const f = friendly(ride.etaConfidence);
  const Icon = f.icon;
  const canTrackLive = ["en_route_pickup", "arrived_pickup", "in_transit"].includes(ride.status);

  const timeline = [
    { label: "Ride scheduled", at: ride.appointmentTime, done: true },
    { label: "Driver assigned", at: "—", done: !!ride.driverId },
    {
      label: "Driver en route",
      at: "—",
      done: ["en_route_pickup", "arrived_pickup", "in_transit", "completed"].includes(ride.status),
    },
    {
      label: "Arrived at pickup",
      at: "—",
      done: ["arrived_pickup", "in_transit", "completed"].includes(ride.status),
    },
    { label: "Rider picked up", at: "—", done: ["in_transit", "completed"].includes(ride.status) },
    { label: "Dropped off", at: "—", done: ride.status === "completed" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-32 md:pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{rider.name}'s ride</h1>
        <p className="text-sm text-muted-foreground">
          {ride.appointmentType} · {ride.appointmentDate} at {ride.appointmentTime}
        </p>
      </div>

      <RequestRideCard requestDate={requestDate} setRequestDate={setRequestDate} />

      <Link
        to={canTrackLive ? "/app/live-gps/$rideId" : "/app/details/$topic"}
        params={canTrackLive ? { rideId: ride.id } : { topic: "caregiver-ride" }}
        aria-label="Open current ride ETA details"
        className={clickableSurface(`block rounded-xl border-2 p-5 ${f.bg}`)}
      >
        <div className={`flex items-start gap-3 ${f.cls}`}>
          <Icon className="h-6 w-6 mt-0.5 shrink-0" />
          <div>
            <div className="text-base font-medium">{f.msg}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Updated just now · {ride.etaReasons.join(" · ")}
            </div>
          </div>
        </div>
      </Link>

      <Link
        to={canTrackLive ? "/app/live-gps/$rideId" : "/app/details/$topic"}
        params={canTrackLive ? { rideId: ride.id } : { topic: "caregiver-ride" }}
        aria-label="Open driver and vehicle details"
        className={clickableSurface("block rounded-lg")}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Driver & vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Driver</div>
              <div className="font-medium">{driver?.name ?? "Assigning…"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Vehicle</div>
              <div className="font-medium">{vehicle?.type ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Plate</div>
              <div className="font-medium">{vehicle?.plate ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ETA</div>
              <div className="font-medium capitalize">{ride.etaConfidence}</div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-border ml-2 space-y-3">
            {timeline.map((t) => (
              <li key={t.label} className="ml-4">
                <span
                  className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full ring-4 ring-card ${t.done ? "bg-primary" : "bg-muted"}`}
                />
                <div className={`text-sm ${t.done ? "font-medium" : "text-muted-foreground"}`}>
                  {t.label}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Desktop actions; mobile uses sticky footer below */}
      <div className="hidden md:grid grid-cols-3 gap-2">
        {canTrackLive && (
          <Button asChild>
            <Link to="/app/live-gps/$rideId" params={{ rideId: ride.id }}>
              Track driver
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={() => toast.success("Dispatch messaged")}>
          Message dispatch
        </Button>
        <Button variant="outline" onClick={() => toast.success("Return ride requested")}>
          Request return ride
        </Button>
        <Button variant="destructive" onClick={() => toast("Issue form opened")}>
          Report issue
        </Button>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Pickup: {ride.pickupAddress}
      </div>

      {/* Mobile sticky footer — large primary actions for caregivers */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur p-3 grid grid-cols-3 gap-2">
        <Button
          size="lg"
          variant="outline"
          className="h-12"
          onClick={() => toast.success("Calling driver")}
        >
          <Phone className="h-4 w-4 mr-1" />
          Driver
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12"
          onClick={() => toast.success("Dispatch messaged")}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Dispatch
        </Button>
        <Button
          size="lg"
          variant="destructive"
          className="h-12"
          onClick={() => toast("Issue form opened")}
        >
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      </div>
    </div>
  );
}

function RequestRideCard({
  requestDate,
  setRequestDate,
}: {
  requestDate: string;
  setRequestDate: (value: string) => void;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-primary" />
          Request a Ride
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Choose the appointment date first. Then enter the pickup, drop-off, time, and support
          details for the ride.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="request-date">Appointment date</Label>
            <Input
              id="request-date"
              type="date"
              value={requestDate}
              onChange={(event) => setRequestDate(event.target.value)}
            />
          </div>
          <Button asChild>
            <Link to="/app/book" search={{ date: requestDate }}>
              Continue to booking
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
