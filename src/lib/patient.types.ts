import type { Reading, Status } from "@/lib/sim";

/**
 * Shapes shared by the browser and the server. Kept free of any server-only
 * imports so components can use them without pulling backend code in.
 */
export interface PatientProfile {
  displayName: string;
  woundLocation: string;
  careTeam: string;
  clinic: string;
}

export interface StoredReading extends Reading {
  at: string;
  status: Status;
}

export interface StoredAlert {
  id: string;
  at: string;
  level: Status;
  title: string;
  action: string;
  contact: boolean;
}

export interface DeviceMessage {
  id: string;
  at: string;
  source: string;
  payload: Record<string, unknown>;
}

export interface PatientHome {
  profile: PatientProfile;
  messages: DeviceMessage[];
  readings: StoredReading[];
  alerts: StoredAlert[];
}
