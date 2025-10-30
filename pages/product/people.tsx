import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import axios from 'axios';
import { FixedBottomCTAProvider, Button, Text, colors } from "@toss-design-system/react-native";
import { useReservationStore } from "../../zustand/useReservationStore";
import Counter, { safeNum, toNumber, formatPrice, lowestPriceFromEntry } from "../../components/product/PeopleCounter";

const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

export const Route = createRoute('/product/people', {
  validateParams: (params) => params,
  component: ProductPeople,
});

function ProductPeople() {
  const navigation = useNavigation();
  const params = Route.useParams();

  const incomingPkgData = params?.pkgData ?? null;
  const incomingProdNo = params?.prod_no ?? null;
  const incomingPkgNo = params?.pkg_no ?? null;
  const incomingBaseSkus = Array.isArray(params?.baseSkus) ? params.baseSkus : (incomingPkgData?.item?.[0]?.skus ?? []);
  const incomingSelectedSku = params?.selectedSku ?? null;

  const { prod_no, pkg_no, s_date, setSDate, setEDate } = useReservationStore();

  const [categories, setCategories] = useState<any[]>([]); // dynamic categories derived from specs/skus
  const [pkgData, setPkgData] = useState<any | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);

  const [quantityRule, setQuantityRule] = useState<any | null>(null);

  useEffect(() => {
    if (params?.selected_date && !s_date) {
      setSDate(params.selected_date);
      setEDate(params.selected_date);
    }
  }, [params?.selected_date]);

  const prod = prod_no ?? params?.prod_no ?? incomingProdNo;
  const pkg = pkg_no ?? params?.pkg_no ?? incomingPkgNo;

  useEffect(() => {
    let mounted = true;
    async function loadPkg() {
      setLoadingPkg(true);
      setPkgError(null);

      if (incomingPkgData) {
        const firstItem = incomingPkgData.item?.[0] ?? null;
        const firstSku = firstItem?.skus?.[0];
        const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? incomingPkgData.calendar_detail ?? null;

        const merged: Record<string, any> = {};
        (incomingPkgData.item ?? []).forEach((it: any) => {
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
        Object.entries(calendar_detail ?? {}).forEach(([dateStr, entry]: any) => {
          const low = lowestPriceFromEntry(entry);
          if (low === undefined) return;
          const ex = merged[dateStr]?.price;
          if (ex === undefined || low < ex) merged[dateStr] = { price: low };
        });

        if (!mounted) return;
        setPkgData({ ...incomingPkgData, calendar_detail, calendar_detail_merged: merged });

        const unitRule = firstItem?.unit_quantity_rule ?? incomingPkgData?.unit_quantity_rule ?? null;
        setQuantityRule(unitRule ?? null);

        setLoadingPkg(false);
        return;
      }

      if (!prod || !pkg) {
        setPkgError('패키지 정보를 불러오기 위한 식별자가 없습니다.');
        setLoadingPkg(false);
        return;
      }

      try {
        const res = await axios.post(QUERY_PACKAGE_API, {
          prod_no: prod,
          pkg_no: pkg,
          locale: "kr",
          state: "KR",
        }, {
          headers: { "Content-Type": "application/json" }
        });

        if (!mounted) return;
        const data = res.data ?? {};
        const firstItem = data.item?.[0];
        const firstSku = firstItem?.skus?.[0];
        const calendar_detail = firstSku?.calendar_detail ?? firstSku?.calendar ?? firstItem?.calendar_detail ?? data.calendar_detail ?? null;

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
        Object.entries(calendar_detail ?? {}).forEach(([dateStr, entry]: any) => {
          const low = lowestPriceFromEntry(entry);
          if (low === undefined) return;
          const ex = merged[dateStr]?.price;
          if (ex === undefined || low < ex) merged[dateStr] = { price: low };
        });

        setPkgData({ ...data, calendar_detail, calendar_detail_merged: merged });

        const unitRule = firstItem?.unit_quantity_rule ?? data?.unit_quantity_rule ?? null;
        setQuantityRule(unitRule ?? null);

        console.log('[ProductPeople] fetched pkgData', { prod, pkg, mergedDatesCount: Object.keys(merged).length, unitRule });
      } catch (err) {
        if (!mounted) return;
        console.error('[ProductPeople] fetch err', err);
        setPkgError('패키지 가격 정보를 불러오지 못했습니다.');
      } finally {
        if (!mounted) return;
        setLoadingPkg(false);
      }
    }

    loadPkg();
    return () => { mounted = false; };
  }, [prod, pkg, incomingPkgData]);

  const selectedDate = params?.selected_date ?? s_date ?? null;

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

  useEffect(() => {
    const item = (incomingPkgData?.item?.[0]) ?? (pkgData?.item?.[0] ?? null);
    const skus: any[] = Array.isArray(incomingBaseSkus) && incomingBaseSkus.length > 0
      ? incomingBaseSkus
      : (Array.isArray(item?.skus) ? item.skus : []);

    const specs: any[] = Array.isArray(item?.specs) ? item.specs : [];

    if (!item) {
      setCategories([]);
      return;
    }

    const TICKET_KEY = '티켓 종류';

    const mapped: any[] = [];

    const deriveTicketLabelFromSku = (sku: any) => {
      if (!sku?.spec || typeof sku.spec !== 'object') return '';
      if (Object.prototype.hasOwnProperty.call(sku.spec, TICKET_KEY) && sku.spec[TICKET_KEY]) {
        return String(sku.spec[TICKET_KEY]).trim();
      }
      const maybeKey = Object.keys(sku.spec).find(k =>
        String(k).toLowerCase().includes('티켓') || String(k).toLowerCase().includes('ticket') || String(k).toLowerCase().includes('종류')
      );
      if (maybeKey && sku.spec[maybeKey]) return String(sku.spec[maybeKey]).trim();
      const first = Object.values(sku.spec)[0];
      return first ? String(first).trim() : '';
    };

    const pushCategory = (id: string, label: string, rule: any | null, initialQty = 0, candidateSkus?: any[]) => {
      const candidates = candidateSkus ?? skus.filter(sku => {
        if (Array.isArray(sku?.specs_ref)) {
          if (sku.specs_ref.some((r: any) => String(r.spec_value_id) === String(id) || String(r.spec_item_id) === String(id))) return true;
        }
        if (sku?.spec && typeof sku.spec === 'object') {
          if (String(sku.spec[TICKET_KEY] ?? '').toLowerCase() === String(label).toLowerCase()) return true;
          const vals = Object.values(sku.spec).map(String);
          if (vals.some((v: string) => v && v.toLowerCase() === String(label).toLowerCase())) return true;
        }
        if (sku?.ticket_rule_spec_item && String(sku.ticket_rule_spec_item) === String(id)) return true;
        if (String(sku?.sku_id ?? sku?.id) === String(id)) return true;
        return false;
      });

      const candidateUnits: number[] = [];
      for (const c of candidates) {
        const cal = c?.calendar_detail ?? c?.calendar ?? item?.calendar_detail ?? (pkgData?.calendar_detail_merged ?? pkgData?.calendar_detail) ?? null;
        const entry = cal?.[selectedDate];
        const low = lowestPriceFromEntry(entry);
        if (low !== undefined) candidateUnits.push(low);
        const skuNum = safeNum(c?.b2b_price ?? c?.b2c_price ?? c?.official_price ?? c?.filled_price);
        if (skuNum !== undefined) candidateUnits.push(skuNum);
      }
      const unitFromCandidates = candidateUnits.length ? Math.min(...candidateUnits) : undefined;
      const fallbackUnit = toNumber(item?.b2b_min_price ?? item?.b2c_min_price) ?? toNumber((pkgData?.pkg?.[0] ?? {})?.b2b_min_price) ?? toNumber(pkgData?.b2b_min_price) ?? 0;

      let ageLabel = '';
      if (rule && rule.age_rule) ageLabel = formatAgeRule(rule.age_rule);
      else {
        const skuRule = (candidates && candidates[0] && (candidates[0].spec_rule ?? candidates[0].rule)) ?? null;
        if (skuRule && skuRule.age_rule) ageLabel = formatAgeRule(skuRule.age_rule);
        else if (candidates && candidates[0] && candidates[0].spec_desc) ageLabel = `(${candidates[0].spec_desc})`;
      }

      const extras: string[] = [];
      const sampleSpec = (candidates && candidates[0] && candidates[0].spec) ? candidates[0].spec : null;
      if (sampleSpec && typeof sampleSpec === 'object') {
        for (const [key, valRaw] of Object.entries(sampleSpec)) {
          try {
            const keyTrim = String(key).trim();
            if (keyTrim === TICKET_KEY) continue;
            const val = valRaw == null ? '' : String(valRaw).trim();
            if (val) {
              if (!extras.includes(val)) extras.push(val);
            }
          } catch (e) {
            console.warn('spec entry parse failed', key, valRaw, e);
          }
        }
      }

      if (extras.length === 0 && candidates && candidates[0] && candidates[0].spec_desc) {
        const desc = String(candidates[0].spec_desc).trim();
        if (desc) extras.push(desc);
      }

      let finalLabel = label;
      if (candidates && candidates[0] && candidates[0].spec && Object.prototype.hasOwnProperty.call(candidates[0].spec, TICKET_KEY)) {
        finalLabel = String(candidates[0].spec[TICKET_KEY]).trim() || finalLabel;
      }

      mapped.push({
        id,
        label: finalLabel,
        rule,
        ageLabel,
        subLabel: extras,
        skus: candidates,
        unit: unitFromCandidates ?? fallbackUnit ?? 0,
        qty: initialQty,
      });
    };

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
        pushCategory(oid, name || String(oid), rule, initial);
      });
    } else {
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

    const mappedSkuIds = new Set(mapped.flatMap(m => (m.skus ?? []).map((s: any) => s.sku_id ?? s.id)).filter(Boolean));
    const unmapped = skus.filter(sku => !(mappedSkuIds.has(sku?.sku_id ?? sku?.id)));
    if (unmapped.length) {
      const unitCandidates: number[] = [];
      for (const c of unmapped) {
        const cal = c?.calendar_detail ?? c?.calendar ?? item?.calendar_detail ?? (pkgData?.calendar_detail ?? null);
        const entry = cal?.[selectedDate];
        const low = lowestPriceFromEntry(entry);
        if (low !== undefined) unitCandidates.push(low);
        const skuNum = safeNum(c?.b2b_price ?? c?.b2c_price ?? c?.official_price);
        if (skuNum !== undefined) unitCandidates.push(skuNum);
      }
      const unitFromCandidates = unitCandidates.length ? Math.min(...unitCandidates) : undefined;
      const fallbackUnit = toNumber(item?.b2b_min_price ?? item?.b2c_min_price) ?? toNumber((pkgData?.pkg?.[0] ?? {})?.b2b_min_price) ?? 0;
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
      mapped.push({
        id: 'other',
        label: '기타',
        rule: null,
        ageLabel,
        subLabel: extras,
        skus: unmapped,
        unit: unitFromCandidates ?? fallbackUnit,
        qty: 0,
      });
    }

    setCategories(mapped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgData, selectedDate, incomingBaseSkus, incomingPkgData, incomingSelectedSku, params?.adult, params?.child]);

  const total = useMemo(() => {
    return categories.reduce((acc, c) => acc + (Number(c.unit || 0) * Number(c.qty || 0)), 0);
  }, [categories]);

  const totalCount = useMemo(() => {
    return categories.reduce((acc, c) => acc + (Number(c.qty || 0)), 0);
  }, [categories]);

  const canProceed = categories.some(c => Number(c.qty || 0) > 0) && !!selectedDate && !loadingPkg && !pkgError;

  const getTotalRule = () => {
    const tr = quantityRule?.total_rule ?? {};
    return {
      min: Number(tr?.min_quantity ?? tr?.min ?? 1),
      max: Number(tr?.max_quantity ?? tr?.max ?? Infinity),
      isMultipleLimit: Boolean(quantityRule?.total_rule?.is_multiple_limit ?? false),
    };
  };

  const setCategoryQty = (id: string, qty: number) => {
    setCategories(prev => {
      const prevTotal = prev.reduce((s, p) => s + Number(p.qty || 0), 0);
      const found = prev.find(p => p.id === id);
      const old = found ? Number(found.qty || 0) : 0;
      const nextTotal = prevTotal - old + Number(qty || 0);

      const { max } = getTotalRule();
      if (Number.isFinite(max) && nextTotal > max) {
        Alert.alert('최대 수량 초과', `총 구매 수량은 최대 ${max}명까지 가능합니다.`);
        return prev;
      }

      return prev.map(c => c.id === id ? { ...c, qty } : c);
    });
  };

  const extractMultipleFromRulesets = (rulesets: any[] | undefined): number | null => {
    if (!Array.isArray(rulesets)) return null;
    for (const r of rulesets) {
      const candidates = [r?.multiple, r?.multiple_of, r?.step, r?.quantity_multiple, r?.quantity_step];
      for (const c of candidates) {
        const n = Number(c);
        if (Number.isFinite(n) && n > 0 && Math.floor(n) === n) return n;
      }
      if (r?.type === 'multiple' && r?.value) {
        const n = Number(r.value);
        if (Number.isFinite(n) && n > 0 && Math.floor(n) === n) return n;
      }
    }
    return null;
  };

  function resolveSkusForNavigationFromCategories() {
    const result: Array<{ sku_id: any; qty: number; price: number; chosenSku?: any; candidates?: any[] }> = [];

    for (const cat of categories) {
      const qty = Number(cat.qty || 0);
      if (qty <= 0) continue;
      const candidates: any[] = Array.isArray(cat.skus) ? cat.skus : [];

      const candWithUnit = candidates.map(sku => {
        const cal = sku?.calendar_detail ?? sku?.calendar ?? (incomingSelectedSku?.calendar_detail ?? incomingSelectedSku?.calendar) ?? pkgData?.item?.[0]?.calendar_detail ?? pkgData?.calendar_detail_merged ?? pkgData?.calendar_detail ?? null;
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
        chosen = (incomingSelectedSku ?? pkgData?.item?.[0]?.skus?.[0] ?? pkgData?.pkg?.[0]?.skus?.[0]) ?? null;
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

    const { min, max, isMultipleLimit } = getTotalRule();

    if (totalCount < min) {
      Alert.alert('최소 수량 미만', `총 최소 구매 수량은 ${min}명입니다. 인원을 확인해주세요.`);
      return;
    }
    if (Number.isFinite(max) && totalCount > max) {
      Alert.alert('최대 수량 초과', `총 최대 구매 수량은 ${max}명입니다. 인원을 확인해주세요.`);
      return;
    }

    const rulesets = quantityRule?.ticket_rule?.rulesets ?? [];
    if (isMultipleLimit) {
      const multiple = extractMultipleFromRulesets(rulesets);
      if (multiple) {
        if ((totalCount % multiple) !== 0) {
          Alert.alert('수량 규칙 위반', `총 인원은 ${multiple}명 단위로만 구매 가능합니다. 현재 ${totalCount}명은 허용되지 않습니다.`);
          return;
        }
      } else {
        Alert.alert('구매 규칙 안내', '판매자가 복수 구매 제한(is_multiple_limit)을 설정했습니다. 자세한 규칙은 상품 상세를 확인해 주세요.');
      }
    }

    const skusForPayload = resolveSkusForNavigationFromCategories();

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
      baseSkus: Array.isArray(incomingBaseSkus) && incomingBaseSkus.length > 0 ? incomingBaseSkus : (pkgData?.item?.[0]?.skus ?? []),
      selectedSku: incomingSelectedSku ?? null,
    });
  };

  const countersDisabled = !selectedDate || loadingPkg || !!pkgError;

  const renderTicketRuleSummary = () => {
    const rulesets = quantityRule?.ticket_rule?.rulesets;
    if (!Array.isArray(rulesets) || rulesets.length === 0) return null;

    return (
      <View style={{ marginBottom: 8, padding: 12, backgroundColor: '#fff8e6', borderRadius: 8 }}>
        <Text style={{ fontWeight: 'bold', color: colors.grey800, marginBottom: 6 }}>구매 규칙 안내</Text>
        {rulesets.map((rs: any, idx: number) => {
          const title = rs?.title ?? rs?.name ?? rs?.description ?? JSON.stringify(rs);
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Text key={idx} style={{ color: colors.grey600, fontSize: 13, marginTop: idx === 0 ? 0 : 4 }}>
              - {title}
            </Text>
          );
        })}
      </View>
    );
  };

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

              {renderTicketRuleSummary()}

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