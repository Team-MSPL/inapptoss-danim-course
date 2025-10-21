import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import { FixedBottomCTAProvider, Button, Text, colors } from "@toss-design-system/react-native";
import { useReservationStore } from "../../zustand/useReservationStore";

const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

export const Route = createRoute('/product/people', {
  validateParams: (params) => params,
  component: ProductPeople,
});

function formatPrice(n?: number | null) {
  if (n === null || n === undefined) return '';
  return Math.floor(Number(n)).toLocaleString();
}

function toNumber(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function getUnitPriceForDate(pkgData: any, date: string) {
  if (!pkgData || !date) return undefined;

  // calendar detail may live in item[0].skus[0].calendar_detail or top-level calendar_detail
  const calendar =
    pkgData?.calendar_detail
    ?? pkgData?.item?.[0]?.skus?.[0]?.calendar_detail
    ?? pkgData?.item?.[0]?.calendar_detail
    ?? null;

  if (calendar && calendar[date]) {
    const cal = calendar[date];
    return toNumber(cal?.b2b_price ?? cal?.b2c_price ?? cal?.price ?? cal?.sale_price);
  }

  // sku/item level fallbacks
  const firstItem = pkgData?.item?.[0];
  const firstSku = firstItem?.skus?.[0];
  const skuPrice = toNumber(firstSku?.b2b_price ?? firstSku?.b2c_price ?? firstItem?.b2c_min_price ?? firstItem?.b2b_min_price);
  if (skuPrice !== undefined) return skuPrice;

  // package level fallback
  const pkgLevel = toNumber(pkgData?.pkg?.[0]?.b2b_min_price ?? pkgData?.pkg?.[0]?.b2c_min_price);
  if (pkgLevel !== undefined) return pkgLevel;

  return undefined;
}

function Counter({ label, subLabel, price, value, setValue, min = 0, max = 10, disabled = false }: any) {
  const onMinus = () => {
    if (disabled) return;
    setValue(Math.max(min, value - 1));
  };
  const onPlus = () => {
    if (disabled) return;
    setValue(Math.min(max, value + 1));
  };
  return (
    <View style={{
      backgroundColor: colors.grey50,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      opacity: disabled ? 0.6 : 1,
    }}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text typography="t4" fontWeight="bold">{label}</Text>
          <Text style={{ marginLeft: 8, color: colors.grey400, fontSize: 13 }}>{subLabel}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>{price ? `${formatPrice(price)}원` : '-'}</Text>
      </View>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.grey100,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 46,
      }}>
        <TouchableOpacity onPress={onMinus} disabled={value <= min || disabled}>
          <Text style={{
            fontSize: 28,
            color: value <= min || disabled ? colors.grey300 : colors.grey700,
            width: 32,
            textAlign: 'center',
            lineHeight: 36
          }}>-</Text>
        </TouchableOpacity>
        <View style={{
          minWidth: 36, marginHorizontal: 8, backgroundColor: "#fff",
          borderRadius: 8, alignItems: 'center', justifyContent: 'center'
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', lineHeight: 36 }}>{value}</Text>
        </View>
        <TouchableOpacity onPress={onPlus} disabled={value >= max || disabled}>
          <Text style={{
            fontSize: 28,
            color: value >= max || disabled ? colors.grey300 : colors.grey700,
            width: 32,
            textAlign: 'center',
            lineHeight: 36
          }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProductPeople() {
  const navigation = useNavigation();
  const params = Route.useParams(); // <-- use route params when available
  const { prod_no, pkg_no, s_date, setSDate, setEDate } = useReservationStore();

  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);

  const [pkgData, setPkgData] = useState<any | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);

  // If previous screen passed selected_date in params, ensure store has it (only set once)
  useEffect(() => {
    if (params?.selected_date && !s_date) {
      setSDate(params.selected_date);
      setEDate(params.selected_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.selected_date]);

  // derive prod/pkg to fetch from store first then params
  const prod = prod_no ?? params?.prod_no;
  const pkg = pkg_no ?? params?.pkg_no;

  // fetch package once for prod/pkg (use derived prod/pkg)
  useEffect(() => {
    if (!prod || !pkg) {
      // no product/package info yet; skip fetch
      return;
    }
    let mounted = true;
    setLoadingPkg(true);
    setPkgError(null);

    axios.post(QUERY_PACKAGE_API, {
      prod_no: prod,
      pkg_no: pkg,
      locale: "kr",
      state: "KR",
    }, {
      headers: { "Content-Type": "application/json" }
    }).then(res => {
      if (!mounted) return;
      const data = res.data ?? {};
      // normalize calendar_detail location
      const firstItem = data.item?.[0];
      const firstSku = firstItem?.skus?.[0];
      const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? data.calendar_detail ?? null;
      setPkgData({ ...data, calendar_detail });
      // dev log
      console.log('[ProductPeople] fetched pkgData', { prod, pkg, hasCalendar: !!calendar_detail });
    }).catch(err => {
      if (!mounted) return;
      console.error('[ProductPeople] fetch error', err);
      setPkgError('패키지 가격 정보를 불러오지 못했습니다.');
    }).finally(() => {
      if (!mounted) return;
      setLoadingPkg(false);
    });

    return () => { mounted = false; };
  }, [prod, pkg]);

  // selected date: prefer store, fallback to params.selected_date
  const selectedDate = s_date ?? params?.selected_date ?? null;

  // compute adult/child unit prices from pkgData + selectedDate
  const adultUnit = useMemo(() => {
    if (!selectedDate) return undefined;
    // if pkgData available, use calendar or sku fallback
    const fromPkg = pkgData ? getUnitPriceForDate(pkgData, selectedDate) : undefined;
    // if params included display_price, use it as fallback before other fallbacks
    const fromParams = toNumber(params?.display_price) ?? toNumber(params?.adult_price) ?? undefined;
    return fromPkg ?? fromParams;
  }, [pkgData, selectedDate, params?.display_price, params?.adult_price]);

  const childUnit = useMemo(() => {
    if (!selectedDate) return undefined;
    const cal = pkgData?.calendar_detail?.[selectedDate];
    const childPriceCandidate = toNumber(cal?.child_price ?? cal?.child_b2b_price ?? pkgData?.pkg?.[0]?.child_price ?? pkgData?.pkg?.[0]?.child_b2b_price);
    const fromParams = toNumber(params?.child_price) ?? undefined;
    return childPriceCandidate ?? fromParams ?? adultUnit;
  }, [pkgData, selectedDate, params?.child_price, adultUnit]);

  // fallback unit if specific per-date not available
  const fallbackUnit = useMemo(() => {
    // prefer explicit params b2b/b2c if provided
    const paramFallback = toNumber(params?.b2b_min_price) ?? toNumber(params?.b2c_min_price);
    if (paramFallback) return paramFallback;
    if (!pkgData) return undefined;
    const firstItem = pkgData?.item?.[0];
    const firstSku = firstItem?.skus?.[0];
    return toNumber(firstSku?.b2b_price ?? firstSku?.b2c_price ?? firstItem?.b2c_min_price ?? firstItem?.b2b_min_price ?? pkgData?.pkg?.[0]?.b2b_min_price ?? pkgData?.pkg?.[0]?.b2c_min_price);
  }, [pkgData, params?.b2b_min_price, params?.b2c_min_price]);

  const adultPrice = adultUnit ?? fallbackUnit ?? 0;
  const childPrice = childUnit ?? fallbackUnit ?? 0;

  const adultTotal = adultPrice * adult;
  const childTotal = childPrice * child;
  const total = adultTotal + childTotal;

  const format = (n: number) => formatPrice(n);

  const canProceed = adult > 0 && !!selectedDate && !loadingPkg && !pkgError;

  const goNext = () => {
    if (!canProceed) return;
    // include params and calculated prices when navigating
    navigation.navigate('/product/pay', {
      prod_no: prod,
      prod_name: pkgData?.prod_name ?? params?.prod_name,
      pkg_no: pkg,
      selected_date: selectedDate,
      adult, child,
      adult_price: adultPrice,
      child_price: childPrice,
      total,
    });
  };

  // if no selected date, show hint and disable counters
  const countersDisabled = !selectedDate || loadingPkg || !!pkgError;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <View>
              <Text typography="t3" fontWeight="bold">여행 인원</Text>
              <Text style={{ marginTop: 6, color: colors.grey500 }}>
                {selectedDate ? `선택일: ${selectedDate}` : '달력에서 출발일을 선택하세요.'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('/product/reservation')}>
              <Text style={{ color: colors.blue500 }}>날짜 변경</Text>
            </TouchableOpacity>
          </View>

          {loadingPkg ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>가격 정보를 불러오는 중입니다...</Text>
            </View>
          ) : pkgError ? (
            <View style={{ paddingVertical: 16 }}>
              <Text color={colors.red400}>{pkgError}</Text>
            </View>
          ) : (
            <>
              <Counter
                label="성인"
                subLabel="(만 12세 이상)"
                price={adultPrice}
                value={adult}
                setValue={setAdult}
                min={1}
                max={20}
                disabled={countersDisabled}
              />
              <Counter
                label="아동"
                subLabel="(만 12세 미만)"
                price={childPrice}
                value={child}
                setValue={setChild}
                min={0}
                max={20}
                disabled={countersDisabled}
              />

              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>요금 내역</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.grey400, fontSize: 15 }}>{format(adultPrice)}원 X {adult}명</Text>
                  <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 15 }}>{format(adultTotal)}원</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.grey400, fontSize: 15 }}>{format(childPrice)}원 X {child}명</Text>
                  <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 15 }}>{format(childTotal)}원</Text>
                </View>
              </View>

              <View style={{
                borderTopWidth: 1,
                borderColor: colors.grey100,
                marginTop: 12,
                marginBottom: 12,
                paddingTop: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ color: colors.grey300, fontSize: 17, fontWeight: 'bold' }}>총 금액</Text>
                <Text style={{ color: colors.grey400, fontSize: 22, fontWeight: 'bold' }}>{format(total)}원</Text>
              </View>
            </>
          )}
        </View>

        <View style={{ padding: 24 }}>
          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            disabled={!canProceed}
            onPress={goNext}
          >
            다음으로
          </Button>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

export default ProductPeople;