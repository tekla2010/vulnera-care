import { queryOptions } from "@tanstack/react-query";
import { getPatientHome } from "./patient.functions";

export function patientHomeOptions() {
  return queryOptions({
    queryKey: ["patient-home"],
    queryFn: () => getPatientHome(),
  });
}
