import axiosAuth from "../redux/api";

export type StartTossPaymentResult = {
  success: boolean;
  payToken?: string | null;
  orderNo?: string | null;
  errorMessage?: string | null;
  raw?: any;
};

export type ExecuteTossPaymentResult = {
  success: boolean;
  data?: any;
  errorMessage?: string | null;
  raw?: any;
};

const MAKE_PATH = "/apps-in-toss/make-payment";
const EXECUTE_PATH = "/apps-in-toss/execute-payment";
const STATUS_PATH = "/apps-in-toss/get-payment-status";
const REFUND_PATH = "/apps-in-toss/refund-payment";

function maskKey(key: any): string | null {
  if (key === null || key === undefined) return null;
  if (typeof key !== "string") {
    try {
      key = String(key);
    } catch {
      return null;
    }
  }
  if (key.length <= 8) return `${key.slice(0, 2)}****${key.slice(-2)}`;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function startTossPayment(makeBody: any, tossUserKey: string | null): Promise<StartTossPaymentResult> {
  console.debug("[useTossCheckout] startTossPayment start", { path: MAKE_PATH, makeBody, tossUserKey: maskKey(tossUserKey) });
  if (!tossUserKey) {
    console.error("[useTossCheckout] startTossPayment missing tossUserKey");
    return { success: false, errorMessage: "missing_user_key" };
  }
  try {
    const body = { ...makeBody, tossUserKey };
    const resp = await axiosAuth.post(MAKE_PATH, body);
    const data = resp?.data ?? null;
    console.debug("[useTossCheckout] startTossPayment response", { status: resp.status, data });
    const payToken = data?.payToken ?? data?.success?.payToken ?? null;
    const orderNo = data?.orderNo ?? data?.order_no ?? null;
    if (payToken) {
      console.info("[useTossCheckout] startTossPayment success", { payToken: payToken ? `${payToken.slice(0,6)}...` : null, orderNo });
      return { success: true, payToken, orderNo, raw: data };
    }
    console.warn("[useTossCheckout] startTossPayment no payToken", { data });
    return { success: false, errorMessage: "no_paytoken", raw: data };
  } catch (err: any) {
    const respData = err?.response?.data;
    console.error("[useTossCheckout] startTossPayment error", {
      message: err?.message,
      status: err?.response?.status,
      data: respData,
    });
    if (respData) return { success: false, errorMessage: respData?.error ?? respData?.message ?? "server_error", raw: respData };
    return { success: false, errorMessage: err?.message ?? String(err), raw: err };
  }
}

export async function executeTossPayment(payToken: string, tossUserKey: string | null): Promise<ExecuteTossPaymentResult> {
  console.debug("[useTossCheckout] executeTossPayment start", { path: EXECUTE_PATH, payToken: payToken ? `${payToken.slice(0,6)}...` : null, tossUserKey: maskKey(tossUserKey) });
  if (!tossUserKey) {
    console.error("[useTossCheckout] executeTossPayment missing tossUserKey");
    return { success: false, errorMessage: "missing_user_key" };
  }
  if (!payToken) {
    console.error("[useTossCheckout] executeTossPayment missing payToken");
    return { success: false, errorMessage: "missing_payToken" };
  }
  try {
    const body = { payToken, tossUserKey };
    const resp = await axiosAuth.post(EXECUTE_PATH, body);
    const data = resp?.data ?? null;
    console.debug("[useTossCheckout] executeTossPayment response", { status: resp.status, data });
    return { success: true, data, raw: data };
  } catch (err: any) {
    const respData = err?.response?.data;
    console.error("[useTossCheckout] executeTossPayment error", {
      message: err?.message,
      status: err?.response?.status,
      data: respData,
    });
    if (respData) return { success: false, errorMessage: respData?.error ?? respData?.message ?? "server_error", raw: respData };
    return { success: false, errorMessage: err?.message ?? String(err), raw: err };
  }
}

export async function getTossPaymentStatus(orderNo: string, tossUserKey: string | null): Promise<ExecuteTossPaymentResult> {
  console.debug("[useTossCheckout] getTossPaymentStatus start", { path: STATUS_PATH, orderNo, tossUserKey: maskKey(tossUserKey) });
  if (!tossUserKey) {
    console.error("[useTossCheckout] getTossPaymentStatus missing tossUserKey");
    return { success: false, errorMessage: "missing_user_key" };
  }
  if (!orderNo) {
    console.error("[useTossCheckout] getTossPaymentStatus missing orderNo");
    return { success: false, errorMessage: "missing_orderNo" };
  }
  try {
    const resp = await axiosAuth.get(STATUS_PATH, { params: { orderNo, tossUserKey } });
    const data = resp?.data ?? null;
    console.debug("[useTossCheckout] getTossPaymentStatus response", { status: resp.status, data });
    return { success: true, data, raw: data };
  } catch (err: any) {
    const respData = err?.response?.data;
    console.error("[useTossCheckout] getTossPaymentStatus error", {
      message: err?.message,
      status: err?.response?.status,
      data: respData,
    });
    if (respData) return { success: false, errorMessage: respData?.error ?? respData?.message ?? "server_error", raw: respData };
    return { success: false, errorMessage: err?.message ?? String(err), raw: err };
  }
}

export async function refundTossPayment(payToken: string | null, amount: number, tossUserKey: string | null) {
  console.debug("[useTossCheckout] refundTossPayment start", { path: REFUND_PATH, payToken: payToken ? `${payToken.slice(0,6)}...` : null, amount, tossUserKey: maskKey(tossUserKey) });
  if (!tossUserKey) {
    console.error("[useTossCheckout] refundTossPayment missing tossUserKey");
    return { success: false, error: "missing_user_key" };
  }
  if (!payToken) {
    console.error("[useTossCheckout] refundTossPayment missing payToken");
    return { success: false, error: "missing_payToken" };
  }
  try {
    const body = { tossUserKey, payToken, amount };
    const resp = await axiosAuth.post(REFUND_PATH, body);
    const data = resp?.data ?? null;
    console.debug("[useTossCheckout] refundTossPayment response", { status: resp.status, data });
    return { success: true, data };
  } catch (err: any) {
    const respData = err?.response?.data;
    console.error("[useTossCheckout] refundTossPayment error", {
      message: err?.message,
      status: err?.response?.status,
      data: respData,
    });
    if (respData) return { success: false, error: respData?.error ?? respData?.message ?? "server_error", data: respData };
    return { success: false, error: err?.message ?? String(err), data: err };
  }
}