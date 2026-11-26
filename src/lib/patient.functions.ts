import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nextSimulatedReading, type Reading } from "@/lib/sim";
import { alertForTransition, statusFor } from "@/lib/status";
import type { Status } from "@/lib/sim";
import { tryCoreReading } from "@/lib/bandage-ble";
import type { DeviceMessage, PatientHome, PatientProfile, StoredAlert, StoredReading } from "./patient.types";

const asStatus = (value: string): Status =>
  value === "watch" || value === "alert" ? value : "healthy";

const emptyProfile: PatientProfile = {
  displayName: "",
  woundLocation: "",
  careTeam: "",
  clinic: "",
};

export const getPatientHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PatientHome> => {
    const { supabase, userId } = context;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [profileRes, readingsRes, alertsRes, messagesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, wound_location, care_team, clinic")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("readings")
        .select("temp_c, ph, moisture, healing_score, status, recorded_at")
        .eq("user_id", userId)
        .gte("recorded_at", sevenDaysAgo)
        .order("recorded_at", { ascending: true })
        .limit(1000),
      supabase
        .from("alerts")
        .select("id, level, title, action, contact_doctor, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("device_messages")
        .select("id, payload, source, received_at")
        .eq("user_id", userId)
        .order("received_at", { ascending: false })
        .limit(1000),
    ]);

    for (const res of [profileRes, readingsRes, alertsRes, messagesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const readings: StoredReading[] = (readingsRes.data ?? []).map((row) => ({
      temp: Number(row.temp_c),
      ph: Number(row.ph),
      moisture: Number(row.moisture),
      score: Number(row.healing_score),
      status: asStatus(row.status),
      at: row.recorded_at,
    }));

    const alerts: StoredAlert[] = (alertsRes.data ?? []).map((row) => ({
      id: row.id,
      at: row.created_at,
      level: asStatus(row.level),
      title: row.title,
      action: row.action,
      contact: Boolean(row.contact_doctor),
    }));

    const messages: DeviceMessage[] = (messagesRes.data ?? []).map((row) => ({
      id: row.id,
      at: row.received_at,
      source: row.source,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    }));

    const profileRow = profileRes.data;

    return {
      profile: profileRow
        ? {
            displayName: profileRow.display_name,
            woundLocation: profileRow.wound_location,
            careTeam: profileRow.care_team,
            clinic: profileRow.clinic,
          }
        : emptyProfile,
      readings,
      alerts,
      messages,
    };
  });

const syncSchema = z.object({ scenario: z.enum(["normal", "warning", "critical"]) });

/**
 * Reads the bandage and stores what it saw. There is no physical device yet,
 * so the sensor values come from the simulator — but the reading, its status
 * and any resulting alert are saved for real.
 */
export const syncBandage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(syncSchema)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: latest, error: latestError } = await supabase
      .from("readings")
      .select("temp_c, ph, moisture, healing_score, status")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw new Error(latestError.message);

    const previous: Reading | null = latest
      ? {
          temp: Number(latest.temp_c),
          ph: Number(latest.ph),
          moisture: Number(latest.moisture),
          score: Number(latest.healing_score),
        }
      : null;
    const previousStatus = latest ? asStatus(latest.status) : "healthy";

    const reading = nextSimulatedReading(previous, data.scenario);
    const status = statusFor(reading);

    const { error: insertError } = await supabase.from("readings").insert({
      user_id: userId,
      temp_c: reading.temp,
      ph: reading.ph,
      moisture: reading.moisture,
      healing_score: reading.score,
      status,
    });
    if (insertError) throw new Error(insertError.message);

    const copy = alertForTransition(previousStatus, status);
    if (copy) {
      const { error: alertError } = await supabase.from("alerts").insert({
        user_id: userId,
        level: copy.level,
        title: copy.title,
        action: copy.action,
        contact_doctor: copy.contact,
      });
      if (alertError) throw new Error(alertError.message);
    }

    return { reading, status, alert: copy };
  });

