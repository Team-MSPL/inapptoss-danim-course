import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import { useAppDispatch, useAppSelector } from 'store';
import { travelSliceActions } from '../../redux/travle-slice';
import { CustomColor } from '../../utill/custom-color';
import { Icon, Text } from '@toss-design-system/react-native';

type EnrollTransitProps = {
  marginTop?: number;
};

export const Route = createRoute('/enroll/transit', {
  validateParams: (params) => params,
  component: EnrollTransit,
});

export function EnrollTransit({ marginTop = 70 }: EnrollTransitProps) {
  const dispatch = useAppDispatch();
  const { transit } = useAppSelector((state) => state.travelSlice);

  const moveList = [
    {
      name: '자동차·렌트카',
      onPress: () => dispatch(travelSliceActions.enrollTransit(0)),
      icon: 'icon-car-blue',
    },
    {
      name: '대중교통',
      onPress: () => dispatch(travelSliceActions.enrollTransit(1)),
      icon: 'icon-train-blue',
    },
  ];

  return (
    <View style={[styles.gridRow, { paddingVertical: marginTop }]}>
      {moveList.map((item, idx) => {
        const isSelected = transit === idx;
        return (
          <TouchableOpacity
            key={item.name}
            onPress={item.onPress}
            activeOpacity={0.85}
            style={[styles.gridItem, isSelected && styles.selectedGridItem]}
          >
            <Icon name={item.icon} style={styles.icon} />
            <Text style={[styles.itemText, isSelected && styles.selectedText]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const CARD_WIDTH = 170;
const CARD_HEIGHT = 170;
const CARD_RADIUS = 16;
const CARD_GAP = 6;

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    gap: CARD_GAP,
  },
  gridItem: {
    flex: 1,
    maxWidth: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: '#F2F3F7',
    backgroundColor: CustomColor.ButtonBackground ?? '#FAFAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: CARD_GAP,
  },
  selectedGridItem: {
    backgroundColor: 'rgba(195,245,80,0.3)',
    borderColor: '#D7F940',
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 18,
  },
  itemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
  },
  selectedText: {
    color: '#222',
    fontWeight: '500',
  },
});
