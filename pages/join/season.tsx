import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import {BedrockRoute, useNavigation} from 'react-native-bedrock';
import { useAppDispatch, useAppSelector } from 'store';
import { travelSliceActions } from '../../redux/travle-slice';
import { Text, Button, FixedBottomCTAProvider, FixedBottomCTA } from '@toss-design-system/react-native';
import NavigationBar from '../../components/navigation-bar';

const seasonList = [
  {
    name: '봄',
    icon: '🌼',
  },
  {
    name: '여름',
    icon: '🏝️',
  },
  {
    name: '가을',
    icon: '🍁',
  },
  {
    name: '겨울',
    icon: '❄️',
  },
];

export const Route = BedrockRoute('/join/season', {
  validateParams: (params) => params,
  component: SeasonSelect,
});

export default function SeasonSelect() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const selectList = useAppSelector((state) => state.regionSearchSlice.request.selectList ?? []);
  const seasonSelect = selectList[selectList.length - 1] ?? [0, 0, 0, 0];

  const handleSelect = (idx: number) => {
    const updated = [...seasonSelect];
    updated[idx] = updated[idx] === 1 ? 0 : 1;
    const newSelectList = [...selectList];
    newSelectList[newSelectList.length - 1] = updated;
    dispatch(travelSliceActions.setRequest({
      ...useAppSelector((state) => state.regionSearchSlice.request),
      selectList: newSelectList,
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <View style={styles.header}>
          <Text typography="t6" color="#8A8A8A" fontWeight="medium" style={{ marginBottom: 2 }}>
            1. 여행 스타일을 알아볼게요
          </Text>
          <Text typography="t3" fontWeight="bold" style={{ marginBottom: 6 }}>
            여행 테마는 무엇인가요?
          </Text>
          <Text typography="t7" color="#C2C2C2">
            * 중복 선택 가능
          </Text>
        </View>
        <View style={styles.gridRow}>
          {seasonList.map((season, idx) => (
            <TouchableOpacity
              key={season.name}
              style={[
                styles.gridItem,
                seasonSelect[idx] === 1 && styles.selectedGridItem,
              ]}
              activeOpacity={0.85}
              onPress={() => handleSelect(idx)}
            >
              <View style={[
                styles.iconBox,
                seasonSelect[idx] === 1 && styles.selectedIconBox,
              ]}>
                <Text style={[styles.icon, seasonSelect[idx] === 1 && styles.selectedIcon]}>
                  {season.icon}
                </Text>
              </View>
              <Text style={[styles.itemText, seasonSelect[idx] === 1 && styles.selectedText]}>
                {season.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: 'white', marginTop: 32 }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={() => { /* 이전 페이지 이동 */ }}>
              이전으로
            </Button>
          }
          rightButton={
            <Button display="block" type="primary" onPress={() => { /* 다음 페이지 이동 */ }}>
              다음으로
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}

const CARD_WIDTH = 148;
const CARD_HEIGHT = 148;
const CARD_RADIUS = 16;
const CARD_GAP = 16;

const styles = StyleSheet.create({
  header: {
    marginTop: 32,
    marginBottom: 18,
    marginHorizontal: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: CARD_GAP,
    marginHorizontal: 24,
  },
  gridItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: '#F2F3F7',
    backgroundColor: '#FAFAFB',
    alignItems: 'center',
    justifyContent: 'center',
    margin: CARD_GAP / 2,
  },
  selectedGridItem: {
    backgroundColor: 'rgba(195,245,80,0.2)',
    borderColor: '#D7F940',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F2F3F7',
  },
  selectedIconBox: {
    backgroundColor: '#fff',
    borderColor: '#D7F940',
  },
  icon: {
    fontSize: 36,
    color: '#D2D2D2',
  },
  selectedIcon: {
    color: '#B6E014',
  },
  itemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
    marginTop: 2,
  },
  selectedText: {
    color: '#222',
    fontWeight: '500',
  },
});