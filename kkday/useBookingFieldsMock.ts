import { useEffect, useState } from "react";
// mock JSON을 프로젝트에 넣으셨다면 아래처럼 import
// 경로는 실제 위치에 맞게 바꿔주세요.
import mock from "./mockBookingFields.json";

export function useBookingFieldsMock(opts?: { prod_no?: string | number; pkg_no?: string | number }) {
  const [fields, setFields] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // 시뮬레이션: 약간의 지연을 주려면 setTimeout 사용
    const t = setTimeout(() => {
      if (!cancelled) {
        setFields(mock); // mock은 전체 JSON (yourBookingFieldResponse)
        setLoading(false);
      }
    }, 200); // 0ms로 하면 즉시 반영

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [opts?.prod_no, opts?.pkg_no]);

  return { fields, loading, error };
}