import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
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

/**
 * Compact price formatting rules:
 * - price <= 0 or missing: return empty string
 * - price >= 10,000:
 *   - man < 10: show one-decimal manwon truncated (floor to 0.1만) e.g. 32,000 -> 3.2만원
 *   - else show integer 만원 e.g. 423,000 -> 42만원
 * - 1,000 <= price < 10,000: "X천원"
 * - 100 <= price < 1,000: "X백원"
 * - <100: "N원"
 */
function formatCompactPrice(price?: number | null): string {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '';
  const p = Math.floor(Number(price)); // use floor as baseline for compact display
  if (p <= 0) return ''; // do not show "0원"

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

  if (p >= 1000) {
    return `${Math.floor(p / 1000)}천원`;
  }

  if (p >= 100) {
    return `${Math.floor(p / 100)}백원`;
  }

  return `${p}원`;
}

function toNumber(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

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
    // normalize candidate price fields
    const priceNum = toNumber(cal?.b2c_price ?? cal?.b2b_price ?? cal?.price ?? cal?.sale_price ?? null);

    const cell = {
      date: dateStr,
      day,
      price: priceNum,
      soldOut: !!(cal?.soldOut) || isBeforeMin || isAfterMax,
      inRange: !(isBeforeMin || isAfterMax), // available dates for selection
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

function ProductReservation() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const { prod_no, pkg_no, setSDate, setEDate, s_date, e_date } = useReservationStore();

  const [loading, setLoading] = useState(true);
  const [pkgData, setPkgData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // single selected date

  // 달력 월 이동
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
        // normalize calendar_detail into pkgData for easier lookup
        const data = res.data ?? {};
        const firstItem = data.item?.[0];
        const firstSku = firstItem?.skus?.[0];
        const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? data.calendar_detail ?? null;
        setPkgData({ ...data, calendar_detail });
        // Debug log (dev only)
        console.log('[ProductReservation] fetched pkgData:', res.data);
      } catch (e: any) {
        console.error('[ProductReservation] fetch error', e);
        setError("패키지 정보를 불러오는데 실패했습니다.");
      }
      setLoading(false);
    }
    // fetch on mount / when params change only (don't refetch on date select)
    fetchPkg();
  }, [params.prod_no, params.pkg_no]);

  // calendar data 추출 (가장 첫 번째 item/sku 기준)
  const calInfo = useMemo(() => {
    if (!pkgData?.item) return {};
    const firstItem = pkgData.item[0];
    const firstSku = firstItem?.skus?.[0];
    return {
      calendar_detail: firstSku?.calendar_detail ?? pkgData?.calendar_detail ?? {},
      b2c_price: firstSku?.b2c_price ?? firstItem?.b2c_min_price,
      sale_s_date: Array.isArray(firstItem?.sale_s_date) ? firstItem.sale_s_date[0] : firstItem.sale_s_date,
      sale_e_date: Array.isArray(firstItem?.sale_e_date) ? firstItem.sale_e_date[0] : firstItem.sale_e_date,
    };
  }, [pkgData]);

  const calendarData = useMemo(() => makeCalendarData(calInfo), [calInfo]);
  const sale_s_date = calInfo.sale_s_date;
  const sale_e_date = calInfo.sale_e_date;

  // month bounds for navigation
  const earliestMonth = sale_s_date ? dayjs(sale_s_date).startOf('month') : null;
  const latestMonth = sale_e_date ? dayjs(sale_e_date).startOf('month') : null;

  const prevDisabled = earliestMonth ? (currentMonth.year() === earliestMonth.year() && currentMonth.month() === earliestMonth.month()) : false;
  const nextDisabled = latestMonth ? (currentMonth.year() === latestMonth.year() && currentMonth.month() === latestMonth.month()) : false;

  // build matrix for rendering months but mark days outside sale range as soldOut (disabled)
  const monthMatrix = useMemo(() => {
    return buildMonthMatrixLocal(
      currentMonth.year(),
      currentMonth.month() + 1,
      calendarData,
      sale_s_date,
      sale_e_date
    );
  }, [currentMonth, calendarData, sale_s_date, sale_e_date]);

  // helper: get price info for any date string (YYYY-MM-DD)
  function getPriceForDate(dateStr: string) {
    const cal = calendarData?.[dateStr] ?? null;
    const display = toNumber(cal?.b2b_price ?? cal?.b2c_price ?? cal?.price ?? cal?.sale_price) ??
      toNumber(calInfo?.b2c_price) ??
      toNumber(pkgData?.pkg?.[0]?.b2b_min_price) ??
      toNumber(pkgData?.pkg?.[0]?.b2c_min_price);
    const original = toNumber(cal?.original_price ?? cal?.b2c_price ?? pkgData?.pkg?.[0]?.b2c_min_price);
    const discountAmount = (original !== undefined && display !== undefined && original > display) ? Math.floor(original - display) : 0;
    return { display, original, discountAmount };
  }

  // single-date selection behavior
  const onDayPress = (cell) => {
    if (!cell || cell.soldOut) return;
    // set single selected date
    setSelected(cell.date);
    // immediately persist to store
    setSDate(cell.date);
    setEDate(cell.date);
  };

  // 로딩/에러 처리
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

  // 달력 제목
  const monthLabel = currentMonth.format("YYYY년 M월");

  // 다음 페이지 이동
  const goNext = () => {
    // require a single selected date
    if (!selected) return;

    // compute price info for selected date and include in params
    const priceInfo = getPriceForDate(selected);
    navigation.navigate('/product/people', {
      prod_no: params.prod_no,
      prod_name: pkgData?.prod_name ?? params.prod_name,
      pkg_no: params.pkg_no,
      selected_date: selected,
      display_price: priceInfo.display ?? null,
      original_price: priceInfo.original ?? null,
      discount_amount: priceInfo.discountAmount ?? 0,
      // you can include other pkgData fields if needed:
      b2b_min_price: toNumber(pkgData?.pkg?.[0]?.b2b_min_price) ?? null,
      b2c_min_price: toNumber(pkgData?.pkg?.[0]?.b2c_min_price) ?? null,
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
              <Text style={{ fontSize: 24, color: prevDisabled ? colors.grey200 : colors.grey800 }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 19, fontWeight: 'bold', letterSpacing: -1 }}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => { if (!nextDisabled) setCurrentMonth(currentMonth.add(1, 'month')); }}
              disabled={nextDisabled}
              style={{ marginHorizontal: 16 }}
            >
              <Text style={{ fontSize: 24, color: nextDisabled ? colors.grey200 : colors.grey800 }}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.blue500, fontSize: 16, marginHorizontal: 8 }}>최저가/할인중</Text>
        </View>

        <View style={{ paddingHorizontal: 28 }}>
          {/* 요일 */}
          <View style={{ flexDirection: 'row', width: SCREEN_WIDTH - 56, justifyContent: 'space-around', marginBottom: 8 }}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={{ width: 34, textAlign: 'center', color: colors.grey400, fontWeight: 'bold', fontSize: 15 }}>{w}</Text>
            ))}
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {monthMatrix.map((week, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 }}>
                {week.map((cell, j) => {
                  if (!cell) {
                    // leading / trailing empty slot (not a date)
                    return <View key={j} style={{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center' }} />;
                  }

                  // show disabled style for soldOut or out-of-sale-range days (they appear faded with "매진")
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

        {/* 하단 CTA */}
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