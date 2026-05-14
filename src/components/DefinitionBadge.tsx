import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

type Definition = {
  title: string;
  meaning: string;
  bookingAction: string;
  accountabilityAction: string;
};

const DEFINITIONS: Record<string, Definition> = {
  "High Sensory": {
    title: "High Sensory",
    meaning:
      "The rider should only be matched with sensory-trained drivers and low-stimulation vehicles.",
    bookingAction:
      "Use a quiet vehicle, predictable communication, no strong scents, no loud music, and extra pickup patience.",
    accountabilityAction:
      "If the accommodation is ignored, the ride is flagged for broker/provider review as a sensory compliance failure.",
  },
  "High sensory": {
    title: "High sensory support",
    meaning:
      "The rider has a high risk of distress from noise, scents, sudden changes, crowded communication, or rushed pickup handling.",
    bookingAction:
      "The transportation network should assign a sensory-trained driver, quiet vehicle, no strong scents, no loud music, predictable communication, and extra pickup patience.",
    accountabilityAction:
      "If the ride is assigned to an untrained driver or the accommodation is ignored, the system flags the driver and provider for broker review.",
  },
  "High sensory support": {
    title: "High sensory support",
    meaning:
      "The rider has a high risk of distress from noise, scents, sudden changes, crowded communication, or rushed pickup handling.",
    bookingAction:
      "The transportation network should assign a sensory-trained driver, quiet vehicle, no strong scents, no loud music, predictable communication, and extra pickup patience.",
    accountabilityAction:
      "If the ride is assigned to an untrained driver or the accommodation is ignored, the system flags the driver and provider for broker review.",
  },
  "Sensory-trained driver only": {
    title: "Sensory-trained driver only",
    meaning:
      "This rider must be matched with a driver who has completed sensory-support training and understands de-escalation instructions.",
    bookingAction:
      "The booking agent should not dispatch this ride to a driver without sensory training unless a broker supervisor overrides it.",
    accountabilityAction:
      "A mismatch becomes visible to the broker network and provider as a driver/company compliance issue.",
  },
  "Quiet ride": {
    title: "Quiet ride",
    meaning:
      "The rider needs a low-stimulation trip with radio/music off and minimal unnecessary conversation.",
    bookingAction: "Add quiet ride to the trip manifest and driver checklist before dispatch.",
    accountabilityAction:
      "Complaints about noise are tied back to the ride, driver, provider, and checklist confirmation.",
  },
  "Quiet Ride": {
    title: "Quiet Ride",
    meaning: "No loud music, unnecessary conversation, loud phone audio, or sudden communication.",
    bookingAction:
      "Put quiet ride on the trip manifest and require driver acknowledgement before pickup.",
    accountabilityAction:
      "Noise complaints are tied back to the driver, ride, provider, and required accommodation.",
  },
  "No scents": {
    title: "No strong scents",
    meaning:
      "The vehicle should not have air fresheners, smoke smell, heavy perfume, or other strong odors.",
    bookingAction: "Assign a scent-free vehicle and require the driver to confirm the cabin check.",
    accountabilityAction:
      "Scent complaints are treated as accommodation failures and appear in the provider scorecard.",
  },
  "No strong scents": {
    title: "No strong scents",
    meaning:
      "The vehicle should not have air fresheners, smoke smell, heavy perfume, or other strong odors.",
    bookingAction: "Assign a scent-free vehicle and require the driver to confirm the cabin check.",
    accountabilityAction:
      "Scent complaints are treated as accommodation failures and appear in the provider scorecard.",
  },
  "No Strong Scents": {
    title: "No Strong Scents",
    meaning:
      "Driver should avoid perfume, smoke smell, air fresheners, and strong cleaning smells.",
    bookingAction:
      "Assign a scent-free vehicle and make the driver confirm the cabin check before starting.",
    accountabilityAction:
      "Scent complaints become accommodation failures on the ride and provider scorecard.",
  },
  "No loud music": {
    title: "No loud music",
    meaning:
      "Music, radio, videos, or phone audio should be off or kept at a level approved by the rider/caregiver.",
    bookingAction: "Add this requirement to the driver checklist and pre-trip instructions.",
    accountabilityAction: "A violation is logged as a failed rider accommodation.",
  },
  "No Loud Music": {
    title: "No Loud Music",
    meaning:
      "Music, radio, videos, and phone audio should stay off or at a level approved by the rider or caregiver.",
    bookingAction: "Add no-loud-music to the driver checklist and pre-trip instructions.",
    accountabilityAction: "A violation is logged as a failed rider accommodation.",
  },
  Wheelchair: {
    title: "Wheelchair required",
    meaning: "The rider needs a wheelchair-accessible vehicle or wheelchair-capable assistance.",
    bookingAction:
      "Only assign WAV-capable vehicles and drivers certified for wheelchair securement.",
    accountabilityAction:
      "Wrong-vehicle assignments are broker-visible hard fails and can restrict a provider's eligibility.",
  },
  "Wheelchair required": {
    title: "Wheelchair required",
    meaning: "The rider needs a wheelchair-accessible vehicle or wheelchair-capable assistance.",
    bookingAction:
      "Only assign WAV-capable vehicles and drivers certified for wheelchair securement.",
    accountabilityAction:
      "Wrong-vehicle assignments are broker-visible hard fails and can restrict a provider's eligibility.",
  },
  "WAV vehicle": {
    title: "Wheelchair accessible vehicle",
    meaning:
      "A vehicle with lift or ramp access and proper wheelchair securement equipment is required.",
    bookingAction:
      "The ride should not dispatch unless the assigned vehicle meets the WAV requirement.",
    accountabilityAction:
      "Failed WAV matching is visible to the broker network as a provider dispatch error.",
  },
  "WAV Required": {
    title: "WAV Required",
    meaning:
      "The vehicle must be wheelchair accessible with confirmed lift/ramp and securement capability.",
    bookingAction:
      "Do not dispatch unless the assigned vehicle and driver can support WAV transport.",
    accountabilityAction:
      "Failed WAV matching is visible to the broker network as a provider dispatch error.",
  },
  "Power Wheelchair": {
    title: "Power wheelchair",
    meaning:
      "The rider uses a powered wheelchair and needs a compatible lift/ramp and securement setup.",
    bookingAction: "Assign a WAV vehicle with lift/ramp capacity and a trained securement driver.",
    accountabilityAction: "Wrong-vehicle dispatch becomes a broker-visible hard fail.",
  },
  Booster: {
    title: "Booster seat required",
    meaning: "A child rider requires an appropriate booster or car seat before transport.",
    bookingAction: "Assign a vehicle with the required seat installed and checked before pickup.",
    accountabilityAction:
      "Missing equipment blocks dispatch or creates a provider compliance flag.",
  },
  "Booster Seat": {
    title: "Booster seat required",
    meaning: "A child rider requires an appropriate booster or car seat before transport.",
    bookingAction: "Assign a vehicle with the required seat installed and checked before pickup.",
    accountabilityAction:
      "Missing equipment blocks dispatch or creates a provider compliance flag.",
  },
  "Booster required": {
    title: "Booster seat required",
    meaning: "A child rider requires an appropriate booster or car seat before transport.",
    bookingAction: "Assign a vehicle with the required seat installed and checked before pickup.",
    accountabilityAction:
      "Missing equipment blocks dispatch or creates a provider compliance flag.",
  },
  "Booster Required": {
    title: "Booster Required",
    meaning: "Vehicle must have a confirmed booster or car seat before dispatch.",
    bookingAction: "Assign a vehicle with the required seat installed and checked before pickup.",
    accountabilityAction:
      "Missing equipment blocks dispatch or creates a provider compliance flag.",
  },
  "Booster / car seat": {
    title: "Booster or car seat required",
    meaning: "A child rider requires an appropriate booster or car seat before transport.",
    bookingAction: "Assign a vehicle with the required seat installed and checked before pickup.",
    accountabilityAction:
      "Missing equipment blocks dispatch or creates a provider compliance flag.",
  },
  "Car Seat": {
    title: "Car seat required",
    meaning: "A child rider requires an appropriate car seat before transport.",
    bookingAction: "Assign a vehicle with the required seat installed and checked before pickup.",
    accountabilityAction:
      "Missing equipment blocks dispatch or creates a provider compliance flag.",
  },
  Stretcher: {
    title: "Stretcher transport",
    meaning:
      "The rider requires stretcher-capable transport rather than a standard seated vehicle.",
    bookingAction: "Assign only stretcher-equipped vehicles and properly trained staff.",
    accountabilityAction: "A standard vehicle assignment is a broker-visible hard fail.",
  },
  "Extra patience": {
    title: "Extra pickup patience",
    meaning:
      "The rider may need additional time to transition, board, or regulate before entering the vehicle.",
    bookingAction:
      "Build extra pickup time into ETA and instruct the driver not to rush or mark no-show early.",
    accountabilityAction:
      "Early no-show attempts are checked against GPS, geofence, and required wait time.",
  },
  "Caregiver req.": {
    title: "Caregiver required",
    meaning: "A caregiver or guardian must be present or ride along for the transport.",
    bookingAction:
      "Confirm caregiver attendance before dispatch and preserve a caregiver seat if needed.",
    accountabilityAction:
      "If the driver leaves without required caregiver coordination, the issue is logged.",
  },
  "Caregiver Required": {
    title: "Caregiver Required",
    meaning: "The ride should not begin unless the caregiver is present or confirmed.",
    bookingAction:
      "Confirm caregiver attendance before dispatch and preserve a caregiver seat if needed.",
    accountabilityAction:
      "If the ride begins without caregiver coordination, the event is logged for review.",
  },
  "Motion Sickness Risk": {
    title: "Motion Sickness Risk",
    meaning:
      "The rider may need smoother driving, fewer sudden stops, and extra time to avoid distress.",
    bookingAction:
      "Flag driver for smooth driving, avoid sudden braking, and build in a little extra time.",
    accountabilityAction:
      "Unsafe or rough driving complaints can be reviewed against the rider's accommodation profile.",
  },
  "Predictable Communication": {
    title: "Predictable Communication",
    meaning:
      "The rider does best with simple, expected communication and no sudden changes in instructions.",
    bookingAction:
      "Driver should use short, calm, predictable phrases and avoid unnecessary surprises.",
    accountabilityAction:
      "Communication-related complaints are checked against the required rider instructions.",
  },
  "Extra Pickup Patience": {
    title: "Extra Pickup Patience",
    meaning: "Driver should wait calmly and avoid rushing the caregiver or rider during pickup.",
    bookingAction: "Add extra wait time and instruct the driver not to mark no-show early.",
    accountabilityAction:
      "Early no-show attempts are checked against GPS, arrival time, and required wait time.",
  },
  "Blocked Driver On File": {
    title: "Blocked Driver On File",
    meaning: "One or more drivers should not be assigned to this rider.",
    bookingAction: "Dispatch should block those drivers unless a broker supervisor overrides it.",
    accountabilityAction:
      "Any attempted assignment to a blocked driver is visible in the audit trail.",
  },
  "Eligibility Needs Review": {
    title: "Eligibility Needs Review",
    meaning: "Coverage or authorization needs review before a ride is dispatched.",
    bookingAction: "Broker staff should verify eligibility before confirming the trip.",
    accountabilityAction:
      "Dispatch attempts while eligibility is unresolved are captured for review.",
  },
  "Authorization Expiring Soon": {
    title: "Authorization Expiring Soon",
    meaning: "The rider's transportation authorization is close to expiring.",
    bookingAction: "Confirm authorization before booking future trips.",
    accountabilityAction: "Expired or nearly expired authorizations stay visible to broker staff.",
  },
  "Authorization Expired": {
    title: "Authorization Expired",
    meaning: "The rider's transportation authorization is expired.",
    bookingAction: "Do not dispatch until authorization is renewed or manually approved.",
    accountabilityAction: "Blocked dispatch attempts are visible in the audit trail.",
  },
  "Walker assist": {
    title: "Walker assistance",
    meaning:
      "The rider uses a walker and may need help boarding, storing the walker, or entering the facility.",
    bookingAction:
      "Assign a driver and vehicle that can safely assist and store the mobility device.",
    accountabilityAction: "Missed assistance is visible as a service-quality failure.",
  },
  "Service animal": {
    title: "Service animal",
    meaning: "The rider travels with a trained service animal that must be accommodated.",
    bookingAction: "Do not assign drivers or vehicles that cannot accommodate the service animal.",
    accountabilityAction: "Refusal or mishandling is a broker-visible compliance issue.",
  },
  Ambulatory: {
    title: "Ambulatory rider",
    meaning:
      "The rider can walk but may still have timing, communication, sensory, or supervision needs.",
    bookingAction:
      "Review profile notes instead of assuming the ride is standard curb-to-curb service.",
    accountabilityAction: "Ignored profile instructions remain visible in ride review.",
  },
  Walker: {
    title: "Walker assistance",
    meaning:
      "The rider uses a walker and may need help boarding, storing the walker, or entering the facility.",
    bookingAction:
      "Assign a driver and vehicle that can safely assist and store the mobility device.",
    accountabilityAction: "Missed assistance is visible as a service-quality failure.",
  },
};

function definitionFor(term: string) {
  return (
    DEFINITIONS[term] ?? {
      title: term,
      meaning: "This is a rider-specific note from the profile or trip manifest.",
      bookingAction: "Review the full rider profile and apply the instruction before dispatch.",
      accountabilityAction:
        "If ignored, the note can be used by the broker network and provider during ride review.",
    }
  );
}

export function DefinitionBadge({
  term,
  children,
  className,
  variant = "secondary",
}: {
  term: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  const definition = definitionFor(term);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            badgeVariants({ variant }),
            "cursor-pointer gap-1 hover:ring-2 hover:ring-ring/40",
            className,
          )}
        >
          {children ?? term}
          <Info className="h-3 w-3" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{definition.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <DefinitionBlock label="What it means" value={definition.meaning} />
          <DefinitionBlock label="Booking action" value={definition.bookingAction} />
          <DefinitionBlock label="Accountability rule" value={definition.accountabilityAction} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DefinitionBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
