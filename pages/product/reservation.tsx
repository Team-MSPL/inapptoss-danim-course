import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Text as RNText } from 'react-native';
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
 *  time-keyed price objects (e.g. { "09:10": 100 }) or direct numeric fields
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

/** Merge SKU calendars into a date -> { price } map (take lowest across SKUs and times) */
function mergeSkuCalendars(pkgData: any) {
  if (!pkgData) return {};
  const merged: Record<string, { price: number } > = {};

  const items = Array.isArray(pkgData.item) ? pkgData.item : [];
  items.forEach((item: any) => {
    const skus = Array.isArray(item.skus) ? item.skus : [];
    skus.forEach((sku: any) => {
      const cal = sku?.calendar_detail ?? sku?.calendar ?? null;
      if (!cal || typeof cal !== 'object') return;
      Object.entries(cal).forEach(([dateStr, entry]: any) => {
        const price = lowestPriceFromEntry(entry);
        if (price === undefined) return;
        const existing = merged[dateStr]?.price;
        if (existing === undefined || price < existing) merged[dateStr] = { price };
      });
    });

    // item-level calendar fallback
    const itemCal = item?.calendar_detail ?? null;
    if (itemCal && typeof itemCal === 'object') {
      Object.entries(itemCal).forEach(([dateStr, entry]: any) => {
        const price = lowestPriceFromEntry(entry);
        if (price === undefined) return;
        const existing = merged[dateStr]?.price;
        if (existing === undefined || price < existing) merged[dateStr] = { price };
      });
    }
  });

  // top-level calendar_detail fallback
  const topCal = pkgData?.calendar_detail ?? null;
  if (topCal && typeof topCal === 'object') {
    Object.entries(topCal).forEach(([dateStr, entry]: any) => {
      const price = lowestPriceFromEntry(entry);
      if (price === undefined) return;
      const existing = merged[dateStr]?.price;
      if (existing === undefined || price < existing) merged[dateStr] = { price };
    });
  }

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
        const firstItem = data.item?.[0];
        const firstSku = firstItem?.skus?.[0];
        const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? data.calendar_detail ?? null;

        // create merged calendar map from all SKUs/items/top-level
        const mergedCalendar = mergeSkuCalendars(data);

        const pkgDataWithCalendar = {
          ...data,
          calendar_detail,
          calendar_detail_merged: mergedCalendar,
        };

        setPkgData(pkgDataWithCalendar);

        console.log('[ProductReservation] fetched pkgData (sample):', {
          prod_no: params.prod_no,
          pkg_no: params.pkg_no,
          hasCalendarDetail: !!calendar_detail,
          mergedDatesCount: Object.keys(mergedCalendar || {}).length,
        });
      } catch (e: any) {
        console.error('[ProductReservation] fetch error', e);
        setError("패키지 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchPkg();
    // only on param changes
  }, [params.prod_no, params.pkg_no]);

  // build calInfo - prefer merged calendar map if present
  const calInfo = useMemo(() => {
    if (!pkgData?.item) {
      return {};
    }
    const firstItem = pkgData.item[0];
    const firstSku = firstItem?.skus?.[0];

    const calendar_detail = pkgData?.calendar_detail_merged ?? firstSku?.calendar_detail ?? pkgData?.calendar_detail ?? {};

    const b2c_price = firstSku?.b2c_price ?? firstItem?.b2c_min_price;
    const sale_s_date = Array.isArray(firstItem?.sale_s_date) ? firstItem.sale_s_date[0] : firstItem.sale_s_date;
    const sale_e_date = Array.isArray(firstItem?.sale_e_date) ? firstItem.sale_e_date[0] : firstItem.sale_e_date;

    return {
      calendar_detail,
      b2c_price,
      sale_s_date,
      sale_e_date,
    };
  }, [pkgData]);

  // calendarData: if we have merged calendar map use it directly, otherwise fall back to makeCalendarData
  const calendarData = useMemo(() => {
    if (!calInfo) return {};
    if (calInfo.calendar_detail && Object.keys(calInfo.calendar_detail).length > 0) {
      return calInfo.calendar_detail;
    }
    // fallback: try use makeCalendarData (if calendar_detail is not usable)
    try {
      return makeCalendarData(calInfo);
    } catch (e) {
      // fallback to empty map
      console.warn('[ProductReservation] makeCalendarData failed, using empty calendar map', e);
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

  // get price info for a date (display/original/discount)
  function getPriceForDate(dateStr: string) {
    const cal = calendarData?.[dateStr] ?? null;

    // display: prefer merged map price or cal price / b2b/b2c
    const display = safeNum(cal?.price ?? cal?.b2b_price ?? cal?.b2c_price ?? cal) ??
      safeNum(calInfo?.b2c_price) ??
      safeNum(pkgData?.pkg?.[0]?.b2b_min_price) ??
      safeNum(pkgData?.pkg?.[0]?.b2c_min_price);

    const original = safeNum(cal?.original_price ?? cal?.b2c_price ?? pkgData?.pkg?.[0]?.b2c_min_price);
    const discountAmount = (original !== undefined && display !== undefined && original > display) ? Math.floor(original - display) : 0;
    return { display, original, discountAmount };
  }

  // selection
  const onDayPress = (cell: any) => {
    if (!cell || cell.soldOut) return;
    setSelected(cell.date);
    setSDate(cell.date);
    setEDate(cell.date);
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
    const priceInfo = getPriceForDate(selected);
    navigation.navigate('/product/people', {
      prod_no: params.prod_no,
      prod_name: pkgData?.prod_name ?? params.prod_name,
      pkg_no: params.pkg_no,
      selected_date: selected,
      display_price: priceInfo.display ?? null,
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
                      onPress={() => onDayPress(cell)}
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

export default ProductReservation;