import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { BedrockRoute } from "react-native-bedrock";
import { FixedBottomCTAProvider, Text, colors } from '@toss-design-system/react-native';
import NavigationBar from "../../components/navigation-bar";
import { CustomProgressBarJoin } from "../../components/join/custom-progress-bar-join";
import TendencyButton from '../../components/tendency-button';
import { useRegionTendencyHandler, tendencyData } from '../../hooks/useRegionTendencyHandler';
import { useAppSelector } from 'store';
import { StepText } from "../../components/step-text";
import {styles} from "../enroll/country";

// 버튼 컨테이너 스타일을 EnrollWho와 동일하게 맞춤
const buttonContainerStyle = {
  ...styles.ButtonsContainer,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12, // contentRatio 적용 필요하면 변수화
  paddingHorizontal: 24,
  // 필요하다면 row별 maxWidth나 justifyContent 등도 추가
};


export const Route = BedrockRoute('/join/who', {
  validateParams: (params) => params,
  component: JoinWho,
});

export default function JoinWho() {
  const { handleButtonClick } = useRegionTendencyHandler(); // regionSearchSlice용 핸들러
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const whoList = tendencyData[0].list;

  // 반려동물 인덱스 계산
  const petIdx = whoList.indexOf('반려동물과');
  const showWarning = petIdx !== -1 && selectList[0]?.[petIdx] === 1;

  // 애니메이션 적용 (EnrollWho와 동일)
  const warningOpacity = useRef(new Animated.Value(showWarning ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(warningOpacity, {
      toValue: showWarning ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showWarning]);

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <CustomProgressBarJoin currentIndex={1} />
        <StepText
          title={'누구와 함께 가나요?'}
          subTitle1={'1. 여행 스타일을 알아볼게요'}
          subTitle2={'* 중복 선택 가능'}
        />
        <Animated.View
          style={{
            marginHorizontal: 24,
            marginBottom: 8,
            marginTop: 0,
            opacity: warningOpacity,
          }}
        >
          {showWarning && (
            <Text
              typography="t7"
              fontWeight="medium"
              color={colors.red600}
              style={{ fontSize: 16 }}
            >
              반려동물을 선택하면 실내 여행지는 자동으로 제외돼요
            </Text>
          )}
        </Animated.View>
        <View style={{ ...buttonContainerStyle }}>
          {whoList.map((item, idx) => (
            <TendencyButton
              marginBottom={0}
              bgColor={selectList[0]?.[idx] === 1}
              label={item}
              divide={true}
              key={idx}
              imageUrl={tendencyData[0].photo?.[idx]}
              onPress={() => handleButtonClick({ index: 0, item: idx })}
            />
          ))}
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}