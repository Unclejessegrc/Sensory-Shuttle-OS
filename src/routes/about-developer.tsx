import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicPageNav } from "@/components/PublicPageNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about-developer")({
  head: () => ({
    meta: [
      { title: "About the Developer - Sensory Shuttle" },
      {
        name: "description",
        content:
          "Learn about Sarah DeLuca, the founder and developer behind Sensory Shuttle, and the lived experience that shaped the project.",
      },
    ],
  }),
  component: AboutDeveloperPage,
});

const bioSections = [
  {
    title: "Founder",
    paragraphs: [
      "My name is Sarah DeLuca, and I am the founder and developer behind Sensory Shuttle.",
    ],
  },
  {
    title: "Why Sensory Shuttle Exists",
    paragraphs: [
      "Sensory Shuttle was created from my personal experience as a mother of a neurodivergent child. I know what it feels like when transportation is not simple. Some children need predictability, patience, clear communication, and a calmer environment just to get through the day. For families like mine, a ride is not just a ride. It can affect whether a child arrives calm, overwhelmed, safe, or unable to participate at all.",
      "I started building Sensory Shuttle because I saw a gap that standard transportation systems were not solving. Most ride systems focus on pickup time, drop-off time, and mileage. Sensory Shuttle is being designed around the child's actual needs: sensory preferences, caregiver notes, safety flags, appointment type, communication needs, and driver instructions.",
    ],
  },
  {
    title: "How It Is Being Built",
    paragraphs: [
      "I am not building this from a corporate office. I am building it from lived experience, research, problem-solving, and a deep belief that families deserve better systems. I am a mother first, and that perspective shapes every part of this project.",
      "The Sensory Shuttle platform is being developed as both a transportation concept and a support system. The goal is to help booking agents, dispatchers, drivers, caregivers, and management communicate more clearly while protecting sensitive rider information. The system includes ride booking, registered rider profiles, safety notes, incident reporting, caregiver instructions, and dispatch tools that can help prevent poor ride matches or late pickups.",
    ],
  },
  {
    title: "Long-Term Goal",
    paragraphs: [
      "My long-term goal is to launch a small, controlled Rhode Island pilot or partner with an existing transportation provider. I want to prove the model carefully before growing. Because this work involves children, safety, trust, and compliance, I believe it needs to be built slowly and responsibly.",
      "Sensory Shuttle is personal to me, but it is also practical. It is my attempt to turn real frustration into a safer, calmer, more thoughtful transportation option for children and families who are often overlooked by standard systems.",
    ],
  },
];

const valueCards = [
  {
    title: "Lived Experience",
    body: "Built from the perspective of a mother who understands how transportation can affect a child's entire day.",
    icon: Heart,
  },
  {
    title: "Safety and Accountability",
    body: "Designed to improve communication, documentation, rider notes, and responsible ride coordination.",
    icon: ShieldCheck,
  },
  {
    title: "Pilot-First Growth",
    body: "Focused on proving the model carefully before expanding.",
    icon: Sparkles,
  },
];

function AboutDeveloperPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-4 md:px-8 md:py-8">
        <PublicPageNav current="about" />

        <section className="rounded-2xl border bg-card p-6 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
                Founder story
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                About the Developer
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
                Built by a mother, shaped by lived experience, and designed for families who need
                transportation to feel safer, calmer, and more accountable.
              </p>
            </div>
            <figure className="shrink-0">
              <img
                src="/assets/family-pic2-full.jpg"
                alt="Sarah DeLuca with her family"
                className="rounded-xl border bg-background object-cover shadow-sm"
                style={{ width: "2in", height: "4in" }}
              />
            </figure>
          </div>
        </section>

        <section className="grid gap-4">
          {bioSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {valueCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <card.icon className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 text-sm text-muted-foreground md:text-base">
            Sensory Shuttle is currently in the planning and software demo stage. The goal is to
            build a pilot-ready model through funding, partnerships, compliance preparation, and
            responsible testing.
          </CardContent>
        </Card>

        <div className="flex justify-start pb-4">
          <Button size="lg" asChild>
            <Link to="/demo">View the Sensory Shuttle Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