const manualSchema = z.object({
  tempC: z.number().min(20, "Temperature looks too low").max(45, "Temperature looks too high"),
  ph: z.number().min(0, "pH must be between 0 and 14").max(14, "pH must be between 0 and 14"),
  moisture: z
    .number()
    .min(0, "Moisture must be between 0 and 100")
    .max(100, "Moisture must be between 0 and 100"),
  healingScore: z
    .number()
    .int("Healing score must be a whole number")
    .min(0, "Healing score must be between 0 and 100")
    .max(100, "Healing score must be between 0 and 100"),
});

/** Store a reading typed in by hand, e.g. from a clinic measurement. */
export const addReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(manualSchema)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const reading: Reading = {
      temp: data.tempC,
      ph: data.ph,
      moisture: data.moisture,
      score: data.healingScore,
    };
    const status = statusFor(reading);

    const { data: latest, error: latestError } = await supabase
      .from("readings")
      .select("status")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw new Error(latestError.message);
    const previousStatus = latest ? asStatus(latest.status) : "healthy";

    const { error: insertError } = await supabase.from("readings").insert({
      user_id: userId,
      temp_c: reading.temp,
      ph: reading.ph,
      moisture: reading.moisture,
      healing_score: reading.score,
      status,
    });
    if (insertError) throw new Error(insertError.message);

    // Typed-in readings follow the same rule as synced ones: a status change raises an alert.
    const copy = alertForTransition(previousStatus, status);
    if (copy) {
      const { error: alertError } = await supabase.from("alerts").insert({
        user_id: userId,
        level: copy.level,
        title: copy.title,
        action: copy.action,
        contact_doctor: copy.contact,
      });
      if (alertError) throw new Error(alertError.message);
    }

    return { reading, status, alert: copy };
  });

const profileSchema = z.object({
  displayName: z.string().trim().max(60, "Name is too long"),
  woundLocation: z.string().trim().max(60, "Location is too long"),
  careTeam: z.string().trim().max(60, "Name is too long"),
  clinic: z.string().trim().max(60, "Name is too long"),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(profileSchema)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          display_name: data.displayName,
          wound_location: data.woundLocation,
          care_team: data.careTeam,
          clinic: data.clinic,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deviceSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  source: z.enum(["bluetooth", "file"]),
  receivedAt: z.string().datetime().optional(),
});

/**
 * Saves every bandage message verbatim (all fields, nothing dropped). When it
 * also carries the four core values, it becomes a reading and may raise an alert.
 */
export const saveDeviceMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(deviceSchema)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const receivedAt = data.receivedAt ?? new Date().toISOString();
    const { error: msgError } = await supabase.from("device_messages").insert({
      user_id: userId,
      payload: data.payload as never,
      source: data.source,
      received_at: receivedAt,
    });
    if (msgError) throw new Error(msgError.message);

    const core = tryCoreReading(data.payload);
    if (!core) return { status: null, alert: null };
    const reading: Reading = { temp: core.tempC, ph: core.ph, moisture: core.moisture, score: core.healingScore };
    const status = statusFor(reading);

    const { data: latest, error: latestError } = await supabase
      .from("readings")
      .select("status")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw new Error(latestError.message);
    const previousStatus = latest ? asStatus(latest.status) : "healthy";

    const { error: insertError } = await supabase.from("readings").insert({
      user_id: userId,
      temp_c: reading.temp,
      ph: reading.ph,
      moisture: reading.moisture,
      healing_score: reading.score,
      status,
      recorded_at: receivedAt,
    });
    if (insertError) throw new Error(insertError.message);

    const copy = alertForTransition(previousStatus, status);
    if (copy) {
      const { error: alertError } = await supabase.from("alerts").insert({
        user_id: userId,
        level: copy.level,
        title: copy.title,
        action: copy.action,
        contact_doctor: copy.contact,
      });
      if (alertError) throw new Error(alertError.message);
    }
    return { status, alert: copy };
  });
