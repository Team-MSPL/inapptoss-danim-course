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

export const Route = createRoute('/join/activity', {
  validateParams: (params) => params,
  component: JoinActivity,
});

export default function JoinActivity() {
  const navigation = useNavigation();
  const { handleButtonClick } = useRegionTendencyHandler();
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const activityList = tendencyData[2].list;
  const activityIcons = tendencyData[2].photo;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        {/* Step Header */}
        <StepText
          title={'하고 싶은 활동이 있나요?'}
          subTitle1={'1. 여행 스타일을 알아볼게요'}
          subTitle2={'* 중복 선택 가능'}
        />
        {/* 2x3 그리드 버튼 */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: 24,
            justifyContent: 'center',
            marginTop: 16,
          }}
        >
          {activityList.map((item, idx) => (
            <TendencyButton
              key={item}
              marginBottom={12}
              bgColor={selectList[2]?.[idx] === 1}
              label={item}
              divide
              imageUrl={activityIcons?.[idx]}
              onPress={() => handleButtonClick({ index: 2, item: idx })}
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
              onPress={() => navigation.navigate('/join/place')}
            >
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}
