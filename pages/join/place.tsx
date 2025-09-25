import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { BedrockRoute, useNavigation } from 'react-native-bedrock';
import { useAppSelector } from 'store';
import { useRegionTendencyHandler, tendencyData } from '../../hooks/useRegionTendencyHandler';
import TendencyButton from '../../components/tendency-button';
import { Icon, Button, FixedBottomCTAProvider, FixedBottomCTA, Text, colors } from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';
import { StepText } from '../../components/step-text';

const PLACE_IDX = 3;
const PLACE_PAGE_SPLIT = [
  [0, 6],   // 첫 페이지: 0~5 (6개)
  [6, 11],  // 두 번째 페이지: 6~10 (5개)
];

export const Route = BedrockRoute('/join/place', {
  validateParams: (params) => params,
  component: JoinPlace,
});

export default function JoinPlace() {
  const [page, setPage] = useState(0);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const navigation = useNavigation();
  const { handleButtonClick } = useRegionTendencyHandler();
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);

  // 누구와 list/반려동물 인덱스
  const whoList = tendencyData[0]?.list ?? [];
  const petIdx = whoList.indexOf('반려동물과');
  const isPetSelected = petIdx !== -1 && selectList[0]?.[petIdx] === 1;

  // 장소/실내여행지 인덱스
  const placeList = tendencyData[PLACE_IDX]?.list ?? [];
  const placePhotoList = tendencyData[PLACE_IDX]?.photo ?? [];
  const indoorIdx = placeList.indexOf('실내여행지');

  // 현재 페이지 범위
  const [start, end] = PLACE_PAGE_SPLIT[page];
  const curPlaceList = placeList.slice(start, end);
  const curPlacePhotoList = placePhotoList.slice(start, end);

  // 경고 애니메이션
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
  }, [showConflictWarning]);

  // 실내여행지 버튼 onPress 핸들러
  const handlePlaceButtonPress = (idx: number) => {
    if (isPetSelected && (start + idx === indoorIdx)) {
      setShowConflictWarning(true);
      // 경고문구가 일정 시간 후 사라지게 하려면 아래 코드 추가:
      // setTimeout(() => setShowConflictWarning(false), 2000);
      return;
    }
    setShowConflictWarning(false); // 다른 버튼 누르면 경고문구 사라지게
    handleButtonClick({ index: PLACE_IDX, item: start + idx });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <StepText
          title={'가고 싶은 장소는 어디인가요?'}
          subTitle1={'1. 여행 스타일을 알아볼게요'}
          subTitle2={'* 중복 선택 가능'}
        />
        {/* 경고 메시지 */}
        <Animated.View
          style={{
            marginHorizontal: 24,
            marginBottom: 8,
            marginTop: 0,
            opacity: warningOpacity,
          }}
        >
          {showConflictWarning && (
            <Text
              typography="t7"
              fontWeight="bold"
              color={colors.red600}
              style={{ fontSize: 16 }}
            >
              반려동물과 실내여행지는 함께 선택할 수 없습니다.
            </Text>
          )}
        </Animated.View>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          paddingHorizontal: 24,
          justifyContent: 'center',
          marginTop: 16,
          marginBottom: 14,
        }}>
          {curPlaceList.map((item, idx) => (
            <TendencyButton
              key={item}
              marginBottom={12}
              bgColor={selectList[PLACE_IDX]?.[start + idx] === 1}
              label={item}
              divide
              imageUrl={curPlacePhotoList[idx]}
              onPress={() => handlePlaceButtonPress(idx)}
              width={150}
              // disabled={isPetSelected && (start + idx === indoorIdx)} // 비활성화 제거
            />
          ))}
        </View>
        {/* 페이지 이동 화살표 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 0,
          marginBottom: 16,
          gap: 8,
        }}>
          <TouchableOpacity
            onPress={() => setPage(page - 1)}
            disabled={page === 0}
            style={{
              opacity: page === 0 ? 0.3 : 1,
              padding: 12,
            }}>
            <Icon name="icon-arrow-left-sidebar-mono" size={28} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPage(page + 1)}
            disabled={page === PLACE_PAGE_SPLIT.length - 1}
            style={{
              opacity: page === PLACE_PAGE_SPLIT.length - 1 ? 0.3 : 1,
              padding: 12,
            }}>
            <Icon name="icon-arrow-right-sidebar-mono" size={28} color="#222" />
          </TouchableOpacity>
        </View>
        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white' }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={() => navigation.goBack()}>
              이전으로
            </Button>
          }
          rightButton={
            <Button display="block" type="primary" onPress={() => {/* 다음 페이지 이동 */}}>
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}