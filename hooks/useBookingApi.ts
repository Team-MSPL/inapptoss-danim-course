import { useCallback, useState } from "react";
import { AxiosResponse } from "axios";
import { useAppSelector } from "../src/store";
import axiosAuth from "../redux/api";

type AnyObject = Record<string, any>;

type SingleResult = {
  skuId?: string;
  bookingResponse?: AnyObject;
  saveResponse?: AnyObject;
  error?: any;
};

type RunResult = {
  bookingResponse?: AnyObject;
  saveResponse?: AnyObject;
  results?: SingleResult[];
};

export function useBookingApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // get userId from redux
  const { userId } = useAppSelector((state: any) => state.travelSlice || { userId: "unknown" });

  // helper: extract unique sku/spec tokens from payload
  function extractSkuIds(payload: AnyObject): string[] {
    const set = new Set<string>();
    if (Array.isArray(payload?.skus)) {
      payload.skus.forEach((s: any) => {
        const id = s?.sku_id ?? s?.spec_token ?? s?.id ?? "";
        if (id) set.add(String(id));
      });
    }
    if (Array.isArray(payload?.traffics)) {
      payload.traffics.forEach((t: any) => {
        const id = t?.spec_token ?? t?.sku_id ?? "";
        if (id) set.add(String(id));
      });
    }
    return Array.from(set);
  }

  // helper: compute total price from skus array
  function computeSkusTotal(skus: any[]): number {
    if (!Array.isArray(skus)) return 0;
    return skus.reduce((sum, s) => {
      const price = Number(s?.price ?? s?.amount ?? 0);
      const qty = Number(s?.qty ?? s?.quantity ?? s?.count ?? 1);
      return sum + price * qty;
    }, 0);
  }

  // helper: build a payload that contains only items for a given skuId
  function buildPayloadForSku(payload: AnyObject, skuId: string): AnyObject {
    const copy: AnyObject = { ...payload };

    if (Array.isArray(payload?.skus)) {
      copy.skus = payload.skus.filter((s: any) => String(s?.sku_id ?? s?.spec_token ?? s?.id ?? "") === String(skuId));
    }

    if (Array.isArray(payload?.traffics)) {
      copy.traffics = payload.traffics.filter((t: any) => String(t?.spec_token ?? t?.sku_id ?? "") === String(skuId));
    }

    // recompute totals for this sub-payload
    const subTotal = computeSkusTotal(copy.skus || []);
    copy.total = subTotal;
    copy.total_price = subTotal;

    // If payload had other aggregate fields (like productAmount) you may want to set them here too.

    return copy;
  }

  const run = useCallback(
    async (payload: AnyObject): Promise<RunResult> => {
      setLoading(true);
      setError(null);

      console.debug("[useBookingApi] Starting run()");
      console.debug("[useBookingApi] userId:", userId);
      console.debug("[useBookingApi] Raw payload:", payload);

      async function callSaveApi(saveDoc: AnyObject, isActiveFlag: boolean) {
        const saveUrl = `${(import.meta as any).env.API_ROUTE_RELEASE}/bookingProduct/save`;
        saveDoc.isActive = !!isActiveFlag;
        console.debug("[useBookingApi] Calling Save API:", saveUrl);
        console.debug("[useBookingApi] Save body (isActive=" + isActiveFlag + "):", saveDoc);

        try {
          const saveResp: AxiosResponse = await axiosAuth.post(saveUrl, saveDoc, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          });
          console.debug("[useBookingApi] Save API response status:", saveResp.status);
          console.debug("[useBookingApi] Save API response body:", saveResp.data);
          return { status: saveResp.status, data: saveResp.data };
        } catch (saveErr: any) {
          if (saveErr?.response) {
            console.error("[useBookingApi] Save API error response:", saveErr.response.status, saveErr.response.data);
            return { status: saveErr.response.status, data: saveErr.response.data };
          }
          console.error("[useBookingApi] Save API unexpected error:", saveErr);
          throw saveErr;
        }
      }

      // booking + save for a single sub-payload
      async function bookingAndSaveOnce(subPayload: AnyObject): Promise<SingleResult> {
        console.debug("[useBookingApi] bookingAndSaveOnce - subPayload:", subPayload);
        const bookingUrl = `${(import.meta as any).env.API_ROUTE_RELEASE}/kkday/Booking/`;
        console.debug("[useBookingApi] POST -> Booking API URL:", bookingUrl);
        console.debug("[useBookingApi] Booking payload (body):", subPayload);

        let bookingJson: AnyObject = {};
        let bookingStatus = 0;

        try {
          const bookingResp: AxiosResponse = await axiosAuth.post(bookingUrl, subPayload, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          });
          bookingStatus = bookingResp.status;
          bookingJson = bookingResp.data;
        } catch (axiosErr: any) {
          if (axiosErr?.response) {
            bookingStatus = axiosErr.response.status;
            bookingJson = axiosErr.response.data ?? {};
            console.debug("[useBookingApi] Booking API axios error response:", axiosErr.response);
          } else {
            console.error("[useBookingApi] Booking API axios error (no response):", axiosErr);
            const saveDocMinimal: AnyObject = {
              userId,
              booking_key: subPayload?.booking_key ?? "",
              guid: subPayload?.guid ?? "g_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9),
              partner_order_no: subPayload?.partner_order_no ?? "",
              order_no: "",
              prod_no: Number(subPayload?.prod_no ?? 0),
              locale: subPayload?.locale ?? "ko",
              state: "booking_error",
              buyer:
                subPayload?.buyer && typeof subPayload.buyer === "object"
                  ? {
                    first_name: subPayload.buyer.first_name ?? "",
                    last_name: subPayload.buyer.last_name ?? "",
                    email: subPayload.buyer.email ?? "",
                    tel_country_code: subPayload.buyer.tel_country_code ?? "",
                    tel_number: subPayload.buyer.tel_number ?? "",
                    country: subPayload.buyer.country ?? "",
                  }
                  : {
                    first_name: subPayload?.buyer_first_name ?? "",
                    last_name: subPayload?.buyer_last_name ?? "",
                    email: subPayload?.buyer_Email ?? "",
                    tel_country_code: subPayload?.buyer_tel_country_code ?? "",
                    tel_number: subPayload?.buyer_tel_country ?? "",
                    country: subPayload?.buyer_country ?? "",
                  },
              s_date: subPayload?.s_date ?? null,
              order_note: subPayload?.order_note ?? "",
              total_price: subPayload?.total ?? subPayload?.display_price ?? 0,
              pay_type: subPayload?.pay_type ?? subPayload?.payment_method ?? "",
              passportList: [],
              product: subPayload?.product ?? subPayload?.pdt ?? subPayload?.pkgData ?? null,
              isActive: false,
            };
            console.debug("[useBookingApi] Booking axios threw and no response - calling Save API with isActive=false. Minimal saveDoc:", saveDocMinimal);
            const saveRes = await callSaveApi(saveDocMinimal, false);
            return { bookingResponse: bookingJson, saveResponse: saveRes.data ?? saveRes, error: axiosErr };
          }
        }

        console.debug("[useBookingApi] Booking API response status:", bookingStatus);
        console.debug("[useBookingApi] Booking API raw response body:", bookingJson);

        // Normalize response: some endpoints wrap payload inside `data`
        const resp = bookingJson && typeof bookingJson === "object" && bookingJson.data ? bookingJson.data : bookingJson;
        console.debug("[useBookingApi] Booking API normalized response (resp):", resp);

        const guid =
          resp?.guid ||
          resp?.booking_key ||
          subPayload?.guid ||
          subPayload?.booking_key ||
          "g_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);

        const buyer =
          subPayload?.buyer && typeof subPayload.buyer === "object"
            ? {
              first_name: subPayload.buyer.first_name ?? subPayload.buyer.firstName ?? "",
              last_name: subPayload.buyer.last_name ?? subPayload.buyer.lastName ?? "",
              email: subPayload.buyer.email ?? subPayload.buyer.Email ?? "",
              tel_country_code: subPayload.buyer.tel_country_code ?? subPayload.buyer.telCountryCode ?? "",
              tel_number: subPayload.buyer.tel_number ?? subPayload.buyer.telNumber ?? "",
              country: subPayload.buyer.country ?? subPayload.buyer.country_code ?? "",
            }
            : {
              first_name: subPayload?.buyer_first_name ?? "",
              last_name: subPayload?.buyer_last_name ?? "",
              email: subPayload?.buyer_Email ?? "",
              tel_country_code: subPayload?.buyer_tel_country_code ?? "",
              tel_number: subPayload?.buyer_tel_number ?? "",
              country: subPayload?.buyer_country ?? "",
            };

        const skus =
          Array.isArray(subPayload?.skus) && subPayload.skus.length > 0
            ? subPayload.skus.map((s: any) => ({
              sku_id: s.sku_id ?? s.skuId ?? s.id ?? "",
              qty: Number(s.qty ?? s.quantity ?? s.count ?? 0),
              price: Number(s.price ?? s.amount ?? 0),
            }))
            : [
              {
                sku_id: subPayload?.item_no ? String(subPayload.item_no) : subPayload?.pkg_no ? String(subPayload.pkg_no) : "",
                qty: subPayload?.qty ? Number(subPayload.qty) : subPayload?.adult_qty ? Number(subPayload.adult_qty) : 1,
                price: subPayload?.total ? Number(subPayload.total) : subPayload?.display_price ? Number(subPayload.display_price) : 0,
              },
            ];

        // recompute total_price from skus to ensure split payloads carry correct totals
        const computedTotal = computeSkusTotal(skus);
        subPayload.total = computedTotal;
        subPayload.total_price = computedTotal;

        // Build passportList from subPayload/custom if present
        const passportList: any[] = [];
        const customArray = subPayload?.customArray ?? subPayload?.customs ?? subPayload?.custom ?? [];
        if (Array.isArray(subPayload?.passportList)) {
          for (const p of subPayload.passportList) {
            passportList.push({
              korName: p?.korName ?? "",
              engFirstName: p?.engFirstName ?? p?.first_name ?? "",
              engLastName: p?.engLastName ?? p?.last_name ?? "",
              country: p?.country ?? "",
              passportNum: p?.passportNum ?? p?.passportNumber ?? "",
              gender: p?.gender ?? "",
              birthday: p?.birthday ?? p?.birth ?? "",
              passportIssueDate: p?.passportIssueDate ?? "",
              passportExpirationDate: p?.passportExpirationDate ?? p?.passport_expiration_date ?? "",
              passportCountry: p?.passportCountry ?? "",
              passportImage: p?.passportImage ?? "",
            });
          }
        } else if (Array.isArray(customArray)) {
          for (const c of customArray) {
            if (c?.passport_no || c?.passport_num || c?.passportNumber) {
              passportList.push({
                korName: c?.korName ?? "",
                engFirstName: c?.eng_first_name ?? c?.engFirstName ?? "",
                engLastName: c?.eng_last_name ?? c?.engLastName ?? "",
                country: c?.nationality ?? c?.country ?? "",
                passportNum: c?.passport_no ?? c?.passport_num ?? c?.passportNumber ?? "",
                gender: c?.gender ?? "",
                birthday: c?.birth ?? "",
                passportIssueDate: c?.passport_issue_date ?? "",
                passportExpirationDate: c?.passport_expdate ?? c?.passportExpirationDate ?? "",
                passportCountry: c?.passport_country ?? "",
                passportImage: "",
              });
            }
          }
        }

        // Determine booking success using normalized resp
        const bookingSucceeded =
          bookingStatus >= 200 &&
          bookingStatus < 300 &&
          (Boolean(resp?.order_no) || resp?.result === "success" || String(resp?.result) === "00");

        const saveDoc: AnyObject = {
          userId: userId,
          booking_key: resp?.booking_key ?? resp?.order_no ?? "",
          guid,
          partner_order_no: subPayload?.partner_order_no ?? resp?.partner_order_no ?? "",
          order_no: resp?.order_no ?? subPayload?.order_no ?? "",
          prod_no: Number(subPayload?.prod_no ?? subPayload?.prod_no_local ?? subPayload?.product?.prod_no ?? subPayload?.pdt?.prod_no ?? 0),
          pkg_no: subPayload?.pkg_no ? Number(subPayload.pkg_no) : subPayload?.pkg_no_local ? Number(subPayload.pkg_no_local) : undefined,
          item_no: subPayload?.item_no ?? undefined,
          locale: subPayload?.locale ?? resp?.locale ?? subPayload?.lang ?? "en",
          state: resp?.result ?? resp?.state ?? subPayload?.state ?? "created",
          buyer,
          s_date: subPayload?.s_date ? new Date(subPayload.s_date) : subPayload?.start_date ? new Date(subPayload.start_date) : subPayload?.s_date_obj ? new Date(subPayload.s_date_obj) : undefined,
          e_date: subPayload?.e_date ? new Date(subPayload.e_date) : subPayload?.end_date ? new Date(subPayload.end_date) : undefined,
          event_time: subPayload?.event_time ?? subPayload?.time ?? "",
          guide_lang: subPayload?.guide_lang ?? resp?.guide_lang ?? subPayload?.guideLang ?? "",
          skus,
          order_note: subPayload?.order_note ?? subPayload?.orderNote ?? "",
          total_price: Number(subPayload?.total ?? computedTotal ?? 0),
          pay_type: subPayload?.pay_type ?? subPayload?.payment_method ?? "",
          passportList,
          product: subPayload?.product ?? subPayload?.pdt ?? subPayload?.pkgData ?? null,
        };

        console.debug("[useBookingApi] saveDoc prepared for Saving API:", saveDoc);
        console.debug("[useBookingApi] bookingSucceeded:", bookingSucceeded);

        let saveResult;
        try {
          saveResult = await callSaveApi(saveDoc, !!bookingSucceeded);
        } catch (saveCallErr) {
          console.error("[useBookingApi] Save API call failed:", saveCallErr);
          return { skuId: skus[0]?.sku_id, bookingResponse: resp, saveResponse: null, error: saveCallErr };
        }

        return { skuId: skus[0]?.sku_id, bookingResponse: resp, saveResponse: saveResult.data ?? saveResult };
      }

      try {
        const skuIds = extractSkuIds(payload);
        console.debug("[useBookingApi] detected skuIds:", skuIds);

        if (skuIds.length <= 1) {
          const singleRes = await bookingAndSaveOnce(payload);
          setLoading(false);
          return { bookingResponse: singleRes.bookingResponse, saveResponse: singleRes.saveResponse };
        }

        const results: SingleResult[] = [];
        for (const skuId of skuIds) {
          const subPayload = buildPayloadForSku(payload, skuId);
          try {
            const r = await bookingAndSaveOnce(subPayload);
            results.push(r);
          } catch (errAny) {
            console.error("[useBookingApi] bookingAndSaveOnce threw for skuId:", skuId, errAny);
            results.push({ skuId, error: errAny });
          }
        }

        setLoading(false);
        return { results };
      } catch (err: any) {
        setLoading(false);
        const msg = err?.message ?? String(err);
        setError(msg);
        console.error("[useBookingApi] run() failed:", msg);
        throw err;
      }
    },
    [userId]
  );

  return { loading, error, run };
}

export default useBookingApi;