import { useCallback, useState } from "react";
import { Alert } from "react-native";
import axiosAuth from "../redux/api";
import useBookingStore from "../zustand/useBookingStore";

/**
 * useBookingSubmit
 * - getTrafficArray/getCustomArray 등 store에서 값을 가져와 API가 기대하는 payload로 변환
 * - 내부키(spec_index 등)는 전송 전에 제거
 * - 간단한 포맷 정규화(예: "7:0~10:0" -> "07:00~10:00", "7:0" -> "07:00") 수행
 */
export default function useBookingSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const getTrafficArray = useBookingStore((s) => s.getTrafficArray);
  const getCustomArray = useBookingStore((s) => s.getCustomArray);
  const guideLangCode = useBookingStore((s) => s.guideLangCode);

  // normalize "H:m" -> "HH:mm"
  const normalizeTime = (t?: string) => {
    if (!t && t !== "") return t;
    try {
      const trimmed = String(t).trim();
      if (trimmed === "") return "";
      // handle range "7:0~10:0" or "7:0~10:00"
      if (trimmed.includes("~")) {
        return trimmed
          .split("~")
          .map((part) => {
            const p = part.trim();
            const parts = p.split(":").map((x) => x.trim());
            const hh = parts[0].padStart(2, "0");
            const mm = (parts[1] ?? "00").padStart(2, "0");
            return `${hh}:${mm}`;
          })
          .join("~");
      }
      // single time "7:0" or "7"
      const parts = trimmed.split(":").map((x) => x.trim());
      const hh = parts[0].padStart(2, "0");
      const mm = (parts[1] ?? "00").padStart(2, "0");
      return `${hh}:${mm}`;
    } catch {
      return t;
    }
  };

  // remove internal keys and empty values; also normalize times
  const sanitizeTrafficEntry = (entry: Record<string, any>) => {
    const copy: Record<string, any> = { ...entry };

    // remove internal-only keys
    delete copy.spec_index;
    // delete other internal keys if any (e.g., debug flags)
    // delete copy._internalFlag;

    // normalize times if present
    if (typeof copy.s_time === "string") copy.s_time = normalizeTime(copy.s_time);
    if (typeof copy.e_time === "string") copy.e_time = normalizeTime(copy.e_time);
    if (typeof copy.arrival_time === "string") copy.arrival_time = normalizeTime(copy.arrival_time);
    if (typeof copy.departure_time === "string") copy.departure_time = normalizeTime(copy.departure_time);

    // optionally normalize time_range formats in case list_option returned "7:0~10:0"
    // (we already normalized s_time if it contains "~" via normalizeTime)

    // remove empty fields (keep numeric 0 and false)
    const cleaned: Record<string, any> = {};
    Object.entries(copy).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === "string" && v.trim() === "") return;
      cleaned[k] = v;
    });

    return cleaned;
  };

  // build payload from store + overrides
  const buildPayload = useCallback((overrides: Record<string, any> = {}) => {
    const storeTraffic = getTrafficArray() ?? [];
    const storeCustom = getCustomArray() ?? [];

    // sanitize traffic entries
    const trafficForApi = storeTraffic.map(sanitizeTrafficEntry).filter((t) => Object.keys(t).length > 0);

    // build base payload skeleton - caller should provide missing required fields via overrides
    const payload: Record<string, any> = {
      // some defaults can be injected here or via overrides
      guide_lang: guideLangCode ?? undefined,
      custom: storeCustom.length ? storeCustom : undefined,
      traffic: trafficForApi.length ? trafficForApi : undefined,
      ...overrides, // overrides override store values (prod_no, pkg_no, buyer info etc)
    };

    // remove undefined keys
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    return payload;
  }, [getTrafficArray, getCustomArray, guideLangCode]);

  // submitBooking: sends payload to booking API
  const submitBooking = useCallback(async (overrides: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const payload = buildPayload(overrides);

      // Basic payload validation: prod_no, pkg_no, guid, skus or such are commonly required
      if (!payload.prod_no) {
        throw new Error("prod_no is required in payload");
      }

      const url = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Booking/`;
      const resp = await axiosAuth.post(url, payload);
      setLoading(false);
      return resp.data;
    } catch (err: any) {
      setLoading(false);
      setError(err);
      // surface a friendly alert in UI contexts
      try {
        Alert.alert("예약 전송 실패", err?.message ?? "Unknown error");
      } catch {}
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload]);

  return {
    loading,
    error,
    buildPayload,
    submitBooking,
  };
}