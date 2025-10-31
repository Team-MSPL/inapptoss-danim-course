import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import { FixedBottomCTAProvider, Button, Text, colors } from "@toss-design-system/react-native";
import { useReservationStore } from "../../zustand/useReservationStore";
import Counter, { safeNum, toNumber, formatPrice, lowestPriceFromEntry } from "../../components/product/PeopleCounter";

export const Route = createRoute('/product/people', {
  validateParams: (params) => params,
  component: ProductPeople,
});

const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

/**
 * ProductPeople (simplified)
 * - Uses incoming pkgData/baseSkus from params when available; avoids refetch if pkgData present.
 * - UI basis: strictly incomingBaseSkus if provided; otherwise pkgData.item[0].skus.
 * - Restores unit_quantity_rule (min/max/is_multiple_limit) from pkgData.item[0].unit_quantity_rule when present.
 * - If isMultipleLimit is true and totalCount % multiple !== 0, the "다음으로" button is disabled.
 */

function ProductPeople() {
  const navigation = useNavigation();
  const params = Route.useParams();

  const incomingPkgData = params?.pkgData ?? null;
  const incomingBaseSkus = Array.isArray(params?.baseSkus) ? params.baseSkus : (incomingPkgData?.item?.[0]?.skus ?? []);
  const incomingSelectedSku = params?.selectedSku ?? null;

  const { prod_no, pkg_no, s_date, setSDate, setEDate } = useReservationStore();

  const [pkgData, setPkgData] = useState<any | null>(incomingPkgData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantityRule, setQuantityRule] = useState<any | null>(null);

  useEffect(() => {
    if (params?.selected_date && !s_date) {
      setSDate(params.selected_date);
      setEDate(params.selected_date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.selected_date]);

  useEffect(() => {
    if (pkgData) {
      const firstItem = pkgData?.item?.[0] ?? null;
      setQuantityRule(firstItem?.unit_quantity_rule ?? pkgData?.unit_quantity_rule ?? null);
      return;
    }

    const prod = prod_no ?? params?.prod_no;
    const pkg = pkg_no ?? params?.pkg_no;
    if (!prod || !pkg) {
      setError('패키지 식별자가 누락되었습니다.');
      return;
    }

    let mounted = true;
    setLoading(true);
    axios.post(QUERY_PACKAGE_API, {
      prod_no: prod,
      pkg_no: pkg,
      locale: "kr",
      state: "KR",
    }).then(res => {
      if (!mounted) return;
      const data = res.data ?? {};
      setPkgData(data);
      const firstItem = data?.item?.[0] ?? null;
      setQuantityRule(firstItem?.unit_quantity_rule ?? data?.unit_quantity_rule ?? null);
    }).catch(e => {
      if (!mounted) return;
      console.error('[ProductPeople] fetch err', e);
      setError('패키지 정보를 불러오는 데 실패했습니다.');
    }).finally(() => {
      if (!mounted) return;
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [pkgData, prod_no, pkg_no, params?.prod_no, params?.pkg_no]);

  const selectedDate = params?.selected_date ?? s_date ?? null;

  const basisSkus = useMemo(() => {
    if (Array.isArray(incomingBaseSkus) && incomingBaseSkus.length > 0) return incomingBaseSkus;
    const itemSkus = pkgData?.item?.[0]?.skus;
    return Array.isArray(itemSkus) ? itemSkus : [];
  }, [incomingBaseSkus, pkgData]);

  const deriveTicketLabelFromSku = (sku: any) => {
    try {
      if (!sku?.spec || typeof sku.spec !== 'object') return '';
      if (Object.prototype.hasOwnProperty.call(sku.spec, '티켓 종류') && sku.spec['티켓 종류']) {
        return String(sku.spec['티켓 종류']).trim();
      }
      const maybeKey = Object.keys(sku.spec).find(k =>
        String(k).toLowerCase().includes('티켓') || String(k).toLowerCase().includes('ticket') || String(k).toLowerCase().includes('종류')
      );
      if (maybeKey && sku.spec[maybeKey]) return String(sku.spec[maybeKey]).trim();
      const first = Object.values(sku.spec)[0];
      return first ? String(first).trim() : '';
    } catch {
      return '';
    }
  };

  const unitForSku = (sku: any) => {
    const item = pkgData?.item?.[0] ?? null;
    const cal = sku?.calendar_detail ?? sku?.calendar ?? item?.calendar_detail ?? pkgData?.calendar_detail_merged ?? pkgData?.calendar_detail ?? null;
    const entry = cal?.[selectedDate];
    const low = lowestPriceFromEntry(entry);
    if (low !== undefined) return low;
    const skuNum = safeNum(sku?.b2b_price ?? sku?.b2c_price ?? sku?.official_price ?? sku?.filled_price);
    if (skuNum !== undefined) return skuNum;
    return safeNum(item?.b2b_min_price ?? item?.b2c_min_price) ?? 0;
  };

  const [categories, setCategories] = useState<any[]>([]);

  const getTotalRule = () => {
    const tr = quantityRule?.total_rule ?? {};
    let multipleFromRuleset: number | null = null;
    const rulesets = quantityRule?.ticket_rule?.rulesets ?? [];
    if (Array.isArray(rulesets)) {
      for (const r of rulesets) {
        const candidates = [r?.multiple, r?.multiple_of, r?.step, r?.quantity_multiple, r?.quantity_step, r?.value];
        for (const c of candidates) {
          const n = Number(c);
          if (Number.isFinite(n) && n > 0 && Math.floor(n) === n) {
            multipleFromRuleset = n;
            break;
          }
        }
        if (multipleFromRuleset) break;
      }
    }
    return {
      min: Number(tr?.min_quantity ?? tr?.min ?? 1),
      max: Number(tr?.max_quantity ?? tr?.max ?? Infinity),
      isMultipleLimit: Boolean(tr?.is_multiple_limit ?? false),
      multiple: multipleFromRuleset ?? 2,
      rulesets,
    };
  };

  useEffect(() => {
    const item = pkgData?.item?.[0] ?? null;
    const skus = basisSkus ?? [];
    const specs = Array.isArray(item?.specs) ? item.specs : [];

    if (!item || !Array.isArray(skus) || skus.length === 0) {
      setCategories([]);
      return;
    }

    const totalRule = getTotalRule();

    if (skus.length === 1) {
      const sku = skus[0];
      const label = deriveTicketLabelFromSku(sku) || sku.spec_desc || '티켓';
      const ageLabel = sku?.spec_desc ? sku.spec_desc : (sku?.spec_rule ? (() => {
        const min = sku.spec_rule?.min_age ?? sku.spec_rule?.min;
        const max = sku.spec_rule?.max_age ?? sku.spec_rule?.max;
        if (min != null && max != null) return `(만 ${min}세 이상 ~ ${max}세 미만)`;
        if (min != null) return `(만 ${min}세 이상)`;
        if (max != null) return `(만 ${max}세 미만)`;
        return '';
      })() : '');
      const subLabel: string[] = [];
      if (sku?.spec && typeof sku.spec === 'object') {
        for (const [k, v] of Object.entries(sku.spec)) {
          if (String(k) === '티켓 종류') continue;
          if (v) subLabel.push(String(v));
        }
      }
      const unit = unitForSku(sku) ?? 0;
      const qtyDefault = totalRule.isMultipleLimit
        ? Math.max(totalRule.multiple, Number(params?.adult ?? 1) || 1)
        : (Number(params?.adult ?? 1) || 1);
      setCategories([{
        id: sku.sku_id ?? sku.id ?? label,
        label,
        ageLabel,
        subLabel,
        skus: [sku],
        unit,
        qty: qtyDefault,
      }]);
      return;
    }

    const mapped: any[] = [];
    const ticketSpec = specs.find(s => (s?.spec_title ?? '').toString().toLowerCase().includes('티켓')) ?? specs[0];
    if (ticketSpec && Array.isArray(ticketSpec.spec_items)) {
      for (const si of ticketSpec.spec_items) {
        const oid = si?.spec_item_oid ?? si?.spec_item_id ?? String(si?.name ?? '');
        const label = si?.name ?? si?.spec_item_title ?? oid;
        const candidates = skus.filter((sku: any) => {
          if (!Array.isArray(sku?.specs_ref)) return false;
          return sku.specs_ref.some((r: any) =>
            String(r.spec_item_id) === String(oid) || String(r.spec_value_id) === String(oid)
          );
        });
        if (!candidates.length) continue;
        const unit = Math.min(...candidates.map(unitForSku));
        const ageLabel = si?.rule ? (() => {
          const ar = si.rule?.age_rule ?? si.rule;
          const min = ar?.min ?? ar?.min_age; const max = ar?.max ?? ar?.max_age;
          if (min != null && max != null) return `(만 ${min}세 이상 ~ ${max}세 미만)`;
          if (min != null) return `(만 ${min}세 이상)`;
          if (max != null) return `(만 ${max}세 미만)`;
          return '';
        })() : (candidates[0]?.spec_desc ?? '');
        const rawQty = label.toLowerCase().includes('성인') ? (Number(params?.adult ?? 1) || 1) : (Number(params?.child ?? 0) || 0);
        const qtyInit = totalRule.isMultipleLimit ? Math.max(totalRule.multiple, rawQty) : Math.max(0, Math.floor(rawQty));
        mapped.push({
          id: oid,
          label,
          ageLabel,
          subLabel: (candidates[0]?.spec && typeof candidates[0].spec === 'object') ? Object.entries(candidates[0].spec).filter(([k]) => k !== '티켓 종류').map(([_, v]) => String(v)) : [],
          skus: candidates,
          unit: unit ?? (toNumber(item?.b2b_min_price ?? item?.b2c_min_price) ?? 0),
          qty: qtyInit,
        });
      }
    }

    if (mapped.length === 0) {
      const groups = new Map<string, any[]>();
      for (const sku of skus) {
        const label = deriveTicketLabelFromSku(sku) || sku.spec_desc || sku.sku_id || '기타';
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(sku);
      }
      for (const [label, candidates] of groups.entries()) {
        const unit = Math.min(...candidates.map(unitForSku));
        const rawQty = label.toLowerCase().includes('성인') ? (Number(params?.adult ?? 1) || 1) : (Number(params?.child ?? 0) || 0);
        const qtyInit = totalRule.isMultipleLimit ? Math.max(totalRule.multiple, rawQty) : Math.max(0, Math.floor(rawQty));
        mapped.push({
          id: label,
          label,
          ageLabel: candidates[0]?.spec_desc ?? '',
          subLabel: (candidates[0]?.spec && typeof candidates[0].spec === 'object') ? Object.entries(candidates[0].spec).filter(([k]) => k !== '티켓 종류').map(([_, v]) => String(v)) : [],
          skus: candidates,
          unit: unit ?? (toNumber(item?.b2b_min_price ?? item?.b2c_min_price) ?? 0),
          qty: qtyInit,
        });
      }
    }

    setCategories(mapped);
  }, [pkgData, basisSkus, selectedDate, params?.adult, params?.child, quantityRule]);

  const total = useMemo(() => categories.reduce((acc, c) => acc + (Number(c.unit || 0) * Number(c.qty || 0)), 0), [categories]);
  const totalCount = useMemo(() => categories.reduce((acc, c) => acc + (Number(c.qty || 0)), 0), [categories]);

  const setCategoryQty = (id: string, qty: number) => {
    setCategories(prev => {
      const prevTotal = prev.reduce((s, p) => s + Number(p.qty || 0), 0);
      const found = prev.find(p => p.id === id);
      const old = found ? Number(found.qty || 0) : 0;
      let requestedQty = Math.max(0, Math.floor(Number(qty || 0)));

      const { max } = getTotalRule();

      const nextTotal = prevTotal - old + requestedQty;

      if (Number.isFinite(max) && nextTotal > max) {
        // keep previous and optionally show alert (user said no warning, so we skip alert)
        return prev;
      }

      return prev.map(c => c.id === id ? { ...c, qty: requestedQty } : c);
    });
  };

  const resolveSkusForNavigationFromCategories = () => {
    const result: Array<{ sku_id: any; qty: number; price: number; chosenSku?: any }> = [];
    for (const cat of categories) {
      const qty = Number(cat.qty || 0);
      if (qty <= 0) continue;
      const candidates: any[] = Array.isArray(cat.skus) ? cat.skus : [];
      let chosen = candidates[0] ?? null;
      if (candidates.length > 0) {
        chosen = candidates.map(s => ({ s, u: unitForSku(s) })).sort((a, b) => (Number(a.u || 0) - Number(b.u || 0)))[0].s;
      }
      const unit = unitForSku(chosen) ?? Number(cat.unit || 0);
      result.push({ sku_id: chosen?.sku_id ?? null, qty, price: Number(unit), chosenSku: chosen });
    }
    return result;
  };

  const onNext = () => {
    const { min, max, isMultipleLimit, multiple } = getTotalRule();
    if (totalCount < min) return;
    if (Number.isFinite(max) && totalCount > max) return;
    if (isMultipleLimit && (totalCount % multiple) !== 0) return;

    const skusForPayload = resolveSkusForNavigationFromCategories();
    navigation.navigate('/product/pay', {
      prod_no: params?.prod_no ?? prod_no,
      prod_name: pkgData?.prod_name ?? params?.prod_name,
      pkg_no: params.pkg_no ?? pkg_no,
      selected_date: selectedDate,
      categories: categories.map(c => ({ id: c.id, label: c.label, qty: c.qty, unit: c.unit, ageLabel: c.ageLabel, subLabel: c.subLabel })),
      skus: skusForPayload.map(s => ({ sku_id: s.sku_id, qty: s.qty, price: s.price })),
      total: Number(total),
      pkgData,
      baseSkus: basisSkus,
      selectedSku: incomingSelectedSku ?? null,
      selected_time: params?.selected_time ?? null,
    });
  };

  const { isMultipleLimit, multiple } = getTotalRule();
  const violatesMultiple = isMultipleLimit && ((totalCount % multiple) !== 0);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>패키지 정보를 불러오는 중입니다...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text color={colors.red400}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Text typography="t3" fontWeight="bold">여행 인원</Text>
            <Text style={{ marginLeft: 8, color: colors.red400, fontSize: 15 }}>(필수)</Text>
          </View>

          {categories.length === 0 ? (
            <Counter label="성인" ageLabel="(만 12세 이상)" subLabel={[]} price={0} value={1} setValue={() => {}} disabled />
          ) : (
            categories.map((c: any) => (
              <Counter
                key={String(c.id)}
                label={c.label ?? '티켓'}
                ageLabel={c.ageLabel ?? ''}
                subLabel={c.subLabel ?? []}
                price={c.unit}
                value={Number(c.qty ?? 0)}
                setValue={(v: number) => setCategoryQty(c.id, v)}
                min={0}
                max={99}
                disabled={!selectedDate}
              />
            ))
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>요금 내역</Text>
            {categories.map((c: any) => (
              <View key={String(c.id)} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: colors.grey400 }}>{formatPrice(Number(c.unit || 0))}원 X {c.qty || 0}명</Text>
                <Text style={{ color: colors.grey800, fontWeight: 'bold' }}>{formatPrice(Number((c.unit || 0) * (c.qty || 0)))}원</Text>
              </View>
            ))}

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
              <Text style={{ color: colors.grey400, fontSize: 22, fontWeight: 'bold' }}>{formatPrice(Number(total))}원</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 24 }}>
          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            disabled={violatesMultiple}
            onPress={onNext}
          >
            다음으로
          </Button>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

export default ProductPeople;