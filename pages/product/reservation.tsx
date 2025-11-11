import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Text as RNText,
  Modal,
  Alert,
  Pressable
} from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import {FixedBottomCTAProvider, Button, colors, Text, Icon, FixedBottomCTA} from "@toss-design-system/react-native";
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

function clampNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function ProductReservation() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const { prod_no, pkg_no, setSDate, setEDate, s_date } = useReservationStore();

  const [loading, setLoading] = useState(true);
  const [pkgData, setPkgData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // single selected date (used for single-date mode)
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // For range mode ("02")
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

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

  // get price info from a raw calendar entry (display/original/discount)
  function getPriceFromEntry(entry: any, time?: string | null) {
    const cal = entry ?? null;

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

  // Helper: choose calendar entry for a date prioritizing:
  // 1) resolvedSelectedSku (if provided)
  // 2) first SKU in pkgData.item[0].skus (if exists) <- this implements the requested preference
  // 3) global calendarData (merged)
  function getCalendarEntryForDateBySkuPreference(dateStr: string) {
    if (!dateStr) return null;

    // 1) resolvedSelectedSku
    if (resolvedSelectedSku) {
      const cal = resolvedSelectedSku.calendar_detail ?? resolvedSelectedSku.calendar ?? null;
      return cal ? cal[dateStr] : null;
    }

    // 2) first SKU in pkgData.item[0].skus
    const firstSku = pkgData?.item?.[0]?.skus?.[0] ?? null;
    if (firstSku) {
      const cal = firstSku.calendar_detail ?? firstSku.calendar ?? null;
      if (cal && cal[dateStr] !== undefined) return cal[dateStr];
    }

    // 3) global merged calendarData
    return calendarData?.[dateStr] ?? null;
  }

  // get price info for a date using SKU-preferred calendar entry
  function getPriceForDatePreferredBySku(dateStr: string, time?: string | null) {
    const entry = getCalendarEntryForDateBySkuPreference(dateStr);
    return getPriceFromEntry(entry, time);
  }

  // get price info for a date (display/original/discount) - kept for compatibility but prefer getPriceForDatePreferredBySku
  function getPriceForDate(dateStr: string, time?: string | null) {
    return getPriceForDatePreferredBySku(dateStr, time);
  }

  // Helper: read date_setting and min/max constraints from params
  const dateSetting = String(params?.date_setting ?? '01'); // default to single-day
  const minDays = clampNumber(params?.min_date, 1); // minimum days for range selection (count of days)
  const maxDays = clampNumber(params?.max_date, Infinity); // maximum days allowed for range (count of days)

  // Helper: calculate inclusive day count between two YYYY-MM-DD strings
  const dayCountInclusive = (start: string, end: string) => {
    const s = dayjs(start);
    const e = dayjs(end);
    if (!s.isValid() || !e.isValid()) return 0;
    return Math.max(0, e.startOf('day').diff(s.startOf('day'), 'day') + 1);
  };

  // Helper: check if a date is within selected range
  const isDateInRange = (date: string | null, start: string | null, end: string | null) => {
    if (!date || !start || !end) return false;
    const d = dayjs(date);
    return !d.isBefore(dayjs(start), 'day') && !d.isAfter(dayjs(end), 'day');
  };

  // selection handler: supports single-day (default) and range ("02")
  const handleDayPress = (cell: any) => {
    if (!cell) return;

    // compute whether this cell is selectable (has price or time options and not sold out)
    const entry = getCalendarEntryForDateBySkuPreference(cell.date);
    const timeOpts = extractTimeOptionsFromEntry(entry);
    const priceInfo = getPriceFromEntry(entry);
    const hasPrice = (timeOpts && timeOpts.length > 0) || (priceInfo && priceInfo.display !== undefined && priceInfo.display !== null);

    // If no price and no time options, do nothing
    if (!hasPrice || cell.soldOut) return;

    const dateStr = cell.date;

    // If this date has time options, open modal for time selection like before
    const options = extractTimeOptionsFromEntry(entry);
    if (options && options.length > 0) {
      // For range mode we still allow time selection only when selecting a single date (treat as s_date==e_date)
      setTimeOptions(options);
      setPendingDate(dateStr);
      setModalSelectedTime(options[0]?.time ?? null);
      setTimeModalVisible(true);
      return;
    }

    if (dateSetting === '02') {
      // Range selection mode: user picks start then end (or toggles)
      // If no start selected yet -> set start
      if (!rangeStart) {
        setRangeStart(dateStr);
        setRangeEnd(null);
        // reflect temporarily in reservation store? do not set s_date/e_date until valid finalization (we'll set when user confirms via Next)
        return;
      }

      // If start exists but end not set -> try to set end
      if (rangeStart && !rangeEnd) {
        const tentativeStart = dayjs(rangeStart);
        const tentativeEnd = dayjs(dateStr);
        // if user tapped earlier date than start, swap (allow selecting earlier end)
        let startDate = tentativeStart;
        let endDate = tentativeEnd;
        if (tentativeEnd.isBefore(tentativeStart, 'day')) {
          startDate = tentativeEnd;
          endDate = tentativeStart;
        }
        const days = dayCountInclusive(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'));
        // enforce min/max constraints
        if (days < minDays) {
          // too short - set end but keep it invalid (user must pick a larger range) OR simply ignore?
          // We'll still set end so user sees selection but Next remains disabled until valid.
          setRangeStart(startDate.format('YYYY-MM-DD'));
          setRangeEnd(endDate.format('YYYY-MM-DD'));
          return;
        }
        if (Number.isFinite(maxDays) && days > maxDays) {
          // Clamp the end to start + maxDays - 1
          const clampedEnd = startDate.add(maxDays - 1, 'day');
          setRangeStart(startDate.format('YYYY-MM-DD'));
          setRangeEnd(clampedEnd.format('YYYY-MM-DD'));
          return;
        }
        // within bounds
        setRangeStart(startDate.format('YYYY-MM-DD'));
        setRangeEnd(endDate.format('YYYY-MM-DD'));
        return;
      }

      // If both start and end already set -> start a new selection using this date as start
      if (rangeStart && rangeEnd) {
        setRangeStart(dateStr);
        setRangeEnd(null);
        return;
      }
      return;
    }

    // Default: single date modes (01, 03, 04)
    setSelected(dateStr);
    setSelectedTime(null);
    setPendingDate(null);
    setSDate(dateStr);
    setEDate(dateStr);
  };

  // When user confirms a time from modal, treat similarly to previous behavior.
  const handleChooseTime = (time: string | null) => {
    if (!pendingDate || !time) return;

    if (dateSetting === '02') {
      // If in range mode and they selected a time on a specific date, we'll treat it as selecting a single-day reservation (start==end)
      setRangeStart(pendingDate);
      setRangeEnd(pendingDate);
      // we do not set store s/e here until Next pressed, but for parity we'll also set local selectedTime
      setSelectedTime(time);
      setSDate(pendingDate);
      setEDate(pendingDate);
    } else {
      setSelected(pendingDate);
      setSelectedTime(time);
      setSDate(pendingDate);
      setEDate(pendingDate);
    }

    setTimeModalVisible(false);
    setPendingDate(null);
    setModalSelectedTime(null);
  };

  // Helper: are current range selections valid w.r.t min/max (only matters for dateSetting === '02')
  const isRangeValid = () => {
    if (dateSetting !== '02') return true;
    if (!rangeStart || !rangeEnd) return false;
    const days = dayCountInclusive(rangeStart, rangeEnd);
    if (days < minDays) return false;
    if (Number.isFinite(maxDays) && days > maxDays) return false;
    return true;
  };

  // Helper: determine whether next button should be enabled
  const canProceed = () => {
    if (dateSetting === '02') {
      return isRangeValid();
    }
    // single day: must have selected (either selected or selectedTime via modal)
    return Boolean(selected || (pendingDate && modalSelectedTime));
  };

  // When user clicks Next
  const goNext = () => {
    if (dateSetting === '02') {
      if (!isRangeValid()) {
        Alert.alert('날짜 선택', `선택 범위가 유효하지 않습니다. 최소 ${minDays}일, 최대 ${isFinite(maxDays) ? maxDays : '제한 없음'}일 사이로 선택하세요.`);
        return;
      }
      // set s_date/e_date in reservation store and navigate
      const s = rangeStart!;
      const e = rangeEnd!;
      setSDate(s);
      setEDate(e);
      // compute priceInfo maybe based on start date (use s for single-day price) - reuse existing logic using selectedTime if any
      const priceInfo = getPriceForDatePreferredBySku(s, selectedTime ?? null);
      const calEntry = getCalendarEntryForDateBySkuPreference(s);
      const filledSource = calEntry?.filled_price_source;
      const fallbackDisplay = safeNum(params?.display_price);
      const outgoingDisplay = (filledSource === 'display_price' && fallbackDisplay !== undefined)
        ? fallbackDisplay
        : priceInfo.display ?? null;

      const baseSkus = resolvedSelectedSku
        ? [resolvedSelectedSku]
        : (pkgData?.item?.[0]?.skus ?? []);

      navigation.navigate('/product/people', {
        prod_no: params.prod_no ?? prod_no,
        prod_name: pkgData?.prod_name ?? params.prod_name,
        pkg_no: params.pkg_no ?? pkg_no,
        selected_date: s,
        selected_time: selectedTime ?? null,
        display_price: outgoingDisplay,
        original_price: priceInfo.original ?? null,
        discount_amount: priceInfo.discountAmount ?? 0,
        b2b_min_price: safeNum(calInfo?.b2b_min_price) ?? null,
        b2c_min_price: safeNum(calInfo?.b2c_price) ?? null,
        pkgData: pkgData ?? null,
        baseSkus,
        selectedSku: resolvedSelectedSku ?? null,
        s_date: s,
        e_date: e,
        item_unit: params?.item_unit ?? null,
        has_ticket_combinations: params?.has_ticket_combinations ?? false,
      });
      return;
    }

    // default single-day flow (unchanged but prefer first-sku pricing when multiple skus exist)
    if (!selected) return;

    const priceInfo = getPriceForDatePreferredBySku(selected, selectedTime ?? null);
    const calEntry = getCalendarEntryForDateBySkuPreference(selected);
    const filledSource = calEntry?.filled_price_source;
    const fallbackDisplay = safeNum(params?.display_price);

    const outgoingDisplay = (filledSource === 'display_price' && fallbackDisplay !== undefined)
      ? fallbackDisplay
      : priceInfo.display ?? null;

    const baseSkus = resolvedSelectedSku
      ? [resolvedSelectedSku]
      : (pkgData?.item?.[0]?.skus ?? []);

    setSDate(selected);
    setEDate(selected);

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
      pkgData: pkgData ?? null,
      baseSkus,
      selectedSku: resolvedSelectedSku ?? null,
      item_unit: params?.item_unit ?? null,
      has_ticket_combinations: params?.has_ticket_combinations ?? false,
    });
  };

  // helper to render day cell styles in range mode
  const renderDayCellStyle = (cellDate: string) => {
    if (dateSetting === '02' && rangeStart && rangeEnd) {
      if (isDateInRange(cellDate, rangeStart, rangeEnd)) {
        // if start or end, use selectedDay style, else use rangeDay
        if (cellDate === rangeStart || cellDate === rangeEnd) return styles.selectedDay;
        return styles.rangeDay;
      }
    }
    // single-day
    if (selected === cellDate) return styles.selectedDay;
    return {};
  };

  // helper to determine if a date has price or time options (selectable)
  const hasPriceOrTimeForDate = (dateStr: string) => {
    const entry = getCalendarEntryForDateBySkuPreference(dateStr);
    if (!entry) return false;
    // time options available?
    const timeOpts = extractTimeOptionsFromEntry(entry);
    if (timeOpts && timeOpts.length > 0) return true;
    const priceInfo = getPriceFromEntry(entry);
    return priceInfo && priceInfo.display !== undefined && priceInfo.display !== null;
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

  const nextButtonDisabled = !canProceed();

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

                  // Determine if this cell is selectable: not sold out AND has price or time options
                  const selectable = !cell.soldOut && hasPriceOrTimeForDate(cell.date);

                  if (cell.soldOut || !selectable) {
                    return (
                      <View key={j} style={{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.grey300, fontSize: 15 }}>{cell.day}</Text>
                        <Text style={{ color: colors.grey300, fontSize: 12 }}>{cell.soldOut ? '매진' : '-'}</Text>
                      </View>
                    );
                  }

                  const isSel = (dateSetting === '02')
                    ? Boolean(rangeStart && rangeEnd && isDateInRange(cell.date, rangeStart, rangeEnd))
                    : selected === cell.date;

                  const cellStyle = renderDayCellStyle(cell.date);

                  return (
                    <TouchableOpacity
                      key={j}
                      style={[{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, cellStyle]}
                      onPress={() => handleDayPress(cell)}
                      activeOpacity={0.8}
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

        <FixedBottomCTA onPress={goNext} disabled={nextButtonDisabled}>
          다음으로
        </FixedBottomCTA>

        {/* time selection modal — replace existing Modal block with this */}
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
            <View style={modalStyles.modalCard}>
              {/* Header */}
              <View style={modalStyles.headerRow}>
                <Text typography="t6" fontWeight="bold" color={colors.grey900}>시간 선택</Text>
                <Pressable
                  onPress={() => {
                    setTimeModalVisible(false);
                    setPendingDate(null);
                    setModalSelectedTime(null);
                  }}
                  hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
                >
                  <Icon name="icon-close" size={20} color={colors.grey700} />
                </Pressable>
              </View>

              {/* Selected date + price summary */}
              <View style={modalStyles.metaRow}>
                <Text typography="t7" color={colors.grey700}>
                  {pendingDate ? dayjs(pendingDate).format("M월 D일 (ddd)") : "날짜 선택"}
                </Text>
                <View style={modalStyles.priceBadge}>
                  <Text typography="t7" color={colors.white} fontWeight="semibold">
                    {modalSelectedTime
                      ? (() => {
                        const found = timeOptions.find((t) => t.time === modalSelectedTime);
                        return found && found.price ? formatCompactPrice(found.price) : "가격 없음";
                      })()
                      : "시간 선택 시 가격 표시"}
                  </Text>
                </View>
              </View>

              {/* Chip grid of times */}
              <ScrollView contentContainerStyle={{ paddingVertical: 6 }}>
                <View style={modalStyles.chipsWrap}>
                  {timeOptions.map((opt) => {
                    const active = modalSelectedTime === opt.time;
                    return (
                      <TouchableOpacity
                        key={opt.time}
                        activeOpacity={0.85}
                        onPress={() => setModalSelectedTime(opt.time)}
                        style={[
                          modalStyles.timeChip,
                          active ? modalStyles.timeChipActive : undefined
                        ]}
                      >
                        <Text
                          typography="t6"
                          style={active ? modalStyles.timeTextActive : modalStyles.timeText}
                        >
                          {opt.time}
                        </Text>
                        <Text
                          typography="t7"
                          style={active ? modalStyles.priceTextActive : modalStyles.priceText}
                        >
                          {opt.price ? formatCompactPrice(opt.price) : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={modalStyles.actionsRow}>
                <Button
                  type="dark"
                  size="medium"
                  style="outline"
                  onPress={() => {
                    setTimeModalVisible(false);
                    setPendingDate(null);
                    setModalSelectedTime(null);
                  }}
                >
                  취소
                </Button>

                <View style={{ width: 12 }} />

                <Button
                  type="primary"
                  size="medium"
                  style="fill"
                  disabled={!modalSelectedTime}
                  onPress={() => {
                    if (modalSelectedTime) handleChooseTime(modalSelectedTime);
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
    paddingHorizontal: 20,
  },
  modalCard: {
    width: Math.min(640, SCREEN_WIDTH - 48),
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceBadge: {
    backgroundColor: colors.blue500,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // RN does not support gap widely; main spacing handled by margin on chip
    paddingVertical: 4,
  },
  timeChip: {
    minWidth: 96,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.grey100,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  timeText: {
    color: colors.grey900,
    fontWeight: '600',
  },
  timeTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  priceText: {
    color: colors.grey600,
    marginTop: 4,
    fontSize: 12,
  },
  priceTextActive: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
});

export default ProductReservation;