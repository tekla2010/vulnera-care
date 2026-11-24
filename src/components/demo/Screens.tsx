import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, CheckCircle2, Droplets, MessageCircle, Phone, ShieldAlert, Thermometer, Waves, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alertsFor, series24h, series7d, statusLabel, scenarioStatus, type Reading, type Scenario, type Status } from "@/lib/sim";
import { statusStyles } from "./status";
import { cn } from "@/lib/utils";

const statusIcon: Record<Status, typeof CheckCircle2> = { healthy: CheckCircle2, watch: AlertTriangle, alert: ShieldAlert };
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

function metricStatus(key: keyof Reading, v: number): Status {
  const t: [number, number] = ({ temp: [34.5, 36.5], ph: [7.1, 7.9], moisture: [60, 74] } as Record<string, [number, number]>)[key] ?? [0, 0];
  if (key === "score") return v >= 75 ? "healthy" : v >= 55 ? "watch" : "alert";
  return v < t[0] ? "healthy" : v < t[1] ? "watch" : "alert";
}

function contactDoctor() { toast.success("Calling Dr. Maya Okafor… (demo)"); }

export function Dashboard({ scenario, reading }: { scenario: Scenario; reading: Reading }) {
  const status = scenarioStatus[scenario];
  const s = statusStyles[status];
  const Icon = statusIcon[status];
  const data = series24h(scenario);
  return (
    <div className="space-y-4">
      <div className={cn("rounded-3xl p-5 transition-colors duration-500", s.soft)} role="status" aria-live="polite" aria-label={`Wound status: ${statusLabel[status]}`}>
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <span className={cn("pulse-ring absolute inset-0 rounded-full opacity-40", s.solid)} aria-hidden="true" />
            <span className={cn("relative grid size-14 place-items-center rounded-full text-primary-foreground transition-colors duration-500", s.solid)}><Icon className="size-7" aria-hidden="true" /></span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Wound status</p>
            <p className={cn("text-2xl font-extrabold", s.text)}>{statusLabel[status]}</p>
            <p className="text-xs text-foreground/80">{statusCopy[status]}</p>
          </div>
        </div>
        {status === "alert" && (
          <Button onClick={contactDoctor} variant="destructive" className="mt-4 w-full rounded-full"><Phone /> Contact my doctor</Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ key, label, unit, icon: I }) => {
          const ms = metricStatus(key, reading[key]);
          const c = statusStyles[ms].color;
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><I className="size-3.5" aria-hidden="true" />{label}</span>
                <span className={cn("size-2 rounded-full", statusStyles[ms].solid)} role="img" aria-label={`${label} status: ${statusLabel[ms]}`} />
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums">{reading[key]}<span className="text-sm font-medium text-muted-foreground">{unit}</span></p>
              <div className="h-10" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Area type="monotone" dataKey={key} stroke={c} strokeWidth={2} fill={`url(#g-${key})`} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground">Last 24 hours</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Alerts({ scenario }: { scenario: Scenario }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5" aria-label="Notifications timeline">
      {alertsFor[scenario].map((a) => {
        const s = statusStyles[a.level];
        const I = statusIcon[a.level];
        return (
          <li key={a.id} className="fade-up relative">
            <span className={cn("absolute -left-[29px] top-3 grid size-4 place-items-center rounded-full ring-4 ring-background", s.solid)} role="img" aria-label={`Level: ${statusLabel[a.level]}`} />
            <div className={cn("rounded-2xl p-4", s.soft)}>
              <p className="text-[11px] text-muted-foreground">{a.time}</p>
              <p className="mt-1 flex items-start gap-2 text-sm font-semibold"><I className={cn("mt-0.5 size-4 shrink-0", s.text)} aria-hidden="true" />{a.title}</p>
              <p className="mt-2 text-xs text-foreground/80"><span className="font-semibold">Recommended: </span>{a.action}</p>
              {a.contact && (
                <Button size="sm" variant={a.level === "alert" ? "destructive" : "outline"} className="mt-3 rounded-full" onClick={contactDoctor}>
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

export function History({ scenario }: { scenario: Scenario }) {
  const data = series7d(scenario);
  return (
    <div className="space-y-3">
      {metrics.map(({ key, label, unit }, i) => (
        <div key={key} className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs font-semibold">{label} {unit && <span className="font-normal text-muted-foreground">({unit})</span>}</p>
          <div className="mt-1 h-24" role="img" aria-label={`${label} over the last 7 days`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 6, left: -28, bottom: 0 }}>
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
    </div>
  );
}

export function CareTeam() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-brand-gradient text-2xl font-bold text-primary-foreground" aria-hidden="true">MO</div>
        <p className="mt-3 text-lg font-bold">Dr. Maya Okafor</p>
        <p className="text-sm text-muted-foreground">Surgical follow-up · General Surgery</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button className="rounded-full" onClick={contactDoctor}><Phone /> Call</Button>
          <Button variant="outline" className="rounded-full" onClick={() => toast.success("Message sent to Dr. Okafor (demo)")}><MessageCircle /> Message</Button>
        </div>
      </div>
      <div className="space-y-2 rounded-2xl bg-muted p-4 text-sm">
        <p className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden="true" /> City Medical Center, Ward 4</p>
        <p className="flex items-center gap-2"><Clock className="size-4 text-primary" aria-hidden="true" /> Available Mon–Fri, 8:00–18:00</p>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">In an emergency, call your local emergency number.</p>
    </div>
  );
}
