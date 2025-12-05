import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { useRegionSearchStore} from "../../zustand/regionSearchStore";
import { tendencyDataJoin } from "../../components/join/constants/tendencyData";
import TendencyButton from '../../components/tendency-button';
import {
  Icon,
  Button,
  FixedBottomCTAProvider,
  FixedBottomCTA,
  Text,
  colors,
} from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { StepText } from '../../components/step-text';
import {CustomProgressBarJoin} from "../../components/join/custom-progress-bar-join";

const PLACE_IDX = 3;
const VISIBLE_COUNT = 6;

export const Route = createRoute('/join/place', {
  validateParams: (params) => params,
  component: JoinPlace,
});

export default function JoinPlace() {
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const navigation = useNavigation();

  const selectList = useRegionSearchStore((state) => state.selectList);
  const setSelectList = useRegionSearchStore((state) => state.setSelectList);

  const whoList = tendencyDataJoin[0]?.list ?? [];
  const petIdx = whoList.indexOf('반려동물과');
  const isPetSelected = petIdx !== -1 && selectList[0]?.[petIdx] === 1;

  const placeList = tendencyDataJoin[PLACE_IDX]?.list ?? [];
  const placePhotoList = tendencyDataJoin[PLACE_IDX]?.photo ?? [];
  const indoorIdx = placeList.indexOf('실내여행지');

  const curPlaceList = placeList.slice(0, VISIBLE_COUNT);
  const curPlacePhotoList = placePhotoList.slice(0, VISIBLE_COUNT);

  const warningOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (showConflictWarning) {
      Animated.timing(warningOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(warningOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showConflictWarning, warningOpacity]);

  const handlePlaceButtonPress = (idx: number) => {
    if (isPetSelected && idx === indoorIdx) {
      setShowConflictWarning(true);
      return;
    }
    setShowConflictWarning(false);
    const prevArr = selectList[PLACE_IDX] ?? new Array(placeList.length).fill(0);
    const newArr = [...prevArr];
    newArr[idx] = newArr[idx] === 1 ? 0 : 1;
    const newSelectList = [...selectList];
    newSelectList[PLACE_IDX] = newArr;
    setSelectList(newSelectList);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationBar />
      <CustomProgressBarJoin currentIndex={4} />
      <FixedBottomCTAProvider>
        <StepText
          title={'가고 싶은 장소는 어디인가요?'}
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
          {showConflictWarning && (
            <Text typography="t7" fontWeight="bold" color={colors.red600} style={{ fontSize: 16 }}>
              반려동물과 실내여행지는 함께 선택할 수 없습니다.
            </Text>
          )}
        </Animated.View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: 24,
            justifyContent: 'center',
            marginTop: 16,
            marginBottom: 14,
          }}
        >
          {curPlaceList.map((item, idx) => (
            <TendencyButton
              key={item}
              marginBottom={12}
              bgColor={selectList[PLACE_IDX]?.[idx] === 1}
              label={item}
              divide
              imageUrl={curPlacePhotoList[idx]}
              onPress={() => handlePlaceButtonPress(idx)}
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
              onPress={() => navigation.navigate('/join/popular')}
            >
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}