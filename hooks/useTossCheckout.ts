export type StartTossPaymentResult = {
  success: boolean;
  payToken?: string | null;
  errorMessage?: string | null;
  raw?: any;
};

const BASE_URL = "https://pay-apps-in-toss-api.toss.im";
const MAKE_PAYMENT_PATH = "/api-partner/v1/apps-in-toss/pay/make-payment";

export async function startTossPayment(makeBody: any, userKey: string | null): Promise<StartTossPaymentResult> {
  console.debug("[useTossCheckout] startTossPayment", makeBody, userKey);

  if (!userKey) {
    return { success: false, errorMessage: "missing_user_key" };
  }

  const url = `${BASE_URL}${MAKE_PAYMENT_PATH}`;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const TIMEOUT_MS = 15000;
  let timeoutId: any = null;
  if (controller) timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-toss-user-key": userKey,
      },
      body: JSON.stringify(makeBody),
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    let data: any = null;
    try {
      data = await res.json();
    } catch (e) {
      const text = await res.text().catch(() => "");
      console.error("[useTossCheckout] invalid_json_response", res.status, text);
      return { success: false, errorMessage: `invalid_json_response (${res.status})`, raw: text };
    }

    if (!res.ok) {
      const errMsg = data?.message ?? data?.errorMessage ?? `http_${res.status}`;
      console.error("[useTossCheckout] make-payment failed", errMsg, data);
      return { success: false, errorMessage: errMsg, raw: data };
    }

    if (data?.resultType === "SUCCESS" && data?.success?.payToken) {
      console.info("[useTossCheckout] payment created", { payToken: data.success.payToken });
      return { success: true, payToken: data.success.payToken, raw: data };
    }

    const msg = data?.resultType ?? data?.error ?? "unexpected_response";
    console.warn("[useTossCheckout] unexpected response", data);
    return { success: false, errorMessage: msg, raw: data };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      console.error("[useTossCheckout] request_timeout", e);
      return { success: false, errorMessage: "request_timeout", raw: e };
    }
    console.error("[useTossCheckout] exception", e);
    return { success: false, errorMessage: e?.message ?? String(e), raw: e };
  }
}