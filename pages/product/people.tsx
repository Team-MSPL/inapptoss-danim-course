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
  // prefer b2b prices when available
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

// Counter: label (left top), ageLabel (right top), subLabel lines (below), price, and fixed right controls
function Counter({ label, ageLabel, subLabel, price, value, setValue, min = 0, max = 10, disabled = false }: any) {
  const onMinus = () => {
    if (disabled) return;
    setValue(Math.max(min, value - 1));
  };
  const onPlus = () => {
    if (disabled) return;
    setValue(Math.min(max, value + 1));
  };

  // normalize subLabel to array of lines
  const subLines: string[] = Array.isArray(subLabel)
    ? (subLabel as string[]).filter(Boolean)
    : (subLabel ? String(subLabel).split('\n').map(s => s.trim()).filter(Boolean) : []);

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
      {/* Left: flexible content */}
      <View style={{ flex: 1, paddingRight: 12 }}>
        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text typography="t4" fontWeight="bold" numberOfLines={2} style={{ lineHeight: 24, flexShrink: 1 }}>
              {label}
            </Text>
            {ageLabel ? (
              <Text style={{ marginLeft: 8, color: colors.grey400, fontSize: 13 }}>
                {ageLabel}
              </Text>
            ) : null}
          </View>

          {subLines.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {subLines.map((line, idx) => (
                <Text key={idx} style={{ color: colors.grey400, fontSize: 13, marginTop: idx === 0 ? 0 : 4 }}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>
          {price ? `${formatPrice(price)}원` : '-'}
        </Text>
      </View>

      {/* Right: fixed controls */}
      <View style={{
        width: 120,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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
    </View>
  );
}

/* Component */
function ProductPeople() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const { prod_no, pkg_no, s_date, setSDate, setEDate } = useReservationStore();

  const [categories, setCategories] = useState<any[]>([]); // dynamic categories derived from specs/skus
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

  // Helper to format age_rule into Korean label "(만 X세 이상 ...)"
  const formatAgeRule = (ageRule: any) => {
    if (!ageRule) return '';
    const min = ageRule?.min ?? ageRule?.min_age ?? null;
    const max = ageRule?.max ?? ageRule?.max_age ?? null;
    if (min != null && max != null) {
      return `(만 ${min}세 이상 ~ ${max}세 미만)`;
    }
    if (min != null) {
      return `(만 ${min}세 이상)`;
    }
    if (max != null) {
      return `(만 ${max}세 미만)`;
    }
    return '';
  };

  // derive dynamic categories from pkgData.item[0].specs (prefer) and item.skus
  useEffect(() => {
    if (!pkgData) {
      setCategories([]);
      return;
    }

    const item = pkgData.item?.[0] ?? null;
    const skus: any[] = Array.isArray(item?.skus) ? item.skus : [];
    const specs: any[] = Array.isArray(item?.specs) ? item.specs : [];

    // 명시적으로 '티켓 종류' 키를 우선으로 사용한다 (요구사항)
    const TICKET_KEY = '티켓 종류';

    const mapped: any[] = [];

    const deriveTicketLabelFromSku = (sku: any) => {
      if (!sku?.spec || typeof sku.spec !== 'object') return '';
      // 1) 정확하게 '티켓 종류' 키가 있으면 무조건 그 값을 사용
      if (Object.prototype.hasOwnProperty.call(sku.spec, TICKET_KEY) && sku.spec[TICKET_KEY]) {
        return String(sku.spec[TICKET_KEY]).trim();
      }
      // 2) 없으면 대체 키(영문/다른케이스) 탐색 (fallback)
      const maybeKey = Object.keys(sku.spec).find(k =>
        String(k).toLowerCase().includes('티켓') || String(k).toLowerCase().includes('ticket') || String(k).toLowerCase().includes('종류')
      );
      if (maybeKey && sku.spec[maybeKey]) return String(sku.spec[maybeKey]).trim();
      // 3) 마지막 fallback: spec의 첫 값
      const first = Object.values(sku.spec)[0];
      return first ? String(first).trim() : '';
    };

    const pushCategory = (id: string, label: string, rule: any | null, initialQty = 0, candidateSkus?: any[]) => {
      const candidates = candidateSkus ?? skus.filter(sku => {
        if (Array.isArray(sku?.specs_ref)) {
          if (sku.specs_ref.some((r: any) => String(r.spec_value_id) === String(id) || String(r.spec_item_id) === String(id))) return true;
        }
        if (sku?.spec && typeof sku.spec === 'object') {
          // ticketLabel과 비교 (우선적으로 exact 티켓 종류)
          if (String(sku.spec[TICKET_KEY] ?? '').toLowerCase() === String(label).toLowerCase()) return true;
          // 또는 spec 값들에서 매칭
          const vals = Object.values(sku.spec).map(String);
          if (vals.some((v: string) => v && v.toLowerCase() === String(label).toLowerCase())) return true;
        }
        if (sku?.ticket_rule_spec_item && String(sku.ticket_rule_spec_item) === String(id)) return true;
        if (String(sku?.sku_id ?? sku?.id) === String(id)) return true;
        return false;
      });

      // 가격 계산: calendar 우선 -> sku.b2b_price 우선
      const candidateUnits: number[] = [];
      for (const c of candidates) {
        const cal = c?.calendar_detail ?? c?.calendar ?? item?.calendar_detail ?? pkgData?.calendar_detail_merged ?? pkgData?.calendar_detail ?? null;
        const entry = cal?.[selectedDate];
        const low = lowestPriceFromEntry(entry);
        if (low !== undefined) candidateUnits.push(low);
        const skuNum = safeNum(c?.b2b_price ?? c?.b2c_price ?? c?.official_price ?? c?.filled_price);
        if (skuNum !== undefined) candidateUnits.push(skuNum);
      }
      const unitFromCandidates = candidateUnits.length ? Math.min(...candidateUnits) : undefined;
      const fallbackUnit = toNumber(item?.b2b_min_price ?? item?.b2c_min_price) ?? toNumber(pkgData?.pkg?.[0]?.b2b_min_price) ?? toNumber(pkgData?.b2b_min_price) ?? 0;

      // ageLabel 추출
      let ageLabel = '';
      if (rule && rule.age_rule) ageLabel = formatAgeRule(rule.age_rule);
      else {
        const skuRule = (candidates && candidates[0] && (candidates[0].spec_rule ?? candidates[0].rule)) ?? null;
        if (skuRule && skuRule.age_rule) ageLabel = formatAgeRule(skuRule.age_rule);
        else if (candidates && candidates[0] && candidates[0].spec_desc) ageLabel = `(${candidates[0].spec_desc})`;
      }

      // --- Replace existing extras-building block inside pushCategory(...) with this ---
      // --- REPLACE this block inside pushCategory(...) ---
// Build subLabel lines: take only spec values, skip the '티켓 종류' key entirely
      const extras: string[] = [];
      const sampleSpec = (candidates && candidates[0] && candidates[0].spec) ? candidates[0].spec : null;
      if (sampleSpec && typeof sampleSpec === 'object') {
        for (const [key, valRaw] of Object.entries(sampleSpec)) {
          try {
            const keyTrim = String(key).trim();
            if (keyTrim === TICKET_KEY) continue; // 정확히 '티켓 종류'는 무조건 제외
            const val = valRaw == null ? '' : String(valRaw).trim();
            if (val) {
              // value가 있으면 그대로 추가 (중복 방지)
              if (!extras.includes(val)) extras.push(val);
            }
            // value가 비어있으면 아무것도 추가하지 않음 (원하시면 key를 추가하는 fallback 가능)
          } catch (e) {
            console.warn('spec entry parse failed', key, valRaw, e);
          }
        }
      }

// fallback: sample.spec_desc 있으면 넣기
      if (extras.length === 0 && candidates && candidates[0] && candidates[0].spec_desc) {
        const desc = String(candidates[0].spec_desc).trim();
        if (desc) extras.push(desc);
      }

      // final label: prefer exact sku.spec[TICKET_KEY] if present in candidate sample
      let finalLabel = label;
      if (candidates && candidates[0] && candidates[0].spec && Object.prototype.hasOwnProperty.call(candidates[0].spec, TICKET_KEY)) {
        finalLabel = String(candidates[0].spec[TICKET_KEY]).trim() || finalLabel;
      }

      mapped.push({
        id,
        label: finalLabel,
        rule,
        ageLabel,
        subLabel: extras, // array of lines
        skus: candidates,
        unit: unitFromCandidates ?? fallbackUnit ?? 0,
        qty: initialQty,
      });
    };

    // If we have ticketSpec, use its spec_items
    const ticketSpec = specs.find(s => (s?.spec_title ?? '').toString().toLowerCase().includes('티켓')) ?? specs[0];
    if (ticketSpec && Array.isArray(ticketSpec.spec_items)) {
      let adultIndex = -1;
      ticketSpec.spec_items.forEach((si: any, idx: number) => {
        const name = (si?.name ?? '').toString();
        const oid = si?.spec_item_oid ?? String(si?.spec_item_oid ?? idx);
        if (String(oid).toLowerCase().includes('adult') || name.includes('대인') || name.includes('성인')) {
          adultIndex = idx;
        }
      });

      ticketSpec.spec_items.forEach((si: any, idx: number) => {
        const name = si?.name ?? si?.spec_item_title ?? '';
        const oid = si?.spec_item_oid ?? String(si?.spec_item_oid ?? idx);
        const rule = si?.rule ?? si?.rule ?? null;
        const initial = (idx === adultIndex) ? (Number(params?.adult ?? 1) || 1) : (Number(params?.child ?? 0) || 0);
        // Push using spec item and allow candidate skus to be filtered later
        pushCategory(oid, name || String(oid), rule, initial);
      });
    } else {
      // specs 없으면 각 sku를 읽어 티켓 종류 키 우선으로 label 생성
      const seen = new Set<string>();
      for (const sku of skus) {
        let label = deriveTicketLabelFromSku(sku);
        if (!label && Array.isArray(sku?.specs_ref) && sku.specs_ref[0]?.spec_value_id) label = sku.specs_ref[0].spec_value_id;
        if (!label) label = sku?.spec_desc ?? '기타';
        const id = sku?.sku_id ?? sku?.id ?? label;
        if (seen.has(id)) continue;
        seen.add(id);
        const initial = (String(label).toLowerCase().includes('adult') || String(label).includes('대인')) ? (Number(params?.adult ?? 1) || 1) : (Number(params?.child ?? 0) || 0);
        pushCategory(id, label, sku?.spec_rule ?? null, initial, [sku]);
      }
    }

    // unmapped => 기타
    const mappedSkuIds = new Set(mapped.flatMap(m => (m.skus ?? []).map((s: any) => s.sku_id ?? s.id)).filter(Boolean));
    const unmapped = skus.filter(sku => !(mappedSkuIds.has(sku?.sku_id ?? sku?.id)));
    if (unmapped.length) {
      const unitCandidates: number[] = [];
      for (const c of unmapped) {
        const cal = c?.calendar_detail ?? c?.calendar ?? item?.calendar_detail ?? pkgData?.calendar_detail ?? null;
        const entry = cal?.[selectedDate];
        const low = lowestPriceFromEntry(entry);
        if (low !== undefined) unitCandidates.push(low);
        const skuNum = safeNum(c?.b2b_price ?? c?.b2c_price ?? c?.official_price);
        if (skuNum !== undefined) unitCandidates.push(skuNum);
      }
      const unitFromCandidates = unitCandidates.length ? Math.min(...unitCandidates) : undefined;
      const fallbackUnit = toNumber(item?.b2b_min_price ?? item?.b2c_min_price) ?? toNumber(pkgData?.pkg?.[0]?.b2b_min_price) ?? 0;
      const sample = unmapped[0];
      const ageLabel = sample?.spec_rule ? formatAgeRule(sample.spec_rule?.age_rule ?? { min: sample.spec_rule?.min_age, max: sample.spec_rule?.max_age }) : (sample?.spec_desc ? `(${sample.spec_desc})` : '');
      const extras: string[] = [];
      if (sample?.spec && typeof sample.spec === 'object') {
        Object.entries(sample.spec).forEach(([k, v]) => {
          if (!v) return;
          if (String(k) === '티켓 종류') return;
          const vs = String(v).trim();
          if (!vs) return;
          extras.push(vs);
        });
      }
      const subLabel = extras;
      mapped.push({
        id: 'other',
        label: '기타',
        rule: null,
        ageLabel,
        subLabel,
        skus: unmapped,
        unit: unitFromCandidates ?? fallbackUnit,
        qty: 0,
      });
    }

    setCategories(mapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgData, selectedDate, params?.adult, params?.child]);

  // compute totals based on categories
  const total = useMemo(() => {
    return categories.reduce((acc, c) => acc + (Number(c.unit || 0) * Number(c.qty || 0)), 0);
  }, [categories]);

  const canProceed = categories.some(c => Number(c.qty || 0) > 0) && !!selectedDate && !loadingPkg && !pkgError;

  // update qty helper
  const setCategoryQty = (id: string, qty: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  // resolve SKUs for navigation/payload using selected categories and candidate skus
  function resolveSkusForNavigationFromCategories() {
    const result: Array<{ sku_id: any; qty: number; price: number; chosenSku?: any; candidates?: any[] }> = [];

    for (const cat of categories) {
      const qty = Number(cat.qty || 0);
      if (qty <= 0) continue;
      const candidates: any[] = Array.isArray(cat.skus) ? cat.skus : [];
      // compute per-candidate unit price and pick the cheapest (prefer calendar price for selectedDate and b2b)
      const candWithUnit = candidates.map(sku => {
        const cal = sku?.calendar_detail ?? sku?.calendar ?? pkgData?.item?.[0]?.calendar_detail ?? pkgData?.calendar_detail_merged ?? pkgData?.calendar_detail ?? null;
        const entry = cal?.[selectedDate];
        const low = lowestPriceFromEntry(entry);
        const skuNum = safeNum(sku?.b2b_price ?? sku?.b2c_price ?? sku?.official_price ?? sku?.filled_price);
        const unit = low ?? skuNum ?? cat.unit ?? 0;
        return { sku, unit };
      });

      let chosen = null;
      if (candWithUnit.length > 0) {
        candWithUnit.sort((a, b) => (Number(a.unit || 0) - Number(b.unit || 0)));
        chosen = candWithUnit[0].sku;
      } else {
        chosen = pkgData?.item?.[0]?.skus?.[0] ?? pkgData?.pkg?.[0]?.skus?.[0] ?? null;
      }

      const skuId = chosen?.sku_id ?? chosen?.id ?? null;
      const unitForChosen = candWithUnit.find(c => (c.sku?.sku_id ?? c.sku?.id) === (skuId))?.unit ?? safeNum(chosen?.b2b_price ?? chosen?.b2c_price) ?? cat.unit ?? 0;

      if (skuId) {
        result.push({
          sku_id: skuId,
          qty,
          price: Number(unitForChosen * qty),
          chosenSku: chosen,
          candidates: candidates,
        });
      } else {
        result.push({
          sku_id: null,
          qty,
          price: Number((cat.unit ?? 0) * qty),
          chosenSku: null,
          candidates,
        });
      }
    }

    return result;
  }

  const goNext = () => {
    if (!canProceed) return;

    const skusForPayload = resolveSkusForNavigationFromCategories();

    // Debug log: show categories and chosen skus
    console.log('[ProductPeople] Selected categories:', categories.map(c => ({ id: c.id, label: c.label, qty: c.qty, unit: c.unit, candidates: (c.skus || []).length, ageLabel: c.ageLabel, subLabel: c.subLabel })));
    console.log('[ProductPeople] skusForPayload:', skusForPayload.map(s => ({ sku_id: s.sku_id, qty: s.qty, price: s.price })));

    navigation.navigate('/product/pay', {
      prod_no: prod,
      prod_name: pkgData?.prod_name ?? params?.prod_name,
      pkg_no: pkg,
      selected_date: selectedDate,
      categories: categories.map(c => ({ id: c.id, label: c.label, qty: c.qty, unit: c.unit, ageLabel: c.ageLabel, subLabel: c.subLabel })),
      skus: skusForPayload.map(s => ({ sku_id: s.sku_id, qty: s.qty, price: s.price })),
      adult_price: undefined,
      child_price: undefined,
      total: Number(total),
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
              {categories.length === 0 ? (
                <Counter
                  label="성인"
                  ageLabel="(만 12세 이상)"
                  subLabel={[]}
                  price={0}
                  value={1}
                  setValue={() => {}}
                  min={1}
                  max={20}
                  disabled={true}
                />
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
                    disabled={countersDisabled}
                  />
                ))
              )}

              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>요금 내역</Text>

                {categories.map((c: any) => (
                  <View key={String(c.id)} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: colors.grey400, fontSize: 15 }}>
                      {formatPrice(Number(c.unit || 0))}원 X {c.qty || 0}명
                    </Text>
                    <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 15 }}>
                      {formatPrice(Number((c.unit || 0) * (c.qty || 0)))}원
                    </Text>
                  </View>
                ))}

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
                <Text style={{ color: colors.grey400, fontSize: 22, fontWeight: 'bold' }}>{formatPrice(Number(total))}원</Text>
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