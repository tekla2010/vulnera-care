import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, History as HistoryIcon, LayoutDashboard, Users } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Alerts, CareTeam, Dashboard, History } from "@/components/demo/Screens";
import { alertsFor, baselines, liveReading, scenarioStatus, type Scenario } from "@/lib/sim";
import { statusStyles } from "@/components/demo/status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Vulnera App Demo — Live wound monitoring" },
      { name: "description", content: "Try the Vulnera patient app with simulated data: live wound status, alerts, 7-day history and your care team." },
      { property: "og:title", content: "Vulnera App Demo" },
      { property: "og:description", content: "Watch the Vulnera app react live to normal healing, early warnings and critical alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Demo,
});

const scenarios: { id: Scenario; label: string }[] = [
  { id: "normal", label: "Normal healing" },
  { id: "warning", label: "Early infection warning" },
  { id: "critical", label: "Critical alert" },
];
const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "care", label: "Care team", icon: Users },
] as const;
type Tab = (typeof tabs)[number]["id"];

function Demo() {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [reading, setReading] = useState(baselines.normal);

  useEffect(() => {
    setReading(liveReading(scenario));
    const id = setInterval(() => setReading(liveReading(scenario)), 2000);
    return () => clearInterval(id);
  }, [scenario]);

  const unread = alertsFor[scenario].filter((a) => a.level !== "healthy").length;

  return (
    <div className="min-h-screen bg-hero">
      <Header />
      <main className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-12 lg:grid-cols-[1fr_auto] lg:py-16">
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Interactive demo</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">The Vulnera patient app</h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">All data here is simulated. Switch scenarios to watch the dashboard, colors and notifications change live.</p>
          <fieldset className="mt-8 max-w-md">
            <legend className="text-sm font-semibold">Simulate scenario</legend>
            <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Simulate scenario">
              {scenarios.map((s) => {
                const st = statusStyles[scenarioStatus[s.id]];
                const active = scenario === s.id;
                return (
                  <button key={s.id} role="radio" aria-checked={active} onClick={() => setScenario(s.id)}
                    className={cn("flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left font-medium transition-all", active ? "border-primary shadow-soft ring-2 ring-primary/20" : "border-border hover:border-primary/40")}>
                    <span className={cn("size-3 rounded-full", st.solid)} aria-hidden="true" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mx-auto w-full max-w-[380px]">
          <div className="rounded-[3rem] border-[10px] border-foreground bg-foreground shadow-phone">
            <div className="relative flex h-[720px] flex-col overflow-hidden rounded-[2.3rem] bg-background">
              <div className="flex items-center justify-between px-6 pb-2 pt-3 text-[11px] font-semibold">
                <span>9:41</span>
                <span className="h-5 w-24 rounded-full bg-foreground" aria-hidden="true" />
                <span>100%</span>
              </div>
              <div className="flex items-center justify-between px-5 py-2">
                <div>
                  <p className="text-xs text-muted-foreground">Good afternoon,</p>
                  <p className="font-bold">Alex</p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">Bandage · Left knee</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2" role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label}>
                {tab === "dashboard" && <Dashboard scenario={scenario} reading={reading} />}
                {tab === "alerts" && <Alerts scenario={scenario} />}
                {tab === "history" && <History scenario={scenario} />}
                {tab === "care" && <CareTeam />}
              </div>
              <nav className="grid grid-cols-4 border-t border-border bg-card px-2 pb-4 pt-2" role="tablist" aria-label="App screens">
                {tabs.map(({ id, label, icon: I }) => (
                  <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={cn("relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors", tab === id ? "text-primary" : "text-muted-foreground")}>
                    <I className="size-5" aria-hidden="true" />
                    {label}
                    {id === "alerts" && unread > 0 && (
                      <span className={cn("absolute right-4 top-0 grid size-4 place-items-center rounded-full text-[9px] text-primary-foreground", statusStyles[scenarioStatus[scenario]].solid)} aria-label={`${unread} unread alerts`}>{unread}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
