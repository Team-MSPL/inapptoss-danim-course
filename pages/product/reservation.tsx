import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Text as RNText, Modal, Alert } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import { FixedBottomCTAProvider, Button, colors, Text } from "@toss-design-system/react-native";
import dayjs from 'dayjs';
import { formatPrice, makeCalendarData, WEEKDAYS } from "../../components/product/reservation-calander";
import { useReservationStore } from "../../zustand/useReservationStore";
import { safeNum, lowestPriceFromEntry, mergeSkuCalendars, formatCompactPrice, buildMonthMatrixLocal } from "../../components/product/reservation-function";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Route = createRoute('/product/reservation', {
  validateParams: (params) => params,
  component: ProductReservation,
});

function getDateBoundsFromCalendar(cal: Record<string, any> | null) {
  if (!cal || typeof cal !== 'object') return { min: null, max: null };
  const keys = Object.keys(cal).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  if (keys.length === 0) return { min: null, max: null };
  return { min: keys[0], max: keys[keys.length - 1] };
}

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
  const [modalSelectedTime, setModalSelectedTime] = useState<string | null>(null);

  // calendar month
  const [currentMonth, setCurrentMonth] = useState(() => {
    // prefer provided selected SKU's calendar start, then s_date, then params.online_s_date or today
    const selectedSkuFromParams = params?.selectedSku ?? null;
    if (selectedSkuFromParams && typeof selectedSkuFromParams === 'object') {
      const cal = selectedSkuFromParams.calendar_detail ?? selectedSkuFromParams.calendar ?? null;
      const bounds = getDateBoundsFromCalendar(cal);
      const start = bounds.min ?? (Array.isArray(params?.online_s_date) ? params.online_s_date[0] : params.online_s_date) ?? s_date;
      if (start && dayjs(start).isValid()) return dayjs(start).startOf('month');
    }

    let d = s_date || (Array.isArray(params?.online_s_date) ? params.online_s_date[0] : params.online_s_date);
    if (!d) d = dayjs().format("YYYY-MM-DD");
    return dayjs(d).isValid() ? dayjs(d).startOf('month') : dayjs().startOf('month');
  });

  // load pkgData: prefer params.pkgData, else fetch QueryPackage
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      if (params?.pkgData) {
        setPkgData(params.pkgData);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(`${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`, {
          prod_no: params.prod_no ?? prod_no,
          pkg_no: params.pkg_no ?? pkg_no,
          locale: "kr",
          state: "KR",
        }, { headers: { "Content-Type": "application/json" }});

        if (!mounted) return;

        const data = res.data ?? {};
        if (data?.result === '03' || data?.result_code === '03') {
          setError('해당 여행 상품은 현재 판매가 종료되었습니다.');
          setLoading(false);
          return;
        }
        // compute merged calendar as before if helper available
        const firstItem = data.item?.[0];
        const firstSku = firstItem?.skus?.[0];
        const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? data.calendar_detail ?? {};
        // build merged (reuse mergeSkuCalendars if available)
        let merged = {};
        try {
          merged = mergeSkuCalendars ? mergeSkuCalendars(data) : calendar_detail;
        } catch (e) {
          merged = calendar_detail;
        }

        setPkgData({ ...data, calendar_detail, calendar_detail_merged: merged });
      } catch (e: any) {
        console.error('[ProductReservation] QueryPackage fetch error', e);
        setError('패키지 정보를 불러오는 데 실패했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
    // only when prod/pkg params change
  }, [params.prod_no, params.pkg_no, params.pkgData]);

  // selectedSku handling: params.selectedSku object OR params.selectedSkuIndex + pkgData -> resolve to an object
  const resolvedSelectedSku = useMemo(() => {
    if (params?.selectedSku && typeof params.selectedSku === 'object') return params.selectedSku;
    if (typeof params?.selectedSkuIndex === 'number' && pkgData?.item?.[0]?.skus) {
      const idx = Number(params.selectedSkuIndex);
      return pkgData.item[0].skus[idx] ?? null;
    }
    // no explicit selected sku
    return null;
  }, [params.selectedSku, params.selectedSkuIndex, pkgData]);

  // build calInfo - prefer selectedSku calendar if provided, otherwise pkgData.item[0]
  const calInfo = useMemo(() => {
    // if selected SKU provided, use it as primary source
    const selSku = resolvedSelectedSku;
    if (selSku) {
      const calendar_detail = selSku.calendar_detail ?? selSku.calendar ?? null;
      // try deriving sale dates from calendar keys if present
      const bounds = getDateBoundsFromCalendar(calendar_detail);
      const sale_s_date = bounds.min ?? selSku.sale_s_date ?? null;
      const sale_e_date = bounds.max ?? selSku.sale_e_date ?? null;

      const b2c_price = safeNum(selSku?.b2c_price) ?? safeNum(selSku?.price) ?? undefined;
      const b2b_min_price = safeNum(selSku?.b2b_price) ?? undefined;

      return {
        calendar_detail,
        b2c_price,
        b2b_min_price,
        sale_s_date,
        sale_e_date,
        source: 'selectedSku',
      };
    }

    // fallback to pkgData.item[0] behavior
    const firstItem = pkgData?.item?.[0] ?? null;
    const firstSku = firstItem?.skus?.[0] ?? null;

    const calendar_detail_pkg = pkgData?.calendar_detail_merged && Object.keys(pkgData.calendar_detail_merged).length > 0
      ? pkgData.calendar_detail_merged
      : (firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? pkgData?.calendar_detail ?? null);

    const b2c_price_pkg = firstSku?.b2c_price ?? firstItem?.b2c_min_price;
    const b2b_min_price_pkg = pkgData?.pkg?.[0]?.b2b_min_price ?? firstItem?.b2b_min_price;
    const sale_s_date_pkg = Array.isArray(firstItem?.sale_s_date) ? firstItem.sale_s_date[0] : firstItem?.sale_s_date;
    const sale_e_date_pkg = Array.isArray(firstItem?.sale_e_date) ? firstItem.sale_e_date[0] : firstItem?.sale_e_date;

    return {
      calendar_detail: calendar_detail_pkg,
      b2c_price: b2c_price_pkg,
      b2b_min_price: b2b_min_price_pkg,
      sale_s_date: sale_s_date_pkg,
      sale_e_date: sale_e_date_pkg,
      source: 'pkgItem',
    };
  }, [resolvedSelectedSku, pkgData]);

  // calendarData: prefer calInfo.calendar_detail, else fill fallback range using calInfo.sale_s_date..sale_e_date and price
  const calendarData = useMemo(() => {
    if (!calInfo) return {};
    const { calendar_detail, sale_s_date, sale_e_date, b2b_min_price } = calInfo;

    if (calendar_detail && Object.keys(calendar_detail).length > 0) {
      // ensure entries are normalized objects (price/b2b_price fields)
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
          map[dateStr] = { b2b_price: basePrice, price: basePrice, filled_price_source: 'selectedSkuFallback' };
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

    const looksLikeTimeMap = (obj: any) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      const keys = Object.keys(obj);
      if (keys.length === 0) return false;
      const timeKeyRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
      return keys.some((k) => timeKeyRe.test(k));
    };

    const keysPrior = ['b2b_price', 'b2c_price', 'price'];

    for (const k of keysPrior) {
      const val = entry[k];
      if (looksLikeTimeMap(val)) {
        return Object.entries(val)
          .map(([time, p]) => ({ time, price: safeNum(p) }))
          .filter((it) => it.price !== undefined)
          .sort((a, b) => a.time.localeCompare(b.time));
      }
    }

    if (looksLikeTimeMap(entry)) {
      return Object.entries(entry)
        .map(([time, p]) => ({ time, price: safeNum(p) }))
        .filter((it) => it.price !== undefined)
        .sort((a, b) => a.time.localeCompare(b.time));
    }

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

    let display;
    if (time && cal) {
      const keysPrior = ['b2b_price', 'b2c_price', 'price'];
      for (const k of keysPrior) {
        const map = cal[k];
        if (map && typeof map === 'object' && map[time] !== undefined) {
          display = safeNum(map[time]);
          break;
        }
      }
      if (display === undefined && typeof cal === 'object' && cal[time] !== undefined) {
        display = safeNum(cal[time]);
      }
    }

    display = display ??
      safeNum(cal?.price ?? cal?.b2b_price ?? cal?.b2c_price ?? cal) ??
      safeNum(calInfo?.b2c_price) ??
      safeNum(calInfo?.b2b_min_price);

    const original = safeNum(cal?.original_price ?? cal?.b2c_price ?? calInfo?.b2c_price);
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

  // loading / error UI
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

  // Replace the goNext navigation payload with this block inside ProductReservation

  const goNext = () => {
    if (!selected) return;
    const priceInfo = getPriceForDate(selected, selectedTime ?? null);

    const calEntry = calendarData?.[selected];
    const filledSource = calEntry?.filled_price_source;
    const fallbackDisplay = safeNum(params?.display_price);

    const outgoingDisplay = (filledSource === 'display_price' && fallbackDisplay !== undefined)
      ? fallbackDisplay
      : priceInfo.display ?? null;

    // Build baseSkus: if we have a resolvedSelectedSku, use it as single-element array,
    // otherwise use the package's skus (item[0].skus) as the basis for subsequent screens.
    const baseSkus = resolvedSelectedSku
      ? [resolvedSelectedSku]
      : (pkgData?.item?.[0]?.skus ?? []);

    navigation.navigate('/product/people', {
      prod_no: params.prod_no ?? prod_no,
      prod_name: pkgData?.prod_name ?? params.prod_name,
      pkg_no: params.pkg_no ?? pkg_no,
      selected_date: selected,
      selected_time: selectedTime ?? null,
      display_price: outgoingDisplay,
      original_price: priceInfo.original ?? null,
      discount_amount: priceInfo.discountAmount ?? 0,
      b2b_min_price: safeNum(calInfo?.b2b_min_price) ?? null,
      b2c_min_price: safeNum(calInfo?.b2c_price) ?? null,
      // --- NEW: forward full pkgData and skus context ---
      pkgData: pkgData ?? null,
      baseSkus,                     // array of skus used as basis for calendar/price
      selectedSku: resolvedSelectedSku ?? null,
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