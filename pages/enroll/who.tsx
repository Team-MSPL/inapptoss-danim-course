import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import { styles } from './country';
import TendencyButton from '../../components/tendency-button';
import { useAppSelector } from 'store';
import { useTendencyHandler } from '../../hooks/useTendencyHandler';
import { colors, Text } from '@toss-design-system/react-native';

type EnrollWhoProps = {
  marginTop?: number;
  contentRatio?: number;
};

export const Route = createRoute('/enroll/who', {
  validateParams: (params) => params,
  component: EnrollWho,
});

export function EnrollWho({ marginTop = 10, contentRatio = 1 }: EnrollWhoProps) {
  const { tendency } = useAppSelector((state) => state.travelSlice);
  const { handleButtonClick, tendencyList } = useTendencyHandler();

  const warningOpacity = useRef(new Animated.Value(tendency[0][6] === 1 ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(warningOpacity, {
      toValue: tendency[0][6] === 1 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [tendency[0][6]]);

  const buttonContainerStyle = {
    ...styles.ButtonsContainer,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 * contentRatio,
    paddingHorizontal: 24 * contentRatio,
    // 필요하다면 row별 maxWidth나 justifyContent 등도 추가
  };
  return (
    <View style={{ flex: 1, paddingVertical: 0 }}>
      <Animated.View
        style={{
          marginHorizontal: 24 * contentRatio,
          marginBottom: 8 * contentRatio,
          marginTop: 0,
          opacity: warningOpacity,
        }}
      >
        <Text
          typography="t7"
          fontWeight="medium"
          color={colors.red600}
          style={{ fontSize: 16 * contentRatio }}
        >
          반려동물을 선택하면 실내 여행지는 자동으로 제외돼요
        </Text>
      </Animated.View>
      <View style={{ marginTop: marginTop * contentRatio, ...buttonContainerStyle }}>
        {tendencyList[0]?.list?.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[0][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={tendencyList[0]?.photo[idx]}
            onPress={() => {
              handleButtonClick({ index: 0, item: idx });
            }}
            contentRatio={contentRatio}
          />
        ))}
      </View>
    </View>
  );
}
