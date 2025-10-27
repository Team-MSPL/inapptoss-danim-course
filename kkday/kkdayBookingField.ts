import { useEffect, useState } from "react";
import axiosAuth from "../redux/api";

export function useBookingFields({ prod_no, pkg_no }: { prod_no?: string | number; pkg_no?: string | number; }) {
  const [fields, setFields] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchFields() {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosAuth.post(`${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryBookingField`, {
          prod_no: prod_no,
          pkg_no: pkg_no,
        }, {
          headers: { "Content-Type": "application/json" }
        });
        if (!cancelled) {
          setFields(res.data ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFields();

    return () => {
      cancelled = true;
    };
  }, [prod_no, pkg_no]);

  return { fields, loading, error };
}