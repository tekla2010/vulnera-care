import type { Reading, Status } from "@/lib/sim";

/**
 * Wound-bed thresholds used to turn raw sensor values into a status.
 *
 * ILLUSTRATIVE ONLY — these are not clinically validated cut-offs.
 * A medical advisor must review them before this is shown to patients.
 */
const ranges: Record<Exclude<keyof Reading, "score">, [number, number]> = {
  temp: [34.5, 36.5],
  ph: [7.1, 7.9],
  moisture: [60, 74],
};

const order: Status[] = ["healthy", "watch", "alert"];

export function metricStatus(key: keyof Reading, value: number): Status {
  if (key === "score") return value >= 75 ? "healthy" : value >= 55 ? "watch" : "alert";
  const [ok, warn] = ranges[key];
  return value < ok ? "healthy" : value < warn ? "watch" : "alert";
}

/** Overall status is the worst of the individual metric statuses. */
export function statusFor(reading: Reading): Status {
  return (Object.keys(reading) as (keyof Reading)[]).reduce<Status>((worst, key) => {
    const next = metricStatus(key, reading[key]);
    return order.indexOf(next) > order.indexOf(worst) ? next : worst;
  }, "healthy");
}

export interface AlertCopy {
  level: Status;
  title: string;
  action: string;
  contact: boolean;
}

/** A notification is only worth sending when the status actually changes. */
export function alertForTransition(from: Status, to: Status): AlertCopy | null {
  if (from === to) return null;
  if (to === "alert") {
    return {
      level: "alert",
      title: "Multiple infection indicators detected, contact your doctor",
      action: "Contact your care team now. If you have fever, chills or confusion, seek urgent care.",
      contact: true,
    };
  }
  if (to === "watch") {
    return {
      level: "watch",
      title: "Wound readings moved outside the expected range",
      action: "Rest, stay hydrated and check for redness or swelling. We'll keep monitoring.",
      contact: true,
    };
  }
  return {
    level: "healthy",
    title: "Wound readings are back in the expected range",
    action: "No action needed. Keep the bandage dry and in place.",
    contact: false,
  };
}
