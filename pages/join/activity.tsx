import React from 'react';
import { View } from 'react-native';
import {
  FixedBottomCTAProvider,
  Button,
  FixedBottomCTA,
  Text,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
// tendencyData import (상수로 분리했다면 경로 맞게 수정)
import { tendencyData } from "../../components/join/constants/tendencyData";
import TendencyButton from '../../components/tendency-button';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { StepText } from '../../components/step-text';
// Zustand store import
import { useRegionSearchStore } from "../../zustand/regionSearchStore";

export const Route = createRoute('/join/activity', {
  validateParams: (params) => params,
  component: JoinActivity,
});

export default function JoinActivity() {
  const navigation = useNavigation();

  // Zustand 사용
  const selectList = useRegionSearchStore((state) => state.selectList);
  const setSelectList = useRegionSearchStore((state) => state.setSelectList);

  const activityList = tendencyData[2].list;
  const activityIcons = tendencyData[2].photo;
  const activitySelect = selectList[2] ?? new Array(activityList.length).fill(0);

  // 활동 버튼 클릭 핸들러
  const handleActivityButtonClick = (idx: number) => {
    const newActivityArr = [...activitySelect];
    newActivityArr[idx] = newActivityArr[idx] === 1 ? 0 : 1;
    // selectList의 2번째(활동)만 바꿔서 저장
    const newSelectList = [...selectList];
    newSelectList[2] = newActivityArr;
    setSelectList(newSelectList);
  };

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
              bgColor={activitySelect[idx] === 1}
              label={item}
              divide
              imageUrl={activityIcons?.[idx]}
              onPress={() => handleActivityButtonClick(idx)}
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