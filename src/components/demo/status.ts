import type { Status } from "@/lib/sim";
export const statusStyles: Record<Status, { solid: string; soft: string; text: string; color: string }> = {
  healthy: { solid: "bg-healthy", soft: "bg-healthy-soft", text: "text-healthy", color: "var(--healthy)" },
  watch: { solid: "bg-watch", soft: "bg-watch-soft", text: "text-watch", color: "var(--watch)" },
  alert: { solid: "bg-alert", soft: "bg-alert-soft", text: "text-alert", color: "var(--alert)" },
};
