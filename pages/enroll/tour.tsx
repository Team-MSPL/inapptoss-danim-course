import React, { useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { BedrockRoute } from 'react-native-bedrock';
import { useAppSelector } from 'store';
import { useTendencyHandler } from '../../hooks/useTendencyHandler';
import { styles } from './country';
import TendencyButton from '../../components/tendency-button';
import { Text, useToast, Icon } from '@toss-design-system/react-native';

export const Route = BedrockRoute('/enroll/tour', {
  validateParams: (params) => params,
  component: EnrollTour,
});

export function EnrollTour({ marginTop = 74 }: { marginTop?: number }) {
  const [page, setPage] = useState(0); // 0: 첫 화면, 1: 두 번째 화면
  const { tendency } = useAppSelector((state) => state.travelSlice);
  const { handleButtonClick, tendencyList } = useTendencyHandler();
  const { open } = useToast();

  // 각 페이지에서 사용할 인덱스
  const TENDENCY_INDEXES = [3, 4];
  const tendencyIndex = TENDENCY_INDEXES[page];
  const buttonList = tendencyList[tendencyIndex]?.list ?? [];
  const photoList = tendencyList[tendencyIndex]?.photo ?? [];

  const [warningVisible, setWarningVisible] = useState(false);
  const warningOpacity = React.useRef(new Animated.Value(0)).current;

  const isPetSelected = tendency[0]?.[6] === 1;
  const indoorIdx = buttonList.findIndex(name => name.includes('실내여행지'));

  const onButtonPress = (idx: number) => {
    if (page === 0 && isPetSelected && idx === indoorIdx) {
      setWarningVisible(true);
      Animated.timing(warningOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setWarningVisible(false);
      Animated.timing(warningOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      handleButtonClick({ index: tendencyIndex, item: idx });
    }
  };

  return (
    <View>
      <View style={{ marginTop, ...styles.ButtonsContainer }}>
        <Animated.View
          style={{
            backgroundColor: 'transparent',
            marginBottom: 12,
            marginHorizontal: 8,
            opacity: warningOpacity,
          }}>
          <Text style={{ color: '#FF5959', fontSize: 14 }}>
            반려동물을 선택하면 실내 여행지는 자동으로 제외돼요
          </Text>
        </Animated.View>
        {buttonList.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[tendencyIndex][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={photoList[idx]}
            onPress={() => onButtonPress(idx)}
          />
        ))}
      </View>
      {/* 하단 화살표 네비게이션 */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
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
          disabled={page === TENDENCY_INDEXES.length - 1}
          style={{
            opacity: page === TENDENCY_INDEXES.length - 1 ? 0.3 : 1,
            padding: 12,
          }}>
          <Icon name="icon-arrow-right-sidebar-mono" size={28} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );
}