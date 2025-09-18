import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, Text, FlatList } from 'react-native';
import { BottomSheet, colors } from '@toss-design-system/react-native';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

function CustomWheelPicker({ data, selectedIndex, onSelect }) {
  const listRef = useRef(null);
  const [scrollingIndex, setScrollingIndex] = useState(selectedIndex);

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    let index = Math.round(y / ITEM_HEIGHT);
    if (index < 0) index = 0;
    if (index >= data.length) index = data.length - 1;
    setScrollingIndex(index);
  };

  const handleScrollEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    let index = Math.round(y / ITEM_HEIGHT);
    if (index < 0) index = 0;
    if (index >= data.length) index = data.length - 1;
    onSelect(index);
    setScrollingIndex(index);
  };

  useEffect(() => {
    setScrollingIndex(selectedIndex);
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 10);
  }, [selectedIndex, data]);

  const paddingCount = Math.floor((VISIBLE_ITEMS - 1) / 2);

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(_, index) => index.toString()}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={handleScrollEnd}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      contentContainerStyle={{
        paddingTop: ITEM_HEIGHT * paddingCount,
        paddingBottom: ITEM_HEIGHT * paddingCount,
      }}
      style={styles.list}
      renderItem={({ item, index }) => (
        <View style={[styles.item, index === scrollingIndex && styles.selectedItem]}>
          <Text style={[styles.itemText, index === scrollingIndex && styles.selectedItemText]}>
            {item}
          </Text>
        </View>
      )}
    />
  );
}

const AMPM = ['오전', '오후'];
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function getHourOptions(ampm) {
  return ampm === '오전'
    ? Array.from({ length: 12 }, (_, i) => String(i).padStart(2, '0')) // ["00", ..., "11"]
    : Array.from({ length: 12 }, (_, i) => String(i + 12)); // ["12", ..., "23"]
}

export default function DatePickerModal({
  visible,
  onClose,
  header = '',
  hour = '07',
  ampm = '오후',
  minute = '00',
  onConfirm,
}) {
  const ampmIdx = AMPM.findIndex((v) => v === ampm);
  const [selectedAmpmIdx, setSelectedAmpmIdx] = useState(ampmIdx);
  const [selectedHourIdx, setSelectedHourIdx] = useState(0);
  const [selectedMinuteIdx, setSelectedMinuteIdx] = useState(0);

  // 오전/오후에 따라 시간 옵션 생성
  const hourOptions = getHourOptions(AMPM[selectedAmpmIdx]);

  // visible이 바뀔 때, 초기 상태 설정
  useEffect(() => {
    setSelectedAmpmIdx(ampmIdx);
    // hour가 새 hourOptions에 있으면 그 인덱스, 아니면 0
    const hourIdx = hourOptions.findIndex((v) => v === String(hour).padStart(2, '0'));
    setSelectedHourIdx(hourIdx !== -1 ? hourIdx : 0);

    const minuteIdx = MINUTES.findIndex((v) => v === String(minute).padStart(2, '0'));
    setSelectedMinuteIdx(minuteIdx !== -1 ? minuteIdx : 0);
  }, [visible, ampmIdx, hour, minute]); // visible 바뀔 때만 초기화

  // 오전/오후 바뀔 때 시간 인덱스 변환(예: 09시→21시)
  useEffect(() => {
    // 현재 선택된 시간값
    const prevHour = getHourOptions(AMPM[selectedAmpmIdx === 0 ? 1 : 0])[selectedHourIdx];
    // 새 옵션에 동일한 값이 있으면 매핑, 없으면 0
    const newHourIdx = hourOptions.findIndex((v) => v === prevHour);
    setSelectedHourIdx(newHourIdx !== -1 ? newHourIdx : 0);
  }, [selectedAmpmIdx]); // 오전/오후만 바뀔 때 실행

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        ampm: AMPM[selectedAmpmIdx],
        hour: hourOptions[selectedHourIdx],
        minute: MINUTES[selectedMinuteIdx],
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} transparent>
      <View style={styles.modalBg}>
        <View style={styles.container}>
          <BottomSheet.Header>{header}</BottomSheet.Header>
          <View style={styles.pickerRow}>
            <View style={styles.centerGuideBox} pointerEvents="none" />
            <CustomWheelPicker
              data={AMPM}
              selectedIndex={selectedAmpmIdx}
              onSelect={setSelectedAmpmIdx}
            />
            <CustomWheelPicker
              data={hourOptions}
              selectedIndex={selectedHourIdx}
              onSelect={setSelectedHourIdx}
            />
            <CustomWheelPicker
              data={MINUTES}
              selectedIndex={selectedMinuteIdx}
              onSelect={setSelectedMinuteIdx}
            />
          </View>
          <BottomSheet.CTA onPress={handleConfirm}>선택완료</BottomSheet.CTA>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 340,
    paddingBottom: 14,
    paddingTop: 28,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
    gap: 12,
    position: 'relative',
  },
  list: {
    width: 90,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 22,
    color: colors.grey300,
    fontWeight: 'normal',
  },
  selectedItem: {},
  selectedItemText: {
    fontSize: 24,
    color: colors.grey800,
    fontWeight: 'normal',
  },
  centerGuideBox: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor((VISIBLE_ITEMS - 1) / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#001743',
    opacity: 0.02,
    borderRadius: 12,
    zIndex: -1,
  },
});
