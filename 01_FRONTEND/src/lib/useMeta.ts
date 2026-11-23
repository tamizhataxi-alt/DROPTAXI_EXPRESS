import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { MetaResponse } from "@/lib/types";

// Service metadata (hotline, WhatsApp dispatcher number, and the canonical
// cities/vehicles/routes lists). Falls back to the static mirror in lib/data.ts
// when the backend is unreachable, so every page still renders fully.
export function useMeta() {
  const query = useQuery({
    queryKey: ["meta"],
    queryFn: () => apiGet<MetaResponse>("/meta"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return query;
}
