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

  // Compute matched SKU index for current full selection (same logic as before)
  const matchedSkuIndex = useMemo(() => {
    const selectedEntries = Object.entries(selectedMap);
    if (selectedEntries.length === 0) return null;

    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? sku?.specs_ref ?? [];
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
    // no-op effect preserved in case of side-effect debug needed
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

  const onConfirm = () => {
    const missing = specs.filter(s => !selectedMap[s.spec_oid]);
    if (missing.length > 0) {
      Alert.alert('옵션 선택', `${missing.map(s => s.spec_title).join(', ')} 항목을 선택해 주세요.`);
      return;
    }

    if (matchedSkuIndex == null) {
      Alert.alert('조합 없음', '선택하신 옵션 조합에 해당하는 상품이 없습니다. 다른 조합을 선택해주세요.');
      return;
    }

    const sku = skus[matchedSkuIndex];

    navigation.navigate('/product/reservation', {
      prod_no: params?.prod_no ?? pkgData?.prod_no,
      pkg_no: params?.pkg_no ?? pkgData?.pkg?.[0]?.pkg_no,
      pkgData,
      selectedSpecs: selectedMap,
      selectedSkuIndex: matchedSkuIndex,
      selectedSku: sku,
    });
  };

  /**
   * isOptionEnabled
   * - spec_oid, spec_item_oid: candidate option to test
   * - We simulate selecting this option in combination with the already selected other specs
   * - The option is enabled if there's at least one SKU whose specs_ref match ALL selected entries
   *
   * Notes:
   * - If the option is currently selected (exact match), it should always be enabled (so user can unselect).
   * - We do not mutate actual selectedMap here.
   */
  const isOptionEnabled = (spec_oid: string, spec_item_oid: string) => {
    // if this option is currently selected, allow it (so user can toggle off)
    if (selectedMap[spec_oid] === spec_item_oid) return true;

    // build a hypothetical selection map: copy current selections, set this spec -> candidate value
    const hypothetical: Record<string, string> = { ...(selectedMap ?? {}) , [spec_oid]: spec_item_oid };

    const entries = Object.entries(hypothetical);

    // there's at least one sku that satisfies all selected pairs
    return skus.some((sku: any) => {
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? sku?.specs_ref ?? [];
      // for each selected pair, the sku must have a ref matching spec_item_id === spec_oid && spec_value_id === spec_item_oid
      return entries.every(([soid, soidVal]) =>
        refs.some(r => String(r.spec_item_id) === String(soid) && String(r.spec_value_id) === String(soidVal))
      );
    });
  };

  const renderSpecGroup = (spec: Spec) => {
    const selectedValue = selectedMap[spec.spec_oid];
    return (
      <View key={spec.spec_oid} style={{ marginBottom: 20 }}>
        <Text typography="t5" fontWeight="bold" style={{ marginBottom: 12 }}>{spec.spec_title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {spec.spec_items.map(item => {
            const isSelected = selectedValue === item.spec_item_oid;
            const enabled = isOptionEnabled(spec.spec_oid, item.spec_item_oid);

            // visual styles
            const baseStyle = styles.optionBase;
            const selectedStyle = isSelected ? styles.optionSelected : null;
            const disabledStyle = !enabled ? styles.optionDisabled : null;

            return (
              <TouchableOpacity
                key={item.spec_item_oid}
                onPress={() => {
                  if (!enabled) return; // no-op when disabled
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
        <View style={{ padding: 24 }}>
          <Text typography="t3" fontWeight="bold" style={{ marginBottom: 20 }}>
            옵션 선택
          </Text>

          {specs.length === 0 ? (
            <Text>선택 가능한 옵션이 없습니다.</Text>
          ) : (
            specs.map(renderSpecGroup)
          )}
        </View>
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

export default ProductSelectSpec;