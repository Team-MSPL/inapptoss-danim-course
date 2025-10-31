import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { Text, colors, Button } from "@toss-design-system/react-native";

export const Route = createRoute('/product/select-spec', {
  validateParams: (params) => params,
  component: ProductSelectSpec,
});

type Spec = {
  spec_oid: string;
  spec_title: string;
  spec_items: Array<{ name: string; spec_item_oid: string }>;
};

/**
 * ProductSelectSpec (updated)
 *
 * - Excludes the spec group whose spec_title is "티켓 종류" (case-sensitive) from being required/selectable.
 * - When a "티켓 종류" spec exists, we do NOT require the user to pick one; instead we:
 *   - Build the set of SKUs that match the user's selections for other specs (non-ticket specs).
 *   - Group/collect SKUs by ticket-type (e.g. "대인", "소인", "유아") and pass ALL matching ticket SKUs to the next screen.
 * - If there is no ticket-type spec, behavior is unchanged (require all specs selected and find a single matched SKU).
 *
 * Navigation: when ticket spec is present we navigate with selectedSkus: Array<sku>, selectedTicketTypes: string[]
 * Otherwise we navigate with selectedSku (single SKU object) and selectedSkuIndex as before.
 */

function ProductSelectSpec() {
  const navigation = useNavigation();
  const params: any = Route.useParams();

  const pkgData = params?.pkgData;
  const item = pkgData?.item?.[0] ?? null;
  const specs: Spec[] = Array.isArray(item?.specs) ? item.specs : [];
  const skus = Array.isArray(item?.skus) ? item.skus : [];

  // find ticket spec (by title containing exactly '티켓 종류' or lower-case contains)
  const ticketSpec = useMemo(() => {
    return specs.find(s => String(s.spec_title).trim() === '티켓 종류') ?? null;
  }, [specs]);

  // specs to render/select (exclude ticket spec)
  const selectableSpecs = useMemo(() => {
    if (!ticketSpec) return specs;
    return specs.filter(s => s.spec_oid !== ticketSpec.spec_oid);
  }, [specs, ticketSpec]);

  const [selectedMap, setSelectedMap] = useState<Record<string, string>>(() => {
    const pre = params?.initialSelectedSpecs ?? {};
    // ensure we don't preselect ticket spec into selectedMap (we treat ticket separately)
    if (ticketSpec) {
      const next = { ...pre };
      delete next[ticketSpec.spec_oid];
      return next;
    }
    return { ...pre };
  });

  // Helper: derive ticket label from sku.spec (fallback to spec_refs if necessary)
  const deriveTicketLabelFromSku = (sku: any) => {
    try {
      if (sku?.spec && typeof sku.spec === 'object') {
        if (Object.prototype.hasOwnProperty.call(sku.spec, '티켓 종류') && sku.spec['티켓 종류']) {
          return String(sku.spec['티켓 종류']).trim();
        }
        // fallback: try to find a spec key that contains '티켓'
        const maybeKey = Object.keys(sku.spec).find(k => String(k).toLowerCase().includes('티켓') || String(k).toLowerCase().includes('ticket'));
        if (maybeKey && sku.spec[maybeKey]) return String(sku.spec[maybeKey]).trim();
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Compute matched SKU index for the old single-sku flow (only when there's no ticketSpec)
  const matchedSkuIndex = useMemo(() => {
    if (ticketSpec) return null;
    const selectedEntries = Object.entries(selectedMap);
    if (selectedEntries.length === 0) return null;

    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
      const ok = selectedEntries.every(([spec_oid, spec_item_oid]) => {
        return refs.some(r => String(r.spec_item_id) === String(spec_oid) && String(r.spec_value_id) === String(spec_item_oid));
      });
      if (ok) return i;
    }
    return null;
  }, [selectedMap, skus, ticketSpec]);

  useEffect(() => {
    // no-op, kept for parity with original effect hook; left intentionally empty
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

  // When ticketSpec exists, we want to find all SKUs that match selectedMap on other specs,
  // then group/collect SKUs by ticket label.
  const matchedSkusByTicket = useMemo(() => {
    if (!ticketSpec) return null;
    // selectedEntries from non-ticket specs
    const selectedEntries = Object.entries(selectedMap);

    // Find all SKUs that satisfy the non-ticket selections
    const matchedSkus = skus.filter((sku) => {
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? [];
      // check every selected non-ticket spec is present in sku
      return selectedEntries.every(([spec_oid, spec_item_oid]) => {
        return refs.some(r => String(r.spec_item_id) === String(spec_oid) && String(r.spec_value_id) === String(spec_item_oid));
      });
    });

    // Group matched SKUs by ticket label
    const map: Record<string, any[]> = {};
    for (const sku of matchedSkus) {
      const label = deriveTicketLabelFromSku(sku) ?? sku?.spec_desc ?? '기타';
      if (!map[label]) map[label] = [];
      map[label].push(sku);
    }

    return map; // { "대인": [skuA, ...], "소인": [skuB,...], ... }
  }, [selectedMap, skus, ticketSpec]);

  const onConfirm = () => {
    // If ticket spec exists: don't require selecting it. Require other selectableSpecs only.
    const missing = selectableSpecs.filter(s => !selectedMap[s.spec_oid]);
    if (missing.length > 0) {
      Alert.alert('옵션 선택', `${missing.map(s => s.spec_title).join(', ')} 항목을 선택해 주세요.`);
      return;
    }

    if (!ticketSpec) {
      // original behavior: single SKU match required
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
      return;
    }

    // ticketSpec flow: collect all matched SKUs by ticket type
    const grouped = matchedSkusByTicket ?? {};
    const ticketTypes = Object.keys(grouped);
    if (ticketTypes.length === 0) {
      Alert.alert('조합 없음', '선택하신 옵션 조합에 해당하는 상품(티켓)이 없습니다.');
      return;
    }

    // Flatten to an array of SKU entries. If multiple SKUs exist for same ticket label,
    // include them all (caller can decide how to interpret).
    const flattenedSkus: any[] = [];
    ticketTypes.forEach((t) => {
      const arr = grouped[t] ?? [];
      for (const s of arr) {
        flattenedSkus.push({
          sku_id: s.sku_id ?? s.id ?? null,
          sku_object: s, // include full sku object for convenience
          ticket_type: t,
        });
      }
    });

    // Navigate with selectedSkus as an array and also include selectedTicketTypes
    navigation.navigate('/product/reservation', {
      prod_no: params?.prod_no ?? pkgData?.prod_no,
      pkg_no: params?.pkg_no ?? pkgData?.pkg?.[0]?.pkg_no,
      pkgData,
      selectedSpecs: selectedMap, // non-ticket selections
      selectedTicketTypes: ticketTypes, // e.g. ["대인", "소인"]
      selectedSkus: flattenedSkus, // array of { sku_id, sku_object, ticket_type }
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
            return (
              <TouchableOpacity
                key={item.spec_item_oid}
                onPress={() => toggleSelect(spec.spec_oid, item.spec_item_oid)}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.blue500 : colors.grey200,
                  backgroundColor: isSelected ? colors.blue50 : '#fff',
                  marginRight: 10,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: isSelected ? colors.blue500 : colors.grey800 }}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text typography="t3" fontWeight="bold" style={{ marginBottom: 20 }}>
          옵션 선택
        </Text>

        {specs.length === 0 ? (
          <Text>선택 가능한 옵션이 없습니다.</Text>
        ) : (
          // render only selectable specs (ticket spec excluded)
          selectableSpecs.map(renderSpecGroup)
        )}

        <View style={{ marginTop: 20 }}>
          <Button type="primary" style="fill" size="large" onPress={onConfirm}>
            다음
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default ProductSelectSpec;