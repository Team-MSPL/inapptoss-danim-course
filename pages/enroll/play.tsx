import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import { useAppSelector } from 'store';
import { useTendencyHandler } from '../../hooks/useTendencyHandler';
import { styles } from './country';
import TendencyButton from '../../components/tendency-button';

type EnrollPlayProps = {
  marginTop?: number;
};

export const Route = createRoute('/enroll/play', {
  validateParams: (params) => params,
  component: EnrollPlay,
});

export function EnrollPlay({ marginTop = 74 }: EnrollPlayProps) {
  const { tendency } = useAppSelector((state) => state.travelSlice);

  const { handleButtonClick, tendencyList } = useTendencyHandler();
  return (
    <>
      <View style={{ marginTop: marginTop, ...styles.ButtonsContainer }}>
        {tendencyList[2]?.list?.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[2][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={tendencyList[2]?.photo[idx]}
            onPress={() => {
              handleButtonClick({ index: 2, item: idx });
            }}
          ></TendencyButton>
        ))}
      </View>
    </>
  );
}
