export type Scenario = "normal" | "warning" | "critical";
export type Status = "healthy" | "watch" | "alert";

export const scenarioStatus: Record<Scenario, Status> = { normal: "healthy", warning: "watch", critical: "alert" };
export const statusLabel: Record<Status, string> = { healthy: "Healthy", watch: "Watch", alert: "Alert" };

export interface Reading { temp: number; ph: number; moisture: number; score: number }

// Wound-bed baselines per scenario (simulated, illustrative only)
export const baselines: Record<Scenario, Reading> = {
  normal: { temp: 33.4, ph: 6.6, moisture: 52, score: 86 },
  warning: { temp: 35.1, ph: 7.4, moisture: 64, score: 68 },
  critical: { temp: 37.2, ph: 8.2, moisture: 79, score: 41 },
};

const jitter: Reading = { temp: 0.15, ph: 0.05, moisture: 1.5, score: 1 };

export function liveReading(s: Scenario): Reading {
  const b = baselines[s];
  const j = (k: keyof Reading) => b[k] + (Math.random() - 0.5) * 2 * jitter[k];
  return { temp: +j("temp").toFixed(1), ph: +j("ph").toFixed(2), moisture: Math.round(j("moisture")), score: Math.round(j("score")) };
}

function seeded(n: number) { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }

/** 24 hourly points drifting from a healthy baseline toward the scenario's current values. */
export function series24h(s: Scenario) {
  const from = baselines.normal, to = baselines[s];
  return Array.from({ length: 24 }, (_, i) => {
    const t = s === "normal" ? 0 : Math.pow(Math.max(0, (i - 10) / 13), 1.6);
    const r = (k: keyof Reading, d: number) => from[k] + (to[k] - from[k]) * t + (seeded(i + k.length) - 0.5) * d;
    return { hour: `${String(i).padStart(2, "0")}:00`, temp: +r("temp", 0.3).toFixed(1), ph: +r("ph", 0.1).toFixed(2), moisture: Math.round(r("moisture", 3)), score: Math.round(r("score", 2)) };
  });
}

export function series7d(s: Scenario) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const start: Reading = { temp: 34.6, ph: 7.3, moisture: 70, score: 55 };
  return days.map((day, i) => {
    const healing = i / 6;
    const end = s === "normal" ? baselines.normal : baselines[s];
    const t = s === "normal" ? healing : i < 4 ? i / 4 : 1 - (i - 3) / 3;
    const mid = baselines.normal;
    const v = (k: keyof Reading) =>
      s === "normal" ? start[k] + (mid[k] - start[k]) * t : i < 4 ? start[k] + (mid[k] - start[k]) * t : end[k] + (mid[k] - end[k]) * t;
    return { day, temp: +v("temp").toFixed(1), ph: +v("ph").toFixed(2), moisture: Math.round(v("moisture")), score: Math.round(v("score")) };
  });
}

export interface AlertItem { id: string; time: string; level: Status; title: string; action: string; contact?: boolean }

export const alertsFor: Record<Scenario, AlertItem[]> = {
  normal: [
    { id: "n1", time: "Today, 09:12", level: "healthy", title: "Wound readings stable overnight", action: "No action needed. Keep the bandage dry and in place." },
    { id: "n2", time: "Yesterday, 18:40", level: "healthy", title: "Healing score improved to 86", action: "Great progress. Continue your care plan." },
  ],
  warning: [
    { id: "w1", time: "Today, 11:05", level: "watch", title: "Slight temperature rise detected", action: "Rest, stay hydrated and check for redness or swelling. We'll keep monitoring.", contact: true },
    { id: "w2", time: "Today, 08:30", level: "watch", title: "Wound pH trending upward", action: "Avoid touching the bandage. Note any new pain or discharge." },
    { id: "w3", time: "Yesterday, 18:40", level: "healthy", title: "Healing score at 84", action: "No action needed." },
  ],
  critical: [
    { id: "c1", time: "Today, 13:22", level: "alert", title: "Multiple infection indicators detected, contact your doctor", action: "Contact your care team now. If you have fever, chills or confusion, seek urgent care.", contact: true },
    { id: "c2", time: "Today, 11:05", level: "watch", title: "Slight temperature rise detected", action: "Rest and monitor for redness or swelling.", contact: true },
    { id: "c3", time: "Today, 08:30", level: "watch", title: "Wound pH trending upward", action: "Note any new pain or discharge." },
  ],
};
