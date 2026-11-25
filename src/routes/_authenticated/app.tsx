import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, History as HistoryIcon, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { addReading, saveProfile, syncBandage } from "@/lib/patient.functions";
import { patientHomeOptions } from "@/lib/patient.queries";
import {
  AppAlerts,
  AppCareTeam,
  AppDashboard,
  AppDetails,
  AppHistory,
} from "@/components/app/Screens";
import { statusLabel, type Scenario } from "@/lib/sim";
import { statusStyles } from "@/components/demo/status";
import { cn } from "@/lib/utils";
import type { PatientProfile } from "@/lib/patient.types";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "My wound — Vulnera" },
      { name: "description", content: "Your wound status, alerts and healing history, saved to your Vulnera account." },
      { property: "og:title", content: "My wound — Vulnera" },
      { property: "og:description", content: "Your wound status, alerts and healing history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(patientHomeOptions()),
  component: App,
});

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "care", label: "Care team", icon: Users },
  { id: "details", label: "My details", icon: Settings },
] as const;

type Tab = (typeof tabs)[number]["id"];

function App() {
  const { data } = useSuspenseQuery(patientHomeOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [busy, setBusy] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["patient-home"] });

  async function handleSync() {
    setBusy(true);
    try {
      const result = await syncBandage({ data: { scenario } });
      await refresh();
      if (result.alert) {
        if (result.alert.level === "healthy") toast.success(result.alert.title);
        else toast.error(result.alert.title);
      } else {
        toast.success(`Reading saved · ${statusLabel[result.status]}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the reading.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddReading(values: { tempC: number; ph: number; moisture: number; healingScore: number }) {
    setBusy(true);
    try {
      const result = await addReading({ data: values });
      await refresh();
      if (result.alert) {
        if (result.alert.level === "healthy") toast.success(result.alert.title);
        else toast.error(result.alert.title);
      } else {
        toast.success(`Reading saved · ${statusLabel[result.status]}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the reading.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(profile: PatientProfile) {
    setBusy(true);
    try {
      await saveProfile({ data: profile });
      await refresh();
      toast.success("Details saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your details.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const unread = data.alerts.filter((a) => a.level !== "healthy").length;
  const name = data.profile.displayName || data.profile.woundLocation || "there";
  const latest = data.readings[data.readings.length - 1];

  return (
    <div className="min-h-screen bg-hero">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-5">
          <Link to="/" aria-label="Vulnera home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            {latest && (
              <span
                className={cn(
                  "hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex",
                  statusStyles[latest.status].soft,
                  statusStyles[latest.status].text,
                )}
              >
                <span className={cn("size-2 rounded-full", statusStyles[latest.status].solid)} aria-hidden="true" />
                {statusLabel[latest.status]}
              </span>
            )}
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSignOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <p className="text-sm text-muted-foreground">Good to see you, {name}.</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
          {data.profile.woundLocation ? `Wound · ${data.profile.woundLocation}` : "Your wound"}
        </h1>

        <nav className="mt-6 flex flex-wrap gap-1 rounded-full bg-muted p-1" role="tablist" aria-label="App screens">
          {tabs.map(({ id, label, icon: I }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                tab === id ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <I className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              {id === "alerts" && unread > 0 && (
                <span
                  className={cn("grid size-4 place-items-center rounded-full text-[10px] text-primary-foreground", statusStyles[latest?.status ?? "watch"].solid)}
                  aria-label={`${unread} unread alerts`}
                >
                  {unread}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-6" role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label}>
          {tab === "dashboard" && (
            <AppDashboard
              readings={data.readings}
              scenario={scenario}
              setScenario={setScenario}
              onSync={handleSync}
              busy={busy}
            />
          )}
          {tab === "alerts" && <AppAlerts alerts={data.alerts} />}
          {tab === "history" && <AppHistory readings={data.readings} />}
          {tab === "care" && <AppCareTeam profile={data.profile} />}
          {tab === "details" && (
            <AppDetails
              profile={data.profile}
              onSave={handleSaveProfile}
              onAddReading={handleAddReading}
              busy={busy}
            />
          )}
        </div>
      </main>
    </div>
  );
}
