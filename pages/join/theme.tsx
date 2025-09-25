import React from 'react';
import { View } from 'react-native';
import {
  FixedBottomCTAProvider,
  Button,
  FixedBottomCTA,
  Text,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { useRegionTendencyHandler, tendencyData } from '../../hooks/useRegionTendencyHandler';
import { useAppSelector } from 'store';
import TendencyButton from '../../components/tendency-button';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { StepText } from '../../components/step-text';

export const Route = createRoute('/join/theme', {
  validateParams: (params) => params,
  component: JoinTheme,
});

export default function JoinTheme() {
  const navigation = useNavigation();
  const { handleButtonClick } = useRegionTendencyHandler();
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const themeList = tendencyData[1].list;
  const themeIcons = tendencyData[1].photo;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        {/* Step Header */}
        <StepText
          title={'여행 테마는 무엇인가요?'}
          subTitle1={'1. 여행 스타일을 알아볼게요'}
          subTitle2={'* 중복 선택 가능'}
        />
        {/* 2x3 그리드 버튼 */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: 12,
            justifyContent: 'center',
            marginTop: 16,
          }}
        >
          {themeList.map((item, idx) => (
            <TendencyButton
              key={item}
              marginBottom={12}
              bgColor={selectList[1]?.[idx] === 1}
              label={item}
              divide
              imageUrl={themeIcons?.[idx]}
              onPress={() => handleButtonClick({ index: 1, item: idx })}
              width={150}
            />
          ))}
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
              onPress={() => navigation.navigate('/join/activity')}
            >
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}
