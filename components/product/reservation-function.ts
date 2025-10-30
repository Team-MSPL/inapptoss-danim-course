import dayjs from "dayjs";

/** safe number conversion (handles numbers and numeric strings) */
export function safeNum(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** extract the lowest numeric price from an entry that might contain
 *  time-keyed price objects (e.g. { "00:00": 100 }) or direct numeric fields
 */
export function lowestPriceFromEntry(entry: any): number | undefined {
  if (!entry) return undefined;
  const candidates: number[] = [];

  const keysToCheck = ['b2b_price', 'b2c_price', 'price', 'sale_price', 'original_price'];
  keysToCheck.forEach((k) => {
    const val = entry?.[k];
    if (val === undefined || val === null) return;
    if (typeof val === 'number' || typeof val === 'string') {
      const n = safeNum(val);
      if (n !== undefined) candidates.push(n);
    } else if (typeof val === 'object') {
      // time-keyed map or nested object
      Object.values(val).forEach((vv: any) => {
        const n = safeNum(vv);
        if (n !== undefined) candidates.push(n);
      });
    }
  });

  if (candidates.length === 0) return undefined;
  return Math.min(...candidates);
}

/** Merge SKU calendars into a date -> { price } map (take lowest across SKUs and times)
 *  Enhanced behavior:
 *  - preserve time-keyed maps when present and merge them by taking lowest per-time across SKUs
 *  - compute a date-level "price" (lowest numeric) for calendar cell summary
 *  - if a SKU has no calendar_detail but its parent item has sale_s_date/sale_e_date,
 *    fill that date range with the fallbackDisplayPrice (passed from params.display_price) so the calendar shows a price.
 *
 *  Note: fallbackDisplayPrice parameter is used when SKU/item has sale range but no explicit calendar detail.
 */
export function mergeSkuCalendars(pkgData: any, fallbackDisplayPrice?: number) {
  if (!pkgData) return {};
  const merged: Record<string, any> = {}; // keep full entry object per date

  const items = Array.isArray(pkgData.item) ? pkgData.item : [];

  // helper: merge two time-keyed maps by taking the lowest numeric value per time key
  const mergeTimeMaps = (mapA: Record<string, any> | undefined, mapB: Record<string, any> | undefined) => {
    if ((!mapA || Object.keys(mapA).length === 0) && (!mapB || Object.keys(mapB).length === 0)) return undefined;
    const out: Record<string, number> = {};
    const keys = new Set<string>([...(mapA ? Object.keys(mapA) : []), ...(mapB ? Object.keys(mapB) : [])]);
    keys.forEach((k) => {
      const a = safeNum(mapA?.[k]);
      const b = safeNum(mapB?.[k]);
      if (a === undefined && b === undefined) return;
      if (a === undefined) out[k] = b as number;
      else if (b === undefined) out[k] = a;
      else out[k] = Math.min(a, b);
    });
    return out;
  };

  // helper: ensure entry is normalized into an object with possible time maps preserved
  const normalizeEntry = (entry: any) => {
    if (!entry) return null;
    // If entry is primitive numeric-ish, convert to { price: n }
    if (typeof entry === 'number' || typeof entry === 'string') {
      const n = safeNum(entry);
      return n === undefined ? null : { price: n };
    }
    // otherwise assume object, keep as-is (we'll merge fields)
    return { ...(entry ?? {}) };
  };

  // First pass: merge explicit calendar_detail entries from SKUs/items/top-level
  items.forEach((item: any) => {
    const skus = Array.isArray(item.skus) ? item.skus : [];

    // SKU-level calendars
    skus.forEach((sku: any) => {
      const cal = sku?.calendar_detail ?? sku?.calendar ?? null;
      if (!cal || typeof cal !== 'object' || Object.keys(cal).length === 0) return;
      Object.entries(cal).forEach(([dateStr, entry]: any) => {
        const norm = normalizeEntry(entry);
        if (!norm) return;

        if (!merged[dateStr]) merged[dateStr] = {};

        // for known keys that might be time-maps (b2b_price, b2c_price, price)
        ['b2b_price', 'b2c_price', 'price', 'original_price', 'soldOut'].forEach((key) => {
          const eVal = norm[key];
          const existing = merged[dateStr][key];

          // merge time-maps specially
          if (eVal && typeof eVal === 'object' && !Array.isArray(eVal)) {
            const mergedMap = mergeTimeMaps(existing, eVal);
            if (mergedMap) merged[dateStr][key] = mergedMap;
          } else {
            // scalar values: if existing is undefined, set; else keep minimal numeric for prices
            if (key === 'b2b_price' || key === 'b2c_price' || key === 'price' || key === 'original_price') {
              const existingNum = safeNum(existing);
              const newNum = safeNum(eVal);
              if (existingNum === undefined && newNum !== undefined) merged[dateStr][key] = newNum;
              else if (existingNum !== undefined && newNum !== undefined) merged[dateStr][key] = Math.min(existingNum, newNum);
            } else {
              if (existing === undefined) merged[dateStr][key] = eVal;
            }
          }
        });

        // store SKU-level metadata optionally (e.g., SKU ids) — append to array
        merged[dateStr].skus = merged[dateStr].skus || [];
        merged[dateStr].skus.push({
          sku_id: sku?.sku_id,
          spec_token: sku?.spec_token,
          remain_qty: sku?.remain_qty,
        });

        // compute/refresh a date-level "lowest price" for summary display
        const candidate = lowestPriceFromEntry(norm);
        const prevMin = merged[dateStr].price;
        if (candidate !== undefined && (prevMin === undefined || candidate < prevMin)) {
          merged[dateStr].price = candidate;
        }
      });
    });

    // item-level calendar fallback (same merging logic)
    const itemCal = item?.calendar_detail ?? null;
    if (itemCal && typeof itemCal === 'object' && Object.keys(itemCal).length > 0) {
      Object.entries(itemCal).forEach(([dateStr, entry]: any) => {
        const norm = normalizeEntry(entry);
        if (!norm) return;
        if (!merged[dateStr]) merged[dateStr] = {};
        ['b2b_price', 'b2c_price', 'price', 'original_price', 'soldOut'].forEach((key) => {
          const eVal = norm[key];
          const existing = merged[dateStr][key];
          if (eVal && typeof eVal === 'object' && !Array.isArray(eVal)) {
            const mergedMap = mergeTimeMaps(existing, eVal);
            if (mergedMap) merged[dateStr][key] = mergedMap;
          } else {
            if (key === 'b2b_price' || key === 'b2c_price' || key === 'price' || key === 'original_price') {
              const existingNum = safeNum(existing);
              const newNum = safeNum(eVal);
              if (existingNum === undefined && newNum !== undefined) merged[dateStr][key] = newNum;
              else if (existingNum !== undefined && newNum !== undefined) merged[dateStr][key] = Math.min(existingNum, newNum);
            } else {
              if (existing === undefined) merged[dateStr][key] = eVal;
            }
          }
        });
        const candidate = lowestPriceFromEntry(norm);
        const prevMin = merged[dateStr].price;
        if (candidate !== undefined && (prevMin === undefined || candidate < prevMin)) {
          merged[dateStr].price = candidate;
        }
      });
    }
  });

  // top-level calendar_detail fallback
  const topCal = pkgData?.calendar_detail ?? null;
  if (topCal && typeof topCal === 'object' && Object.keys(topCal).length > 0) {
    Object.entries(topCal).forEach(([dateStr, entry]: any) => {
      const norm = normalizeEntry(entry);
      if (!norm) return;
      if (!merged[dateStr]) merged[dateStr] = {};
      ['b2b_price', 'b2c_price', 'price', 'original_price', 'soldOut'].forEach((key) => {
        const eVal = norm[key];
        const existing = merged[dateStr][key];
        if (eVal && typeof eVal === 'object' && !Array.isArray(eVal)) {
          const mergedMap = mergeTimeMaps(existing, eVal);
          if (mergedMap) merged[dateStr][key] = mergedMap;
        } else {
          if (key === 'b2b_price' || key === 'b2c_price' || key === 'price' || key === 'original_price') {
            const existingNum = safeNum(existing);
            const newNum = safeNum(eVal);
            if (existingNum === undefined && newNum !== undefined) merged[dateStr][key] = newNum;
            else if (existingNum !== undefined && newNum !== undefined) merged[dateStr][key] = Math.min(existingNum, newNum);
          } else {
            if (existing === undefined) merged[dateStr][key] = eVal;
          }
        }
      });
      const candidate = lowestPriceFromEntry(norm);
      const prevMin = merged[dateStr].price;
      if (candidate !== undefined && (prevMin === undefined || candidate < prevMin)) {
        merged[dateStr].price = candidate;
      }
    });
  }

  // SECOND PASS: fill missing date ranges using SKU/item sale_s_date/sale_e_date + fallbackDisplayPrice (params.display_price) preferred
  items.forEach((item: any) => {
    const skus = Array.isArray(item.skus) ? item.skus : [];
    const itemSaleStart = Array.isArray(item.sale_s_date) ? item.sale_s_date[0] : item.sale_s_date;
    const itemSaleEnd = Array.isArray(item.sale_e_date) ? item.sale_e_date[0] : item.sale_e_date;

    skus.forEach((sku: any) => {
      const skuCal = sku?.calendar_detail ?? sku?.calendar ?? null;
      if (skuCal && typeof skuCal === 'object' && Object.keys(skuCal).length > 0) return;

      const skuSaleStart = Array.isArray(sku?.sale_s_date) ? sku.sale_s_date[0] : sku?.sale_s_date;
      const skuSaleEnd = Array.isArray(sku?.sale_e_date) ? sku.sale_e_date[0] : sku?.sale_e_date;
      const start = skuSaleStart || itemSaleStart;
      const end = skuSaleEnd || itemSaleEnd;

      if (!start || !end) return;

      // Use fallbackDisplayPrice (params.display_price) first per user's request,
      // if fallback undefined, then use SKU official_price / b2b_price / b2c_price.
      const basePriceSource = safeNum(fallbackDisplayPrice) !== undefined ? 'display_price' : 'sku_price';
      const basePrice = (basePriceSource === 'display_price' ? safeNum(fallbackDisplayPrice) : undefined) ??
        safeNum(sku?.official_price) ?? safeNum(sku?.b2b_price) ?? safeNum(sku?.b2c_price) ?? undefined;
      if (basePrice === undefined) return;

      const s = dayjs(start);
      const e = dayjs(end);
      if (!s.isValid() || !e.isValid() || s.isAfter(e)) return;

      for (let d = s.clone(); !d.isAfter(e, 'day'); d = d.add(1, 'day')) {
        const dateStr = d.format('YYYY-MM-DD');
        if (!merged[dateStr]) merged[dateStr] = {};

        const existingPrice = safeNum(merged[dateStr].price);
        if (existingPrice === undefined || basePrice < existingPrice) {
          merged[dateStr].price = basePrice;
        }

        const existingB2B = merged[dateStr].b2b_price;
        if (!existingB2B || (typeof existingB2B !== 'object' && basePrice < safeNum(existingB2B))) {
          merged[dateStr].b2b_price = basePrice;
        }

        merged[dateStr].skus = merged[dateStr].skus || [];
        merged[dateStr].skus.push({
          sku_id: sku?.sku_id,
          spec_token: sku?.spec_token,
          remain_qty: sku?.remain_qty,
          filled_by_fallback_display: basePriceSource === 'display_price',
          filled_price: basePrice,
          filled_price_source: basePriceSource,
        });

        // also mark top-level metadata for the date to easily detect fallback use later
        merged[dateStr].filled_price = basePrice;
        merged[dateStr].filled_price_source = basePriceSource; // 'display_price' or 'sku_price'
      }
    });
  });

  return merged;
}

/* -------------------- compact price format -------------------- */

export function formatCompactPrice(price?: number | null): string {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '';
  const p = Math.floor(Number(price));
  if (p <= 0) return '';

  if (p >= 10000) {
    const man = p / 10000;
    if (man < 10) {
      const val = Math.floor(p / 1000) / 10;
      if (Math.abs(val - Math.floor(val)) < 1e-9) {
        return `${Math.floor(val)}만원`;
      }
      const s = val.toFixed(1).replace('.0', '');
      return `${s}만원`;
    } else {
      return `${Math.floor(man)}만원`;
    }
  }

  if (p >= 1000) return `${Math.floor(p / 1000)}천원`;
  if (p >= 100) return `${Math.floor(p / 100)}백원`;
  return `${p}원`;
}

/* -------------------- calendar builder -------------------- */

/**
 * Build month matrix reading prices from calendarData map.
 * calendarData expected to be a map keyed by 'YYYY-MM-DD' with either:
 *  - numeric-ish value (price)
 *  - object with .price numeric
 *  - other structures (we attempt safeNum)
 */
export function buildMonthMatrixLocal(year: number, month: number, calendarData: any, sale_s_date?: string, sale_e_date?: string) {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startWeekday = firstDay.day(); // 0..6
  const daysInMonth = firstDay.daysInMonth();

  const minDay = sale_s_date ? dayjs(sale_s_date) : null;
  const maxDay = sale_e_date ? dayjs(sale_e_date) : null;

  const matrix: Array<Array<any | null>> = [];
  let week: Array<any | null> = [];

  // leading blanks
  for (let i = 0; i < startWeekday; i++) week.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isBeforeMin = minDay ? dayjs(dateStr).isBefore(minDay, 'day') : false;
    const isAfterMax = maxDay ? dayjs(dateStr).isAfter(maxDay, 'day') : false;

    const cal = calendarData?.[dateStr] ?? null;

    // extract price robustly
    let priceNum = safeNum(cal?.price ?? cal ?? cal?.b2c_price ?? cal?.b2b_price ?? cal?.sale_price ?? null);
    // if cal is object with nested time-keyed price, check lowestPriceFromEntry
    if (priceNum === undefined && cal && typeof cal === 'object') {
      const maybe = lowestPriceFromEntry(cal);
      priceNum = safeNum(maybe);
    }

    const cell = {
      date: dateStr,
      day,
      price: priceNum,
      soldOut: !!(cal?.soldOut) || isBeforeMin || isAfterMax,
      inRange: !(isBeforeMin || isAfterMax),
      rawCal: cal ?? null,
    };
    week.push(cell);

    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }

  // trailing blanks
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }

  return matrix;
}

/* -------------------- Component -------------------- */