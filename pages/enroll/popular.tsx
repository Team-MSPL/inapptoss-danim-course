import { colors, Slider, Text } from '@toss-design-system/react-native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BedrockRoute, useNavigation } from 'react-native-bedrock';
import FastImage from 'react-native-fast-image';
import { useAppDispatch, useAppSelector } from 'store';
import { travelSliceActions } from '../../redux/travle-slice';
import { RouteButton } from '../../components/route-button';

type EnrollPopularProps = {
  contentRatio?: number;
};

export const Route = BedrockRoute('/enroll/popular', {
  validateParams: (params) => params,
  component: EnrollPopular,
});

export function EnrollPopular({ contentRatio = 1 }: EnrollPopularProps) {
  const { popular } = useAppSelector((state) => state.travelSlice);
  const dispatch = useAppDispatch();
  const [value, setValue] = useState(popular);

  const imageList = [
    'https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2Fasd.png?alt=media&token=3df1ca25-0ab7-4289-aec1-268172db19be',
    'https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F2.png?alt=media&token=a99b1cc7-2885-4051-8624-228f5e374de6',
    'https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F3.png?alt=media&token=cc71b542-6c97-4e91-b935-2fc9da9842fe',
    'https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F4.png?alt=media&token=4d270043-8980-4846-bd17-cdd9a4a5df12',
    'https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F5.png?alt=media&token=4952eea8-3f5c-44f6-bfca-45906ff9cc0c',
  ];

  useEffect(() => {
    imageList.forEach((uri) => FastImage.preload([{ uri }]));
  }, []);

  const currentIdx = Math.ceil(value / 2) - 1;
  const navigation = useNavigation();

  return (
    <View style={{ marginHorizontal: 24 }}>
      <View
        style={{
          position: 'relative',
          width: 300 * contentRatio,
          height: 300 * contentRatio,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
      >
        {imageList.map((uri, idx) => (
          <FastImage
            key={idx}
            source={{ uri }}
            style={{
              position: 'absolute',
              width: 300 * contentRatio,
              height: 300 * contentRatio,
              opacity: idx === currentIdx ? 1 : 0,
            }}
            resizeMode={FastImage.resizeMode.contain}
          />
        ))}
      </View>
      <Text>인기도: {value}</Text>
      <Slider value={value} onChange={setValue} min={1} max={10} step={1} color={colors.green300} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 덜 알려진
        </Text>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 유명한
        </Text>
      </View>
      {navigation.getState()?.routes?.at(-1)?.name.includes('popular') && (
        <RouteButton
          onPress={() => {
            dispatch(travelSliceActions.updatePopluar(value));
          }}
        />
      )}
    </View>
  );
}
