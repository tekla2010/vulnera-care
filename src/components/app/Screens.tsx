import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  Thermometer,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusStyles } from "@/components/demo/status";
import { changedKeys } from "@/lib/device-log";
import { statusLabel, type Scenario, type Status } from "@/lib/sim";
import { metricStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { PatientProfile, StoredAlert, StoredReading } from "@/lib/patient.types";

const statusIcon: Record<Status, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  watch: AlertTriangle,
  alert: ShieldAlert,
};

const statusCopy: Record<Status, string> = {
  healthy: "Your wound is healing as expected.",
  watch: "Some readings changed. We're watching closely.",
  alert: "Several infection indicators detected. Contact your doctor.",
};

const metrics = [
  { key: "temp", label: "Temperature", unit: "°C", icon: Thermometer },
  { key: "ph", label: "pH", unit: "", icon: Droplets },
  { key: "moisture", label: "Moisture", unit: "%", icon: Waves },
  { key: "score", label: "Healing score", unit: "", icon: Activity },
] as const;

const scenarios: { id: Scenario; label: string }[] = [
  { id: "normal", label: "Normal healing" },
  { id: "warning", label: "Early warning" },
  { id: "critical", label: "Critical" },
];

const timeFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function timeLabel(iso: string) {
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? iso : timeFmt.format(at);
}

/** Average the day's readings into one point per calendar day, newest last. */
function dailySeries(readings: StoredReading[]) {
  const out: { day: string; temp: number; ph: number; moisture: number; score: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000);
    const rows = readings.filter((r) => new Date(r.at).toDateString() === day.toDateString());
    if (!rows.length) continue;
    const avg = (pick: (r: StoredReading) => number) =>
      rows.reduce((sum, r) => sum + pick(r), 0) / rows.length;
    out.push({
      day: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day),
      temp: +avg((r) => r.temp).toFixed(1),
      ph: +avg((r) => r.ph).toFixed(2),
      moisture: Math.round(avg((r) => r.moisture)),
      score: Math.round(avg((r) => r.score)),
    });
  }
  return out;
}

function EmptyState({ onSync }: { onSync: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-lg font-bold">No readings yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Your bandage hasn't sent anything yet. Run a sync to see your wound status, and Vulnera will
        start watching for early signs of infection.
      </p>
      <Button onClick={onSync} className="mt-5 rounded-full">
        Sync bandage
      </Button>
    </div>
  );
}

