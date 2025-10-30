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

  const matchedSkuIndex = useMemo(() => {
    const selectedEntries = Object.entries(selectedMap);
    if (selectedEntries.length === 0) return null;

    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const refs: Array<{ spec_item_id?: string; spec_value_id?: string }> = sku?.specs_ref ?? sku?.specs_ref ?? [];
      const ok = selectedEntries.every(([spec_oid, spec_item_oid]) => {
        return refs.some(r => String(r.spec_item_id) === String(spec_oid) && String(r.spec_value_id) === String(spec_item_oid));
      });
      if (ok) return i;
    }
    return null;
  }, [selectedMap, skus]);

  useEffect(() => {
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
          specs.map(renderSpecGroup)
        )}

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.grey600 }}>
            선택된 항목: {Object.entries(selectedMap).map(([oid, val]) => {
            const group = specs.find(s => s.spec_oid === oid);
            const label = group?.spec_title ?? oid;
            const itemName = group?.spec_items?.find(it => it.spec_item_oid === val)?.name ?? val;
            return `${label}: ${itemName}`;
          }).join(' / ') || '없음'}
          </Text>
        </View>

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