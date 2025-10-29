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

/* ---- Helpers (SKU/calendar price extraction) ---- */

function safeNum(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function lowestPriceFromEntry(entry: any) {
  if (!entry) return undefined;
  const candidates: number[] = [];
  const keys = ['b2b_price', 'b2c_price', 'price', 'sale_price', 'original_price'];
  keys.forEach(k => {
    const val = entry?.[k];
    if (val == null) return;
    if (typeof val === 'number' || typeof val === 'string') {
      const n = safeNum(val);
      if (n !== undefined) candidates.push(n);
    } else if (typeof val === 'object') {
      Object.values(val).forEach((vv: any) => {
        const n = safeNum(vv);
        if (n !== undefined) candidates.push(n);
      });
    }
  });
  if (candidates.length === 0) return undefined;
  return Math.min(...candidates);
}

function buildSkuMap(item: any) {
  const map: Record<string, any[]> = {};
  if (!item || !Array.isArray(item.skus)) return map;
  item.skus.forEach((sku: any) => {
    const keys: string[] = [];
    if (sku?.ticket_rule_spec_item) keys.push(String(sku.ticket_rule_spec_item).toLowerCase());
    if (sku?.spec) {
      Object.values(sku.spec).forEach((v: any) => {
        if (typeof v === 'string') keys.push(String(v).toLowerCase());
      });
    }
    if (sku?.specs_ref && Array.isArray(sku.specs_ref)) {
      sku.specs_ref.forEach((r: any) => {
        if (r?.spec_value_id) keys.push(String(r.spec_value_id).toLowerCase());
        if (r?.spec_item_id) keys.push(String(r.spec_item_id).toLowerCase());
      });
    }
    let mapped = 'other';
    for (const c of keys) {
      if (!c) continue;
      if (c.includes('child') || c.includes('kid') || c.includes('6') || c.includes('11')) {
        mapped = 'child';
        break;
      }
      if (c.includes('adult') || c.includes('man') || c.includes('woman')) {
        mapped = 'adult';
        break;
      }
      if (c === 'child' || c === 'adult') {
        mapped = c;
        break;
      }
    }
    if (mapped === 'other' && item.skus.length === 1) {
      const v = Object.values(item.skus[0].spec ?? {})[0];
      if (typeof v === 'string' && String(v).toLowerCase().includes('child')) mapped = 'child';
      else mapped = 'adult';
    }
    if (!map[mapped]) map[mapped] = [];
    map[mapped].push(sku);
  });
  return map;
}

function getUnitPriceForDateByType(pkgData: any, selectedDate: string, ticketType: 'adult' | 'child') {
  if (!pkgData || !selectedDate) return undefined;
  const item = pkgData?.item?.[0];
  if (!item) {
    return toNumber(pkgData?.pkg?.[0]?.b2b_min_price ?? pkgData?.pkg?.[0]?.b2c_min_price);
  }
  const skuMap = buildSkuMap(item);
  const skus = skuMap[ticketType] ?? skuMap['child'] ?? skuMap['adult'] ?? item?.skus ?? [];
  const perSkuPrices: number[] = [];
  for (const sku of skus) {
    const cal = sku?.calendar_detail ?? sku?.calendar ?? item?.calendar_detail ?? pkgData?.calendar_detail ?? null;
    const entry = cal?.[selectedDate];
    const low = lowestPriceFromEntry(entry);
    if (low !== undefined) perSkuPrices.push(low);
    const skuNum = safeNum(sku?.b2b_price ?? sku?.b2c_price ?? sku?.b2b_price);
    if (skuNum !== undefined) perSkuPrices.push(skuNum);
  }
  if (perSkuPrices.length > 0) return Math.min(...perSkuPrices);
  const itemPrice = toNumber(item?.b2b_min_price ?? item?.b2c_min_price);
  if (itemPrice !== undefined) return itemPrice;
  const pkgLevel = toNumber(pkgData?.pkg?.[0]?.b2b_min_price ?? pkgData?.pkg?.[0]?.b2c_min_price ?? pkgData?.b2b_min_price ?? pkgData?.b2c_min_price);
  if (pkgLevel !== undefined) return pkgLevel;
  return undefined;
}

/* Counter UI */
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

/* Component */
function ProductPeople() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const { prod_no, pkg_no, s_date, setSDate, setEDate } = useReservationStore();

  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);

  const [pkgData, setPkgData] = useState<any | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.selected_date && !s_date) {
      setSDate(params.selected_date);
      setEDate(params.selected_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.selected_date]);

  const prod = prod_no ?? params?.prod_no;
  const pkg = pkg_no ?? params?.pkg_no;

  useEffect(() => {
    if (!prod || !pkg) return;
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
      const firstItem = data.item?.[0];
      const firstSku = firstItem?.skus?.[0];
      const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? data.calendar_detail ?? null;

      // create merged calendar map
      const merged: Record<string, any> = {};
      (data.item ?? []).forEach((it: any) => {
        (it.skus ?? []).forEach((sku: any) => {
          const cal = sku?.calendar_detail ?? sku?.calendar ?? {};
          Object.entries(cal ?? {}).forEach(([dateStr, entry]: any) => {
            const low = lowestPriceFromEntry(entry);
            if (low === undefined) return;
            const ex = merged[dateStr]?.price;
            if (ex === undefined || low < ex) merged[dateStr] = { price: low };
          });
        });
      });
      // top-level fallback
      Object.entries(calendar_detail ?? {}).forEach(([dateStr, entry]: any) => {
        const low = lowestPriceFromEntry(entry);
        if (low === undefined) return;
        const ex = merged[dateStr]?.price;
        if (ex === undefined || low < ex) merged[dateStr] = { price: low };
      });

      setPkgData({ ...data, calendar_detail, calendar_detail_merged: merged });
      console.log('[ProductPeople] fetched pkgData', { prod, pkg, mergedDatesCount: Object.keys(merged).length });
    }).catch(err => {
      if (!mounted) return;
      console.error('[ProductPeople] fetch err', err);
      setPkgError('패키지 가격 정보를 불러오지 못했습니다.');
    }).finally(() => {
      if (!mounted) return;
      setLoadingPkg(false);
    });

    return () => { mounted = false; };
  }, [prod, pkg]);

  // prefer params.selected_date first (navigation params are available immediately), then reservation store s_date
  const selectedDate = params?.selected_date ?? s_date ?? null;

  // PRIORITY: use params.display_price/adult_price first (if provided), then pkgData-derived price
  const adultUnit = useMemo(() => {
    if (!selectedDate) return undefined;
    const fromParams = toNumber(params?.display_price) ?? toNumber(params?.adult_price) ?? undefined;
    if (fromParams !== undefined) return fromParams;
    const fromPkg = pkgData ? getUnitPriceForDateByType(pkgData, selectedDate, 'adult') : undefined;
    return fromPkg;
  }, [pkgData, selectedDate, params?.display_price, params?.adult_price]);

  const childUnit = useMemo(() => {
    if (!selectedDate) return undefined;
    const fromParams = toNumber(params?.child_price) ?? undefined;
    if (fromParams !== undefined) return fromParams;
    const fromPkg = pkgData ? getUnitPriceForDateByType(pkgData, selectedDate, 'child') : undefined;
    return fromPkg ?? adultUnit;
  }, [pkgData, selectedDate, params?.child_price, adultUnit]);

  const fallbackUnit = useMemo(() => {
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
    navigation.navigate('/product/pay', {
      prod_no: prod,
      prod_name: pkgData?.prod_name ?? params?.prod_name,
      pkg_no: pkg,
      selected_date: selectedDate,
      adult, child,
      adult_price: adultPrice,
      child_price: childPrice,
      total,
      // pass the pkgData so ProductPay can render tour/pickup/description details
      pkgData,
    });
  };

  const countersDisabled = !selectedDate || loadingPkg || !!pkgError;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Text typography="t3" fontWeight="bold">여행 인원</Text>
            <Text style={{ marginLeft: 8, color: colors.red400, fontSize: 15 }}>(필수)</Text>
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