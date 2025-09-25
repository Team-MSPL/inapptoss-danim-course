import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import {
  FixedBottomCTAProvider,
  Text,
  colors,
  Button,
  FixedBottomCTA,
  useBottomSheet,
  BottomSheet,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { CustomProgressBarJoin } from '../../components/join/custom-progress-bar-join';
import TendencyButton from '../../components/tendency-button';
import { useRegionTendencyHandler, tendencyData } from '../../hooks/useRegionTendencyHandler';
import { useAppSelector } from 'store';
import { StepText } from '../../components/step-text';
import { styles } from '../enroll/country';
import { createRoute, useNavigation } from '@granite-js/react-native';

const buttonContainerStyle = {
  ...styles.ButtonsContainer,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  paddingHorizontal: 24,
};

export const Route = createRoute('/join/who', {
  validateParams: (params) => params,
  component: JoinWho,
});

export default function JoinWho() {
  const navigation = useNavigation();
  const { handleButtonClick } = useRegionTendencyHandler();
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const whoList = tendencyData[0].list;
  const petIdx = whoList.indexOf('반려동물과');
  const showWarning = petIdx !== -1 && selectList[0]?.[petIdx] === 1;

  // 애니메이션
  const warningOpacity = useRef(new Animated.Value(showWarning ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(warningOpacity, {
      toValue: showWarning ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showWarning]);

  // Toss BottomSheet 사용
  const { open: openBottomSheet, close: closeBottomSheet } = useBottomSheet();

  const handleNext = () => {
    if (showWarning) {
      openBottomSheet({
        children: (
          <View>
            <View style={{ marginTop: 28, paddingHorizontal: 24 }}>
              <Text
                typography="t4"
                color={colors.grey800}
                fontWeight="bold"
                style={{ marginBottom: 8 }}
              >
                반려동물 출입 여행지를 찾고 있나요?
              </Text>
              <Text typography="t6" color={colors.grey600} style={{ marginBottom: 24 }}>
                반려동물 출입이 허용되지 않은 곳은 추천에서 제외돼서 여행지가 적을 수 있어요.
              </Text>
            </View>
            <BottomSheet.CTA.Double
              leftButton={
                <Button
                  type="dark"
                  style="weak"
                  display="block"
                  onPress={() => {
                    closeBottomSheet();
                  }}
                >
                  수정하기
                </Button>
              }
              rightButton={
                <Button
                  type="primary"
                  style="fill"
                  display="block"
                  onPress={() => {
                    closeBottomSheet();
                    navigation.navigate('/join/season');
                  }}
                >
                  확인완료
                </Button>
              }
            />
          </View>
        ),
      });
    } else {
      navigation.navigate('/join/season');
    }
  };

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
        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white' }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={() => navigation.goBack()}>
              이전으로
            </Button>
          }
          rightButton={
            <Button display="block" onPress={handleNext} disabled={false}>
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}
