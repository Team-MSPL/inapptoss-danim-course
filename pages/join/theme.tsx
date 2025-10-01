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
import { useRegionSearchStore} from "../../zustand/regionSearchStore";
import {CustomProgressBarJoin} from "../../components/join/custom-progress-bar-join";

export const Route = createRoute('/join/theme', {
  validateParams: (params) => params,
  component: JoinTheme,
});

export default function JoinTheme() {
  const navigation = useNavigation();

  // Zustand 사용
  const selectList = useRegionSearchStore((state) => state.selectList);
  const setSelectList = useRegionSearchStore((state) => state.setSelectList);

  const themeList = tendencyData[1].list;
  const themeIcons = tendencyData[1].photo;
  const themeSelect = selectList[1] ?? new Array(themeList.length).fill(0);

  // 테마 버튼 클릭 핸들러
  const handleThemeButtonClick = (idx: number) => {
    const newThemeArr = [...themeSelect];
    newThemeArr[idx] = newThemeArr[idx] === 1 ? 0 : 1;
    // selectList의 1번째(테마)만 바꿔서 저장
    const newSelectList = [...selectList];
    newSelectList[1] = newThemeArr;
    setSelectList(newSelectList);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <NavigationBar />
      <CustomProgressBarJoin currentIndex={2} />
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
              bgColor={themeSelect[idx] === 1}
              label={item}
              divide
              imageUrl={themeIcons?.[idx]}
              onPress={() => handleThemeButtonClick(idx)}
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