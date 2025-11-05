import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import {Text, colors, Button, FixedBottomCTAProvider, FixedBottomCTA} from "@toss-design-system/react-native";

export const Route = createRoute('/product/select-spec', {
  validateParams: (params) => params,
  component: ProductSelectSpec,
});

type Spec = {
  spec_oid: string;
  spec_title: string;
  spec_items: Array<{ name: string; spec_item_oid: string }>;
};

function ProductSelectSpec() {
  const navigation = useNavigation();
  const params: any = Route.useParams();

  const pkgData = params?.pkgData;
  const item = pkgData?.item?.[0] ?? null;
  const specs: Spec[] = Array.isArray(item?.specs) ? item.specs : [];
  const skus = Array.isArray(item?.skus) ? item.skus : [];

  const [selectedMap, setSelectedMap] = useState<Record<string, string>>(() => {
    const pre = params?.initialSelectedSpecs ?? {};
    return { ...pre };
  });

  // Helper: find the ticket spec with EXACT title "티켓 종류" (case-insensitive, trimmed)
  const ticketSpec = useMemo(() => {
    return specs.find(s => {
      if (!s?.spec_title) return false;
      const title = String(s.spec_title).trim().toLowerCase();
      return title === '티켓 종류';
    }) ?? null;
  }, [specs]);

  // If there are no selectable specs (excluding ticketSpec) immediately navigate to reservation
  useEffect(() => {
    if (!pkgData) return;

    const selectableSpecs = specs.filter(s => !(ticketSpec && s.spec_oid === ticketSpec.spec_oid));
    if ((selectableSpecs?.length ?? 0) < 1) {
      // No option groups to select (excluding ticketSpec) -> navigate directly
      const matchedSkuIndex = (() => {
        const entries = Object.entries(selectedMap);
        if (entries.length === 0) return null;
        for (let i = 0; i < skus.length; i++) {
          const sku = skus[i];
          const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
          const ok = entries.every(([spec_oid, spec_item_oid]) =>
            refs.some(r => String(r.spec_item_id) === String(spec_oid) && String(r.spec_value_id) === String(spec_item_oid))
          );
          if (ok) return i;
        }
        return null;
      })();

      navigation.navigate('/product/reservation', {
        prod_no: params?.prod_no ?? pkgData?.prod_no,
        pkg_no: params?.pkg_no ?? (pkgData?.pkg && pkgData.pkg[0]?.pkg_no) ?? pkgData?.pkg_no,
        pkgData,
        date_setting: params?.date_setting ?? null,
        max_date: params?.max_date ?? null,
        min_date: params?.min_date ?? null,
        has_ticket_combinations: Array.isArray(ticketSpec?.spec_items) && ticketSpec?.spec_items.length > 0,
        // If ticketSpec exists, reservation page (or upstream code) can handle ticket combinations.
        selectedSpecs: selectedMap,
        selectedSkuIndex: matchedSkuIndex,
        selectedSku: matchedSkuIndex != null ? skus[matchedSkuIndex] : undefined,
        item_unit: params?.item_unit ?? null,
      });
    }
    // run once on mount dependent on pkgData/specs length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgData, specs, ticketSpec]);

  // Compute matched SKU index for current full selection (same logic as before)
  const matchedSkuIndex = useMemo(() => {
    const selectedEntries = Object.entries(selectedMap);
    if (selectedEntries.length === 0) return null;

    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
      const ok = selectedEntries.every(([spec_oid, spec_item_oid]) => {
        return refs.some(
          r =>
            String(r.spec_item_id) === String(spec_oid) &&
            String(r.spec_value_id) === String(spec_item_oid)
        );
      });
      if (ok) return i;
    }
    return null;
  }, [selectedMap, skus]);

  useEffect(() => {
    // kept for potential debug or side-effects
  }, [selectedMap, matchedSkuIndex]);

  const toggleSelect = (spec_oid: string, spec_item_oid: string) => {
    setSelectedMap(prev => {
      const cur = prev[spec_oid];
      if (cur === spec_item_oid) {
        const next = { ...prev };
        delete next[spec_oid];
        return next;
      }
      return { ...prev, [spec_oid]: spec_item_oid };
    });
  };

  // Helper: find SKU index for a given selection map
  const findSkuIndexForSelection = (selection: Record<string, string>) => {
    const entries = Object.entries(selection);
    if (entries.length === 0) return null;
    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
      const ok = entries.every(([spec_oid, spec_item_oid]) =>
        refs.some(r => String(r.spec_item_id) === String(spec_oid) && String(r.spec_value_id) === String(spec_item_oid))
      );
      if (ok) return i;
    }
    return null;
  };

  const onConfirm = () => {
    // 1) Build required-spec list EXCLUDING ticketSpec (if ticketSpec exists, user shouldn't pick it)
    const requiredSpecs = specs.filter(s => {
      if (!s?.spec_oid) return false;
      // exclude ticketSpec from required set
      if (ticketSpec && s.spec_oid === ticketSpec.spec_oid) return false;
      return true;
    });

    // 2) Check missing among requiredSpecs only
    const missing = requiredSpecs.filter(s => !selectedMap[s.spec_oid]);
    if (missing.length > 0) {
      Alert.alert('옵션 선택', `${missing.map(s => s.spec_title).join(', ')} 항목을 선택해 주세요.`);
      return;
    }

    // 3) If ticketSpec exists, auto-expand ticket items for the chosen other specs:
    if (ticketSpec) {
      const combos: Array<{ selectedSpecs: Record<string, string>; matchedSkuIndex: number; matchedSku: any }> = [];

      for (const ticketItem of ticketSpec.spec_items) {
        const hypot: Record<string, string> = { ...(selectedMap ?? {}) , [ticketSpec.spec_oid]: ticketItem.spec_item_oid };

        const skuIndex = findSkuIndexForSelection(hypot);
        if (skuIndex != null) {
          combos.push({
            selectedSpecs: hypot,
            matchedSkuIndex: skuIndex,
            matchedSku: skus[skuIndex],
          });
        }
      }

      if (combos.length === 0) {
        Alert.alert('조합 없음', '선택하신 옵션 조합에 해당하는 상품이 없습니다. 다른 조합을 선택해주세요.');
        return;
      }

      // If the only selectable spec(s) were ticketSpec (i.e. requiredSpecs.length === 0),
      // auto-navigate immediately because user had nothing to pick here.
      if (requiredSpecs.length === 0) {
        navigation.navigate('/product/reservation', {
          prod_no: params?.prod_no ?? pkgData?.prod_no,
          pkg_no: params?.pkg_no ?? (pkgData?.pkg && pkgData.pkg[0]?.pkg_no) ?? pkgData?.pkg_no,
          pkgData,
          date_setting: params?.date_setting ?? null,
          max_date: params?.max_date ?? null,
          min_date: params?.min_date ?? null,
          has_ticket_combinations: true,
          ticket_combinations: combos.map(c => ({
            selectedSpecs: c.selectedSpecs,
            matchedSkuIndex: c.matchedSkuIndex,
            matchedSku: c.matchedSku,
          })),
          item_unit: params?.item_unit ?? null,
        });
        return;
      }

      // Otherwise navigate with combos
      navigation.navigate('/product/reservation', {
        prod_no: params?.prod_no ?? pkgData?.prod_no,
        pkg_no: params?.pkg_no ?? (pkgData?.pkg && pkgData.pkg[0]?.pkg_no) ?? pkgData?.pkg_no,
        pkgData,
        date_setting: params?.date_setting ?? null,
        max_date: params?.max_date ?? null,
        min_date: params?.min_date ?? null,
        has_ticket_combinations: true,
        ticket_combinations: combos.map(c => ({
          selectedSpecs: c.selectedSpecs,
          matchedSkuIndex: c.matchedSkuIndex,
          matchedSku: c.matchedSku,
        })),
        item_unit: params?.item_unit ?? null,
      });

      return;
    }

    // 4) Default (no ticketSpec): require all specs; matchedSkuIndex must exist
    if (matchedSkuIndex == null) {
      Alert.alert('조합 없음', '선택하신 옵션 조합에 해당하는 상품이 없습니다. 다른 조합을 선택해주세요.');
      return;
    }

    const sku = skus[matchedSkuIndex];

    navigation.navigate('/product/reservation', {
      prod_no: params?.prod_no ?? pkgData?.prod_no,
      pkg_no: params?.pkg_no ?? (pkgData?.pkg && pkgData.pkg[0]?.pkg_no) ?? pkgData?.pkg_no,
      pkgData,
      date_setting: params?.date_setting ?? null,
      max_date: params?.max_date ?? null,
      min_date: params?.min_date ?? null,
      has_ticket_combinations: false,
      selectedSpecs: selectedMap,
      selectedSkuIndex: matchedSkuIndex,
      selectedSku: sku,
      item_unit: params?.item_unit ?? null,
    });
  };

  /**
   * isOptionEnabled
   */
  const isOptionEnabled = (spec_oid: string, spec_item_oid: string) => {
    if (selectedMap[spec_oid] === spec_item_oid) return true;

    const hypothetical: Record<string, string> = { ...(selectedMap ?? {}), [spec_oid]: spec_item_oid };
    const entries = Object.entries(hypothetical);

    return skus.some((sku: any) => {
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
      return entries.every(([soid, soidVal]) =>
        refs.some(r => String(r.spec_item_id) === String(soid) && String(r.spec_value_id) === String(soidVal))
      );
    });
  };

  const renderSpecGroup = (spec: Spec) => {
    const selectedValue = selectedMap[spec.spec_oid];

    // Hide the ticketSpec entirely from UI (do not render)
    if (ticketSpec && spec.spec_oid === ticketSpec.spec_oid) {
      return null;
    }

    return (
      <View key={spec.spec_oid} style={{ marginBottom: 20 }}>
        <Text typography="t5" fontWeight="bold" style={{ marginBottom: 12 }}>{spec.spec_title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {spec.spec_items.map(item => {
            const isSelected = selectedValue === item.spec_item_oid;
            const enabled = isOptionEnabled(spec.spec_oid, item.spec_item_oid);

            const baseStyle = styles.optionBase;
            const selectedStyle = isSelected ? styles.optionSelected : null;
            const disabledStyle = !enabled ? styles.optionDisabled : null;

            return (
              <TouchableOpacity
                key={item.spec_item_oid}
                onPress={() => {
                  if (!enabled) return;
                  toggleSelect(spec.spec_oid, item.spec_item_oid);
                }}
                activeOpacity={enabled ? 0.8 : 1}
                style={[
                  baseStyle,
                  isSelected && selectedStyle,
                  !enabled && disabledStyle,
                ]}
                accessibilityState={{ disabled: !enabled, selected: isSelected }}
              >
                <Text style={{ color: isSelected ? colors.blue500 : (enabled ? colors.grey800 : colors.grey300) }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FixedBottomCTAProvider>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text typography="t3" fontWeight="bold" style={{ marginBottom: 20 }}>
            옵션 선택
          </Text>

          {specs.length === 0 ? (
            <Text>선택 가능한 옵션이 없습니다.</Text>
          ) : (
            specs.map(renderSpecGroup)
          )}
        </ScrollView>
        <FixedBottomCTA onPress={onConfirm}>
          다음
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  optionBase: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: colors.blue500,
    backgroundColor: colors.blue50,
  },
  optionDisabled: {
    borderColor: colors.grey100,
    backgroundColor: '#fafafa',
  },
});