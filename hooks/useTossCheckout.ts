export type StartTossPaymentResult = {
  success: boolean;
  payToken?: string | null;
  errorMessage?: string | null;
  raw?: any;
};

export async function startTossPayment(makeBody: any, userKey: string | null): Promise<StartTossPaymentResult> {
  console.debug("[useTossCheckout] startTossPayment", makeBody, userKey);

  return { success: false, errorMessage: "not_implemented" };
}