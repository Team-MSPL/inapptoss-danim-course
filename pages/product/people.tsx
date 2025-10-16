import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { FixedBottomCTAProvider, Button, Text, colors } from "@toss-design-system/react-native";

export const Route = createRoute('/product/people', {
  validateParams: (params) => params,
  component: ProductPeople,
});

function Counter({ label, subLabel, price, value, setValue, min = 0, max = 10 }) {
  const onMinus = () => setValue(Math.max(min, value - 1));
  const onPlus = () => setValue(Math.min(max, value + 1));
  return (
    <View style={{
      backgroundColor: colors.grey50,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text typography="t4" fontWeight="bold">{label}</Text>
          <Text style={{ marginLeft: 8, color: colors.grey400, fontSize: 13 }}>{subLabel}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>{price.toLocaleString()}원</Text>
      </View>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.grey100,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 46,
      }}>
        <TouchableOpacity onPress={onMinus} disabled={value <= min}>
          <Text style={{
            fontSize: 28,
            color: value <= min ? colors.grey300 : colors.grey700,
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
        <TouchableOpacity onPress={onPlus} disabled={value >= max}>
          <Text style={{
            fontSize: 28,
            color: value >= max ? colors.grey300 : colors.grey700,
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
  const [adult, setAdult] = useState(2);
  const [child, setChild] = useState(2);

  // 실제 가격은 props or params 등에서 받아야 하나, 예시로 고정
  const adultPrice = 599000;
  const childPrice = 399000;

  const canProceed = adult > 0; // 최소 1명 이상

  // 합계 계산
  const {
    adultTotal,
    childTotal,
    total
  } = useMemo(() => {
    const adultTotal = adultPrice * adult;
    const childTotal = childPrice * child;
    return {
      adultTotal,
      childTotal,
      total: adultTotal + childTotal
    };
  }, [adult, child]);

  // 숫자 콤마 포맷
  const format = (n: number) => n.toLocaleString();

  const goNext = () => {
    // 인원 정보 store/setState에 저장하거나 params로 전달
    navigation.navigate('/product/next-step', {
      adult, child
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FixedBottomCTAProvider>
        <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Text typography="t3" fontWeight="bold">여행 인원</Text>
            <Text style={{ marginLeft: 8, color: colors.red400, fontSize: 15 }}>(필수)</Text>
          </View>
          <Counter
            label="성인"
            subLabel="(만 12세 이상)"
            price={adultPrice}
            value={adult}
            setValue={setAdult}
            min={0}
            max={10}
          />
          <Counter
            label="아동"
            subLabel="(만 12세 미만)"
            price={childPrice}
            value={child}
            setValue={setChild}
            min={0}
            max={10}
          />

          {/* 상세 금액 내역 */}
          <View style={{ marginTop: 22, marginBottom: 6 }}>
            <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>성인</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: colors.grey400, fontSize: 15 }}>{format(adultPrice)}원 X {adult}명</Text>
              <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 15 }}>{format(adultTotal)}원</Text>
            </View>
            <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 16, marginBottom: 8, marginTop: 18 }}>아동</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: colors.grey400, fontSize: 15 }}>{format(childPrice)}원 X {child}명</Text>
              <Text style={{ color: colors.grey800, fontWeight: 'bold', fontSize: 15 }}>{format(childTotal)}원</Text>
            </View>
          </View>
          <View style={{
            borderTopWidth: 1,
            borderColor: colors.grey100,
            marginTop: 8,
            marginBottom: 12,
            paddingTop: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ color: colors.grey300, fontSize: 17, fontWeight: 'bold' }}>총 금액</Text>
            <Text style={{ color: colors.grey400, fontSize: 22, fontWeight: 'bold' }}>{format(total)}원</Text>
          </View>
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