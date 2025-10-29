import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Text as RNText, Modal, Alert } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import { FixedBottomCTAProvider, Button, colors, Text } from "@toss-design-system/react-native";
import dayjs from 'dayjs';
import { formatPrice, makeCalendarData, WEEKDAYS } from "../../components/product/reservation-calander";
import { useReservationStore } from "../../zustand/useReservationStore";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

export const Route = createRoute('/product/reservation', {
  validateParams: (params) => params,
  component: ProductReservation,
});

/* ------------------------- Helpers ------------------------- */

/** safe number conversion (handles numbers and numeric strings) */
function safeNum(v: any): number | undefined {
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
function lowestPriceFromEntry(entry: any): number | undefined {
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
function mergeSkuCalendars(pkgData: any, fallbackDisplayPrice?: number) {
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

function formatCompactPrice(price?: number | null): string {
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
function buildMonthMatrixLocal(year: number, month: number, calendarData: any, sale_s_date?: string, sale_e_date?: string) {
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

function ProductReservation() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const { prod_no, pkg_no, setSDate, setEDate, s_date } = useReservationStore();

  const [loading, setLoading] = useState(true);
  const [pkgData, setPkgData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // single selected date
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // modal/time states
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeOptions, setTimeOptions] = useState<Array<{ time: string; price?: number }>>([]);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  // modal-local selected time (for dropdown/radio inside modal)
  const [modalSelectedTime, setModalSelectedTime] = useState<string | null>(null);

  // calendar month
  const [currentMonth, setCurrentMonth] = useState(() => {
    let d = s_date || (Array.isArray(params.online_s_date) ? params.online_s_date[0] : params.online_s_date);
    if (!d) d = dayjs().format("YYYY-MM-DD");
    return dayjs(d).isValid() ? dayjs(d).startOf('month') : dayjs().startOf('month');
  });

  useEffect(() => {
    async function fetchPkg() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(QUERY_PACKAGE_API, {
          prod_no: params.prod_no,
          locale: "kr",
          state: "KR",
          pkg_no: params.pkg_no,
        }, {
          headers: { "Content-Type": "application/json" }
        });

        const data = res.data ?? {};

        // If API returns result code "03" -> show message and go back
        if (data?.result === '03' || data?.result_code === '03') {
          setLoading(false);
          Alert.alert(
            '알림',
            '해당 여행 상품은 현재 판매가 종료되었습니다.',
            [
              {
                text: '확인',
                onPress: () => {
                  try {
                    navigation.goBack();
                  } catch (e) {
                    // fallback: navigate to root or close
                    console.warn('[ProductReservation] navigation.goBack failed', e);
                  }
                },
              },
            ],
            { cancelable: false }
          );
          return;
        }

        // build merged calendar map from SKUs/items/top-level
        // Pass params.display_price as fallbackDisplayPrice to fill ranges when calendar_detail is empty.
        const fallbackDisplay = safeNum(params?.display_price) ?? undefined;
        const mergedCalendar = mergeSkuCalendars(data, fallbackDisplay);

        const pkgDataWithCalendar = {
          ...data,
          calendar_detail_merged: mergedCalendar,
        };

        setPkgData(pkgDataWithCalendar);

        console.log('[ProductReservation] fetched pkgData (sample):', {
          prod_no: params.prod_no,
          pkg_no: params.pkg_no,
          mergedDatesCount: Object.keys(mergedCalendar || {}).length,
        });
      } catch (e: any) {
        console.error('[ProductReservation] fetch error', e);
        setError("패키지 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchPkg();
    // only on param changes
  }, [params.prod_no, params.pkg_no, navigation]);

  // build calInfo - prefer merged calendar map if present
  const calInfo = useMemo(() => {
    if (!pkgData?.item) {
      return {};
    }
    const firstItem = pkgData.item[0];
    const firstSku = firstItem?.skus?.[0];

    // prefer merged calendar map
    const calendar_detail = pkgData?.calendar_detail_merged && Object.keys(pkgData.calendar_detail_merged).length > 0
      ? pkgData.calendar_detail_merged
      : (firstSku?.calendar_detail ?? pkgData?.calendar_detail ?? {});

    const b2c_price = firstSku?.b2c_price ?? firstItem?.b2c_min_price;
    const b2b_min_price = pkgData?.pkg?.[0]?.b2b_min_price ?? firstItem?.b2b_min_price;
    const sale_s_date = Array.isArray(firstItem?.sale_s_date) ? firstItem.sale_s_date[0] : firstItem.sale_s_date;
    const sale_e_date = Array.isArray(firstItem?.sale_e_date) ? firstItem.sale_e_date[0] : firstItem.sale_e_date;

    return {
      calendar_detail,
      b2c_price,
      b2b_min_price,
      sale_s_date,
      sale_e_date,
    };
  }, [pkgData]);

  // calendarData: prefer merged calendar map, else build fallback map using sale_s_date..sale_e_date and b2b_min_price
  const calendarData = useMemo(() => {
    if (!calInfo) return {};
    const { calendar_detail, sale_s_date, sale_e_date, b2b_min_price } = calInfo;

    if (calendar_detail && Object.keys(calendar_detail).length > 0) {
      return calendar_detail;
    }

    // fallback: if sale date range exists, fill with b2b_min_price (or b2c_price as secondary)
    const basePrice = safeNum(b2b_min_price) ?? safeNum(calInfo?.b2c_price) ?? undefined;
    if (sale_s_date && sale_e_date && basePrice !== undefined) {
      const start = dayjs(sale_s_date);
      const end = dayjs(sale_e_date);
      if (start.isValid() && end.isValid() && !start.isAfter(end)) {
        const map: Record<string, any> = {};
        for (let d = start.clone(); !d.isAfter(end, 'day'); d = d.add(1, 'day')) {
          const dateStr = d.format('YYYY-MM-DD');
          map[dateStr] = { b2b_price: basePrice, price: basePrice }; // keep both for compat
        }
        return map;
      }
    }

    // last resort: try makeCalendarData (may throw)
    try {
      return makeCalendarData(calInfo);
    } catch (e) {
      console.warn('[ProductReservation] makeCalendarData fallback failed', e);
      return {};
    }
  }, [calInfo]);

  const sale_s_date = calInfo.sale_s_date;
  const sale_e_date = calInfo.sale_e_date;

  // month bounds
  const earliestMonth = sale_s_date ? dayjs(sale_s_date).startOf('month') : null;
  const latestMonth = sale_e_date ? dayjs(sale_e_date).startOf('month') : null;

  const prevDisabled = earliestMonth ? (currentMonth.year() === earliestMonth.year() && currentMonth.month() === earliestMonth.month()) : false;
  const nextDisabled = latestMonth ? (currentMonth.year() === latestMonth.year() && currentMonth.month() === latestMonth.month()) : false;

  // build matrix using calendarData (merged or derived)
  const monthMatrix = useMemo(() => {
    return buildMonthMatrixLocal(
      currentMonth.year(),
      currentMonth.month() + 1,
      calendarData,
      sale_s_date,
      sale_e_date
    );
  }, [currentMonth, calendarData, sale_s_date, sale_e_date]);

  // extract time options from a raw calendar entry (prefer b2b_price -> b2c_price -> price if they are time-keyed)
  function extractTimeOptionsFromEntry(entry: any) {
    if (!entry || typeof entry !== 'object') return [];

    // helper: check if an object looks like a time-keyed map (keys like "10:00", "10:30")
    const looksLikeTimeMap = (obj: any) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      const keys = Object.keys(obj);
      if (keys.length === 0) return false;
      // simple heuristic: keys should match HH:mm or H:mm
      const timeKeyRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
      return keys.some((k) => timeKeyRe.test(k));
    };

    // priority keys that may contain time-maps
    const keysPrior = ['b2b_price', 'b2c_price', 'price'];

    // 1) check prioritized maps (b2b_price, b2c_price, price) for time-keyed maps
    for (const k of keysPrior) {
      const val = entry[k];
      if (looksLikeTimeMap(val)) {
        return Object.entries(val)
          .map(([time, p]) => ({ time, price: safeNum(p) }))
          .filter((it) => it.price !== undefined)
          .sort((a, b) => a.time.localeCompare(b.time));
      }
    }

    // 2) maybe the entry itself is a time-keyed map (rare, but possible)
    if (looksLikeTimeMap(entry)) {
      return Object.entries(entry)
        .map(([time, p]) => ({ time, price: safeNum(p) }))
        .filter((it) => it.price !== undefined)
        .sort((a, b) => a.time.localeCompare(b.time));
    }

    // 3) as fallback, sometimes nested objects exist (like { b2b_price: { "10:00": {...} } } )
    // look for any nested time-map anywhere one level deep
    for (const v of Object.values(entry)) {
      if (looksLikeTimeMap(v)) {
        return Object.entries(v)
          .map(([time, p]) => ({ time, price: safeNum(p) }))
          .filter((it) => it.price !== undefined)
          .sort((a, b) => a.time.localeCompare(b.time));
      }
    }

    return [];
  }

  // get price info for a date (display/original/discount)
  function getPriceForDate(dateStr: string, time?: string | null) {
    const cal = calendarData?.[dateStr] ?? null;

    // if time provided and entry contains time-keyed map, prefer it
    let display;
    if (time && cal) {
      // check preferred maps
      const keysPrior = ['b2b_price', 'b2c_price', 'price'];
      for (const k of keysPrior) {
        const map = cal[k];
        if (map && typeof map === 'object' && map[time] !== undefined) {
          display = safeNum(map[time]);
          break;
        }
      }
      // fallback to entry.price/time-keyed fallback
      if (display === undefined && typeof cal === 'object' && cal[time] !== undefined) {
        display = safeNum(cal[time]);
      }
    }

    // display: prefer merged map price or cal price / b2b/b2c
    display = display ??
      safeNum(cal?.price ?? cal?.b2b_price ?? cal?.b2c_price ?? cal) ??
      safeNum(calInfo?.b2c_price) ??
      safeNum(pkgData?.pkg?.[0]?.b2b_min_price) ??
      safeNum(pkgData?.pkg?.[0]?.b2c_min_price);

    const original = safeNum(cal?.original_price ?? cal?.b2c_price ?? pkgData?.pkg?.[0]?.b2c_min_price);
    const discountAmount = (original !== undefined && display !== undefined && original > display) ? Math.floor(original - display) : 0;
    return { display, original, discountAmount };
  }

  // selection
  const handleDayPress = (cell: any) => {
    if (!cell || cell.soldOut) return;

    const entry = cell.rawCal;
    const options = extractTimeOptionsFromEntry(entry);
    if (options && options.length > 0) {
      setTimeOptions(options);
      setPendingDate(cell.date);
      // IMPORTANT: set only the time string (not the whole object)
      setModalSelectedTime(options[0]?.time ?? null);
      setTimeModalVisible(true);
      return;
    }

    setSelected(cell.date);
    setSelectedTime(null);
    setPendingDate(null);
    setSDate(cell.date);
    setEDate(cell.date);
  };

  const handleChooseTime = (time: string | null) => {
    if (!pendingDate || !time) return;
    setSelected(pendingDate);
    setSelectedTime(time);
    setSDate(pendingDate);
    setEDate(pendingDate);
    setTimeModalVisible(false);
    setPendingDate(null);
    setModalSelectedTime(null);
  };

  // loading / error
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>패키지 정보를 불러오는 중입니다...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  // month label
  const monthLabel = currentMonth.format("YYYY년 M월");

  const goNext = () => {
    if (!selected) return;
    const priceInfo = getPriceForDate(selected, selectedTime ?? null);

    // If the merged calendar for this date was filled using params.display_price fallback,
    // ensure we pass params.display_price as display_price to the next screen.
    const calEntry = pkgData?.calendar_detail_merged?.[selected];
    const filledSource = calEntry?.filled_price_source;
    const fallbackDisplay = safeNum(params?.display_price);

    const outgoingDisplay = (filledSource === 'display_price' && fallbackDisplay !== undefined)
      ? fallbackDisplay
      : priceInfo.display ?? null;

    navigation.navigate('/product/people', {
      prod_no: params.prod_no,
      prod_name: pkgData?.prod_name ?? params.prod_name,
      pkg_no: params.pkg_no,
      selected_date: selected,
      selected_time: selectedTime ?? null,
      display_price: outgoingDisplay,
      original_price: priceInfo.original ?? null,
      discount_amount: priceInfo.discountAmount ?? 0,
      b2b_min_price: safeNum(pkgData?.pkg?.[0]?.b2b_min_price) ?? null,
      b2c_min_price: safeNum(pkgData?.pkg?.[0]?.b2c_min_price) ?? null,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FixedBottomCTAProvider>
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => { if (!prevDisabled) setCurrentMonth(currentMonth.subtract(1, 'month')); }}
              disabled={prevDisabled}
              style={{ marginHorizontal: 16 }}
            >
              <RNText style={{ fontSize: 24, color: prevDisabled ? colors.grey200 : colors.grey800 }}>{'<'}</RNText>
            </TouchableOpacity>
            <Text style={{ fontSize: 19, fontWeight: 'bold', letterSpacing: -1 }}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => { if (!nextDisabled) setCurrentMonth(currentMonth.add(1, 'month')); }}
              disabled={nextDisabled}
              style={{ marginHorizontal: 16 }}
            >
              <RNText style={{ fontSize: 24, color: nextDisabled ? colors.grey200 : colors.grey800 }}>{'>'}</RNText>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.blue500, fontSize: 16, marginHorizontal: 8 }}>최저가/할인중</Text>
        </View>

        <View style={{ paddingHorizontal: 28 }}>
          <View style={{ flexDirection: 'row', width: SCREEN_WIDTH - 56, justifyContent: 'space-around', marginBottom: 8 }}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={{ width: 34, textAlign: 'center', color: colors.grey400, fontWeight: 'bold', fontSize: 15 }}>{w}</Text>
            ))}
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {monthMatrix.map((week, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 }}>
                {week.map((cell: any, j: number) => {
                  if (!cell) {
                    return <View key={j} style={{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center' }} />;
                  }

                  if (cell.soldOut) {
                    return (
                      <View key={j} style={{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.grey300, fontSize: 15 }}>{cell.day}</Text>
                        <Text style={{ color: colors.grey300, fontSize: 12 }}>매진</Text>
                      </View>
                    );
                  }

                  const isSel = selected === cell.date;
                  const selectedStyle = isSel ? styles.selectedDay : {};

                  return (
                    <TouchableOpacity
                      key={j}
                      style={[{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, selectedStyle]}
                      onPress={() => handleDayPress(cell)}
                    >
                      <Text style={{
                        fontWeight: isSel ? 'bold' : 'normal',
                        color: isSel ? '#fff' : colors.grey800,
                        fontSize: 15,
                      }}>{cell.day}</Text>
                      <Text style={{
                        color: isSel ? '#fff' : colors.blue500,
                        fontWeight: isSel ? 'bold' : 'normal',
                        fontSize: 11,
                        marginTop: 2
                      }}>{cell.price ? formatCompactPrice(cell.price) : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: 24, backgroundColor: '#fff' }}>
          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            disabled={!selected}
            onPress={goNext}
          >
            다음으로
          </Button>
        </View>

        {/* Time selection modal (dropdown-like but with selectable list + confirm/cancel) */}
        <Modal
          visible={timeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setTimeModalVisible(false);
            setPendingDate(null);
            setModalSelectedTime(null);
          }}
        >
          <View style={modalStyles.backdrop}>
            <View style={modalStyles.container}>
              <Text typography="t6" style={{ marginBottom: 12 }}>시간을 선택하세요</Text>

              {/* Selected preview */}
              <View style={{ marginBottom: 12, padding: 8, borderRadius: 8, backgroundColor: '#fafafa', borderWidth: 1, borderColor: colors.grey100 }}>
                <Text style={{ fontWeight: 'bold' }}>
                  선택된 시간: {modalSelectedTime ?? '선택 안됨'}
                </Text>
                <Text style={{ color: colors.grey600, marginTop: 6 }}>
                  {modalSelectedTime
                    ? (() => {
                      const found = timeOptions.find((t) => t.time === modalSelectedTime);
                      return found ? formatCompactPrice(found.price) : '';
                    })()
                    : '시간을 선택하면 가격이 표시됩니다.'}
                </Text>
              </View>

              {/* Time list */}
              <ScrollView style={{ maxHeight: 300, marginBottom: 12 }}>
                {timeOptions.map((opt) => {
                  const active = modalSelectedTime === opt.time;
                  return (
                    <TouchableOpacity
                      key={opt.time}
                      style={[modalStyles.timeRow, active ? modalStyles.timeRowActive : undefined]}
                      onPress={() => setModalSelectedTime(opt.time)}
                      activeOpacity={0.8}
                    >
                      <Text style={active ? { color: '#fff', fontWeight: 'bold' } : undefined}>{opt.time}</Text>
                      <Text style={active ? { color: '#fff' } : { color: colors.grey600 }}>{opt.price ? formatCompactPrice(opt.price) : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <View style={{ marginRight: 8 }}>
                  <Button
                    type="dark"
                    style="fill"
                    display="inline"
                    size="medium"
                    onPress={() => {
                      setTimeModalVisible(false);
                      setPendingDate(null);
                      setModalSelectedTime(null);
                    }}
                  >
                    취소
                  </Button>
                </View>
                <Button
                  type="primary"
                  style="fill"
                  display="inline"
                  size="medium"
                  disabled={!modalSelectedTime}
                  onPress={() => {
                    // confirm selected time from modalSelectedTime
                    if (modalSelectedTime) {
                      handleChooseTime(modalSelectedTime);
                    }
                  }}
                >
                  확인
                </Button>
              </View>
            </View>
          </View>
        </Modal>

      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedDay: {
    backgroundColor: colors.blue500,
  },
  rangeDay: {
    backgroundColor: colors.blue100,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: Math.min(560, SCREEN_WIDTH - 48),
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  timeRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeRowActive: {
    backgroundColor: colors.blue500,
  },
});

export default ProductReservation;