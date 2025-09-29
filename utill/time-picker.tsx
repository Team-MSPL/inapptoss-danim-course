import { FlatList } from 'react-native';
import { colors, Text } from '@toss-design-system/react-native';
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  InteractionManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
// export default function TimePickerModal({
//   visible,
//   minuteDivide,
//   hour,
//   minute,
// })

const TimePickerModal = forwardRef(({ visible, minuteDivide, hour, minute }, ref) => {
  const [ampmIndex, setAmpmIndex] = useState(0);
  const [hourIndex, setHourIndex] = useState(8); // default: 9시
  const [minuteIndex, setMinuteIndex] = useState(0);
  const ITEM_HEIGHT = 40;
  useImperativeHandle(ref, () => ({
    // 부모 컴포넌트에서 사용할 함수를 선언
    handleTime,
  }));
  const handleTime = () => {
    return {
      ampm: ampmList[ampmIndex],
      hour: hours[hourIndex],
      minute: minutes[minuteIndex],
    };
  };
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: minuteDivide ? 2 : 60 }, (_, i) =>
    minuteDivide ? i * 30 : i.toString().padStart(2, '0'),
  );
  const ampmList = ['오전', '오후'];
  const flatListRef = {
    ampm: useRef(null),
    hour: useRef(null),
    minute: useRef(null),
  };

  const onScrollEnd =
    (type: 'ampm' | 'hour' | 'minute') => (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);

      if (type === 'ampm') setAmpmIndex(index);
      if (type === 'hour') setHourIndex(index);
      if (type === 'minute') setMinuteIndex(index);
    };

  useEffect(() => {
    setAmpmIndex(Math.floor(hour / 12));
    setHourIndex(hour == 0 ? 11 : (hour - 1) % 12);
    setMinuteIndex(minuteDivide ? minute / 30 : minute);
  }, [minute, hour]);

  useEffect(() => {
    if (visible) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          flatListRef.hour.current?.scrollToOffset({
            offset: hourIndex * ITEM_HEIGHT,
            animated: false,
          });
          flatListRef.minute.current?.scrollToOffset({
            offset: minuteIndex * ITEM_HEIGHT,
            animated: false,
          });
          flatListRef.ampm.current?.scrollToOffset({
            offset: ampmIndex * ITEM_HEIGHT,
            animated: false,
          });
        }, 50);
      });
    }
  }, [visible, hourIndex, minuteIndex, ampmIndex]);

  const renderPickerItem = (item, index, selected) => (
    <Pressable style={[styles.pickerItem, { height: ITEM_HEIGHT }]}>
      <Text typography="st5" color={selected ? colors.black : '#aaa'} fontWeight="medium">
        {item}
      </Text>
    </Pressable>
  );

  return (
    <>
      <View style={styles.pickerContainer}>
        {/* AMPM */}
        <FlatList
          ref={flatListRef.ampm}
          data={ampmList}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          onMomentumScrollEnd={onScrollEnd('ampm')}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          renderItem={({ item, index }) => renderPickerItem(item, index, index === ampmIndex)}
        />
        {/* Hour */}
        <FlatList
          ref={flatListRef.hour}
          data={hours}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          onMomentumScrollEnd={onScrollEnd('hour')}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          initialNumToRender={20}
          renderItem={({ item, index }) => renderPickerItem(item, index, index === hourIndex)}
        />
        {/* Minute */}
        <FlatList
          ref={flatListRef.minute}
          data={minutes}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          onMomentumScrollEnd={onScrollEnd('minute')}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          initialNumToRender={60}
          renderItem={({ item, index }) => renderPickerItem(item, index, index === minuteIndex)}
        />
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 200,
    marginBottom: 20,
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default TimePickerModal;
