/**
 * paymentHelpers.ts
 * - unitForSkuOnDate(pkgDataLocal, sku, dateStr)
 * - lowestPriceFromEntry (re-export or local helper)
 *
 * Put this file under src/booking/ and import from ProductPay / ProductPeople as needed.
 */

import { lowestPriceFromEntry as _lowestPriceFromEntry } from "../reservation-function";

/**
 * Safe numeric parse helper
 */
function safeNumLocal(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * unitForSkuOnDate(pkgDataLocal, sku, dateStr)
 * - Prefer SKU calendar price for the given date (lowestPriceFromEntry)
 * - If not present, check time-keyed maps in calendar entry and pick lowest
 * - Fall back to sku fields (b2c_price / b2b_price / price / filled_price)
 * - Last fallback: item-level b2b_min_price / b2c_min_price
 */
export function unitForSkuOnDate(pkgDataLocal: any, sku: any, dateStr: string | null) {
  if (!sku) return undefined;

  const itemLocal = pkgDataLocal?.item?.[0] ?? null;
  const cal =
    sku?.calendar_detail ??
    sku?.calendar ??
    itemLocal?.calendar_detail ??
    pkgDataLocal?.calendar_detail_merged ??
    pkgDataLocal?.calendar_detail ??
    null;

  if (dateStr && cal && cal[dateStr]) {
    const entry = cal[dateStr];
    const low = _lowestPriceFromEntry ? _lowestPriceFromEntry(entry) : undefined;
    if (low !== undefined) return low;

    // If calendar entry contains time-keyed maps, pick lowest among them
    if (typeof entry === "object") {
      const cand = Object.values(entry)
        .flatMap((v: any) => (typeof v === "object" && !Array.isArray(v) ? Object.values(v) : [v]))
        .map((v: any) => safeNumLocal(v))
        .filter((n: any) => typeof n === "number") as number[];
      if (cand.length) return Math.min(...cand);
    }
  }

  // sku-level price fallbacks
  const skuNum = safeNumLocal(sku?.b2c_price ?? sku?.b2b_price ?? sku?.price ?? sku?.official_price ?? sku?.filled_price);
  if (skuNum !== undefined) return skuNum;

  // item-level fallback
  return safeNumLocal(itemLocal?.b2b_min_price ?? itemLocal?.b2c_min_price) ?? 0;
}

export { _lowestPriceFromEntry as lowestPriceFromEntry };