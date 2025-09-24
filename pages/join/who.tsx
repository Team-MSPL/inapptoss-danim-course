import React from 'react';
import { View } from 'react-native';
import { BedrockRoute } from "react-native-bedrock";
import { FixedBottomCTAProvider, Text, colors } from '@toss-design-system/react-native';
import NavigationBar from "../../components/navigation-bar";
import { CustomProgressBarJoin } from "../../components/join/custom-progress-bar-join";
import TendencyButton from '../../components/tendency-button';
import { useRegionTendencyHandler, tendencyData } from '../../hooks/useRegionTendencyHandler'; // 새로 만든 훅 import
import { useAppSelector } from 'store';

export const Route = BedrockRoute('/join/who', {
  validateParams: (params) => params,
  component: JoinWho,
});

export default function JoinWho() {
  const { handleButtonClick } = useRegionTendencyHandler(); // regionSearchSlice용 핸들러
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const whoList = tendencyData[0].list;

  // 반려동물 인덱스가 없다면 아래 line 제거
  const showWarning = whoList.includes('반려동물과') && selectList[0]?.[whoList.indexOf('반려동물과')] === 1;

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <CustomProgressBarJoin currentIndex={1} />
        <Text typography="t6" fontWeight="bold" style={{ marginBottom: 12 }}>누구랑 여행갈겨?</Text>
        {showWarning && (
          <Text
            typography="t7"
            fontWeight="medium"
            color={colors.red600}
            style={{ fontSize: 16, marginBottom: 8 }}
          >
            반려동물을 선택하면 실내 여행지는 자동으로 제외돼요
          </Text>
        )}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          paddingHorizontal: 24,
        }}>
          {whoList.map((item, idx) => (
            <TendencyButton
              marginBottom={0}
              bgColor={selectList[0]?.[idx] === 1}
              label={item}
              divide={true}
              key={idx}
              imageUrl={tendencyData[0].photo?.[idx]}
              onPress={() => handleButtonClick({ index: 0, item: idx })}
              contentRatio={1}
            />
          ))}
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}