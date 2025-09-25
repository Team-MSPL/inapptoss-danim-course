import React, {useState} from 'react';
import { View } from 'react-native';
import {
  FixedBottomCTAProvider,
  Button,
  FixedBottomCTA,
  Text, colors, Slider,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { useAppSelector } from 'store';
import { regionSearchActions } from '../../redux/regionSearchSlice';
import { useDispatch } from 'react-redux';
import { BedrockRoute, useNavigation } from 'react-native-bedrock';
import { StepText } from '../../components/step-text';

export const Route = BedrockRoute('/join/popular', {
  validateParams: (params) => params,
  component: PopularSensitivityScreen,
});

export default function PopularSensitivityScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const popularSensitivity = useAppSelector(
    state => state.regionSearchSlice.request.popularSensitivity ?? 5
  );

  const [value, setValue] = useState(popularSensitivity);

  const handleSliderChange = (value: number) => {
    dispatch(regionSearchActions.setRequest({
      ...state.regionSearchSlice.request,
      popularSensitivity: Math.round(value),
    }));
  }


  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <StepText
          title={'가고자 하는 여행지가\n어떤 느낌이었으면 하나요?'}
          subTitle1={'2. 여행지의 인기도를 선택해주세요'}
        />
        <View style={{
          backgroundColor: '#F6F7FA',
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 24,
          marginHorizontal: 30,
          marginBottom: 32,
          marginTop: 20,
        }}>
          {[
            ["1. 가장 이색적인", "경남 함안군 등 37개 지역"],
            ["2. 이색적인", "경북 청송군 등 53개 지역"],
            ["3. 매력적인", "강원 화천시 등 32개 지역"],
            ["4. 유명한", "강원 강릉시 등 30개 지역"],
            ["5. 가장 유명한", "서울, 제주 등 10개 지역"],
          ].map(([left, right], i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i === 0 ? 12 : 12, // 첫 줄만 marginVertical: 12였으면 조정
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
            max={10}
            step={1}
            color={colors.green300}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
            <Button display="block" type="primary" onPress={() => navigation.navigate('/join/popular')}>
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}