export function AppDashboard({
  readings,
  scenario,
  setScenario,
  onSync,
  busy,
}: {
  readings: StoredReading[];
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  onSync: () => void;
  busy: boolean;
}) {
  const latest = readings[readings.length - 1];
  if (!latest) return <EmptyState onSync={onSync} />;

  const status = latest.status;
  const s = statusStyles[status];
  const Icon = statusIcon[status];
  const recent = readings.slice(-24);

  return (
    <div className="space-y-4">
      <div
        className={cn("rounded-3xl p-5 transition-colors duration-500", s.soft)}
        role="status"
        aria-live="polite"
        aria-label={`Wound status: ${statusLabel[status]}`}
      >
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <span className={cn("pulse-ring absolute inset-0 rounded-full opacity-40", s.solid)} aria-hidden="true" />
            <span
              className={cn(
                "relative grid size-14 place-items-center rounded-full text-primary-foreground transition-colors duration-500",
                s.solid,
              )}
            >
              <Icon className="size-7" aria-hidden="true" />
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Wound status · last read {timeLabel(latest.at)}
            </p>
            <p className={cn("text-2xl font-extrabold", s.text)}>{statusLabel[status]}</p>
            <p className="text-xs text-foreground/80">{statusCopy[status]}</p>
          </div>
        </div>
        {status === "alert" && (
          <Button
            variant="destructive"
            className="mt-4 w-full rounded-full"
            onClick={() => toast.success("Calling your care team… (demo)")}
          >
            <Phone /> Contact my doctor
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {metrics.map(({ key, label, unit, icon: I }) => {
          const ms = metricStatus(key, latest[key]);
          const c = statusStyles[ms].color;
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <I className="size-4" aria-hidden="true" />
                  {label}
                </span>
                <span
                  className={cn("size-2 rounded-full", statusStyles[ms].solid)}
                  role="img"
                  aria-label={`${label} status: ${statusLabel[ms]}`}
                />
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {latest[key]}
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              </p>
              <div className="mt-2 h-12" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recent} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`app-g-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Area
                      type="monotone"
                      dataKey={key}
                      stroke={c}
                      strokeWidth={2}
                      fill={`url(#app-g-${key})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last {recent.length} reading{recent.length === 1 ? "" : "s"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Read the bandage</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No physical device yet, so these values come from the simulator. The reading, its status and
          any alert are saved to your account.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Simulated sensor condition">
          {scenarios.map((sc) => {
            const st = statusStyles[sc.id === "normal" ? "healthy" : sc.id === "warning" ? "watch" : "alert"];
            const active = scenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setScenario(sc.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <span className={cn("size-2 rounded-full", st.solid)} aria-hidden="true" />
                {sc.label}
              </button>
            );
          })}
        </div>
        <Button onClick={onSync} disabled={busy} className="mt-4 w-full rounded-full sm:w-auto">
          {busy ? "Reading…" : "Sync bandage"}
        </Button>
      </div>
    </div>
  );
}

export function AppAlerts({ alerts }: { alerts: StoredAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-lg font-bold">Nothing to report</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Alerts appear here whenever your readings move out of the expected range.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5" aria-label="Notifications timeline">
      {alerts.map((a) => {
        const s = statusStyles[a.level];
        const I = statusIcon[a.level];
        return (
          <li key={a.id} className="fade-up relative">
            <span
              className={cn("absolute -left-[29px] top-3 grid size-4 place-items-center rounded-full ring-4 ring-background", s.solid)}
              role="img"
              aria-label={`Level: ${statusLabel[a.level]}`}
            />
            <div className={cn("rounded-2xl p-4", s.soft)}>
              <p className="text-[11px] text-muted-foreground">{timeLabel(a.at)}</p>
              <p className="mt-1 flex items-start gap-2 text-sm font-semibold">
                <I className={cn("mt-0.5 size-4 shrink-0", s.text)} aria-hidden="true" />
                {a.title}
              </p>
              <p className="mt-2 text-xs text-foreground/80">
                <span className="font-semibold">Recommended: </span>
                {a.action}
              </p>
              {a.contact && (
                <Button
                  size="sm"
                  variant={a.level === "alert" ? "destructive" : "outline"}
                  className="mt-3 rounded-full"
                  onClick={() => toast.success("Calling your care team… (demo)")}
                >
                  <Phone /> Contact my doctor
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MessageLog({ messages }: { messages: DeviceMessage[] }) {
  if (!messages.length) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-label="Every bandage message">
      <p className="text-xs font-semibold">Every bandage message ({messages.length})</p>
      <ol className="mt-2 space-y-2">
        {messages.map((m, i) => {
          const prev = messages[i + 1]?.payload ?? null;
          const changed = new Set(changedKeys(prev, m.payload));
          return (
            <li key={m.id} className="rounded-xl bg-muted p-2 text-xs">
              <p className="text-muted-foreground">{new Date(m.at).toLocaleString()} · {m.source}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(m.payload).map(([k, v]) => (
                  <span key={k} className={changed.has(k) ? "rounded-full bg-primary px-2 py-0.5 text-primary-foreground" : "rounded-full bg-background px-2 py-0.5"}>
                    {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function AppHistory({ readings, messages = [] }: { readings: StoredReading[]; messages?: DeviceMessage[] }) {
  const data = dailySeries(readings);
  if (data.length < 2) {
    if (messages.length) return <MessageLog messages={messages} />;
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-lg font-bold">Not enough history yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sync your bandage over a few days and your trends will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {metrics.map(({ key, label, unit }, i) => (
        <div key={key} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold">
            {label} {unit && <span className="font-normal text-muted-foreground">({unit})</span>}
          </p>
          <div className="mt-1 h-28" role="img" aria-label={`${label} over the last 7 days`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis domain={["dataMin", "dataMax"]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 11 }} />
                <Line type="monotone" dataKey={key} stroke={`var(--chart-${i + 1})`} strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
      <MessageLog messages={messages} />
    </div>
  );
}

export function AppCareTeam({ profile }: { profile: PatientProfile }) {
  if (!profile.careTeam) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-lg font-bold">No care team yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your doctor and clinic under My details so you can reach them in one tap.
        </p>
      </div>
    );
  }

  const initials = profile.careTeam
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-brand-gradient text-2xl font-bold text-primary-foreground" aria-hidden="true">
          {initials || "?"}
        </div>
        <p className="mt-3 text-lg font-bold">{profile.careTeam}</p>
        {profile.clinic && <p className="text-sm text-muted-foreground">{profile.clinic}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button className="rounded-full" onClick={() => toast.success("Calling your care team… (demo)")}>
            <Phone /> Call
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => toast.success("Message sent (demo)")}>
            <MessageCircle /> Message
          </Button>
        </div>
      </div>
      <div className="space-y-2 rounded-2xl bg-muted p-4 text-sm">
        {profile.clinic && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {profile.clinic}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Clock className="size-4 text-primary" aria-hidden="true" />
          Available Mon–Fri, 8:00–18:00
        </p>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        In an emergency, call your local emergency number.
      </p>
    </div>
  );
}

export function AppDetails({
  profile,
  onSave,
  onAddReading,
  busy,
}: {
  profile: PatientProfile;
  onSave: (p: PatientProfile) => void;
  onAddReading: (r: { tempC: number; ph: number; moisture: number; healingScore: number }) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<PatientProfile>(profile);
  const [manual, setManual] = useState({ tempC: "33.4", ph: "6.6", moisture: "52", healingScore: "86" });

  const field = (key: keyof PatientProfile, label: string, placeholder: string) => (
    <div>
      <label htmlFor={`detail-${key}`} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={`detail-${key}`}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="h-11 rounded-xl"
      />
    </div>
  );

  const numberField = (key: keyof typeof manual, label: string, step: string) => (
    <div>
      <label htmlFor={`manual-${key}`} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={`manual-${key}`}
        type="number"
        step={step}
        value={manual[key]}
        onChange={(e) => setManual({ ...manual, [key]: e.target.value })}
        className="h-11 rounded-xl"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3 rounded-3xl border border-border bg-card p-5"
      >
        <h2 className="text-base font-bold">My details</h2>
        {field("displayName", "Your name", "Alex Rivera")}
        {field("woundLocation", "Wound location", "Left knee")}
        {field("careTeam", "Care team", "Dr. Maya Okafor")}
        {field("clinic", "Clinic", "City Medical Center, Ward 4")}
        <Button type="submit" disabled={busy} className="w-full rounded-full">
          {busy ? "Saving…" : "Save details"}
        </Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddReading({
            tempC: Number(manual.tempC),
            ph: Number(manual.ph),
            moisture: Number(manual.moisture),
            healingScore: Number(manual.healingScore),
          });
        }}
        className="space-y-3 rounded-3xl border border-border bg-card p-5"
      >
        <h2 className="text-base font-bold">Add a reading by hand</h2>
        <p className="text-xs text-muted-foreground">
          Use this for a measurement taken in clinic. Vulnera works out the status from the values.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {numberField("tempC", "Temperature °C", "0.1")}
          {numberField("ph", "pH", "0.01")}
          {numberField("moisture", "Moisture %", "1")}
          {numberField("healingScore", "Healing score", "1")}
        </div>
        <Button type="submit" variant="outline" disabled={busy} className="w-full rounded-full">
          Save reading
        </Button>
      </form>
    </div>
  );
}
