import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import {
  FixedBottomCTAProvider,
  Button,
  FixedBottomCTA,
  Text,
  colors,
  Slider,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { StepText } from '../../components/step-text';
// Zustand store import
import { useRegionSearchStore} from "../../zustand/regionSearchStore";
import {CustomProgressBarJoin} from "../../components/join/custom-progress-bar-join";

export const Route = createRoute('/join/popular', {
  validateParams: (params) => params,
  component: PopularSensitivityScreen,
});

function getPopularRange(val: number): [number, number] {
  // 1~5 값을 [0, 20], [20, 40], ..., [80, 100]로 변환
  switch (val) {
    case 1: return [0, 20];
    case 2: return [20, 40];
    case 3: return [40, 60];
    case 4: return [60, 80];
    case 5: return [80, 100];
    default: return [0, 20];
  }
}

export default function PopularSensitivityScreen() {
  const navigation = useNavigation();

  // Zustand 사용
  const selectPopular = useRegionSearchStore((state) => state.selectPopular);
  const setSelectPopular = useRegionSearchStore((state) => state.setSelectPopular);

  // 슬라이더 값을 selectPopular에서 구해옴. (예: [40,60]이면 3)
  const getInitialValue = () => {
    if (!selectPopular || selectPopular.length !== 2) return 3;
    const [start] = selectPopular;
    if (start < 20) return 1;
    if (start < 40) return 2;
    if (start < 60) return 3;
    if (start < 80) return 4;
    return 5;
  };

  const [value, setValue] = useState<number>(getInitialValue());

  // 값이 바뀌면 zustand에 selectPopular 저장
  useEffect(() => {
    setSelectPopular(getPopularRange(value));
  }, [value, setSelectPopular]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <CustomProgressBarJoin currentIndex={5} />
      <FixedBottomCTAProvider>
        <StepText
          title={'가고자 하는 여행지가\n어떤 느낌이었으면 하나요?'}
          subTitle1={'2. 여행지의 인기도를 선택해주세요'}
        />
        <View
          style={{
            backgroundColor: '#F6F7FA',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            marginHorizontal: 30,
            marginBottom: 32,
            marginTop: 20,
          }}
        >
          {[
            ['1. 가장 이색적인', '경남 함안군 등 37개 지역'],
            ['2. 이색적인', '경북 청송군 등 53개 지역'],
            ['3. 매력적인', '강원 화천시 등 32개 지역'],
            ['4. 유명한', '강원 강릉시 등 30개 지역'],
            ['5. 가장 유명한', '서울, 제주 등 10개 지역'],
          ].map(([left, right], i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i === 0 ? 12 : 12,
                marginTop: i === 0 ? 12 : 0,
                marginLeft: 4,
              }}
            >
              <Text typography="t6">{left}</Text>
              <Text typography="t6" color="#8891A7" style={{ marginLeft: 8, flexShrink: 0 }}>
                {right}
              </Text>
            </View>
          ))}
        </View>
        {/* 슬라이더 */}
        <View style={{ marginHorizontal: 30 }}>
          <Slider
            value={value}
            onChange={setValue}
            min={1}
            max={5}
            step={1}
            color={colors.green300}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text typography="t5" fontWeight="medium" color={colors.grey700}>
              가장 이색적인
            </Text>
            <Text typography="t5" fontWeight="medium" color={colors.grey700}>
              가장 유명한
            </Text>
          </View>
        </View>
        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white' }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={() => navigation.goBack()}>
              이전으로
            </Button>
          }
          rightButton={
            <Button
              display="block"
              type="primary"
              onPress={() => navigation.navigate('/join/distance')}
            >
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}