import React, { useRef, useState, useEffect } from "react";
import { Modal, View, StyleSheet, Text, FlatList } from "react-native";
import { BottomSheet, colors } from "@toss-design-system/react-native";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

function CustomWheelPicker({ data, selectedIndex, onSelect }: {
    data: string[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}) {
    const listRef = useRef<any>(null);
    const [scrollingIndex, setScrollingIndex] = useState(selectedIndex);

    const handleScroll = (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        let index = Math.round(y / ITEM_HEIGHT);
        if (index < 0) index = 0;
        if (index >= data.length) index = data.length - 1;
        setScrollingIndex(index);
    };

    const handleScrollEnd = (e: any) => {
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
                <View style={[
                    styles.item,
                    index === scrollingIndex && styles.selectedItem,
                ]}>
                    <Text style={[
                        styles.itemText,
                        index === scrollingIndex && styles.selectedItemText,
                    ]}>
                        {item}
                    </Text>
                </View>
            )}
        />
    );
}

const AMPM = ["오전", "오후"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i + 1));

export default function DatePickerModal({
                                            visible,
                                            onClose,
                                            header = "",
                                            hour = "7",
                                            minute = "00",
                                            ampm = "오후",
                                            onConfirm,
                                        }) {
    const [ampmIdx, setAmpmIdx] = useState(AMPM.findIndex(v => v === ampm));
    const [hourIdx, setHourIdx] = useState(HOURS.findIndex(v => v === hour));
    const [minuteIdx, setMinuteIdx] = useState(MINUTES.findIndex(v => v === minute));

    useEffect(() => {
        setAmpmIdx(AMPM.findIndex(v => v === ampm));
        setHourIdx(HOURS.findIndex(v => v === hour));
        setMinuteIdx(MINUTES.findIndex(v => v === minute));
    }, [visible, ampm, hour, minute]);

    const handleConfirm = () => {
        if (onConfirm)
            onConfirm({
                ampm: AMPM[ampmIdx] || "오전",
                hour: HOURS[hourIdx] || "7",
                minute: MINUTES[minuteIdx] || "00",
            });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalBg}>
                <View style={styles.container}>
                    <BottomSheet.Header>{header}</BottomSheet.Header>
                    <View style={styles.pickerRow}>
                        <View style={styles.centerGuideBox} pointerEvents="none" />
                        <CustomWheelPicker
                            data={AMPM}
                            selectedIndex={ampmIdx}
                            onSelect={setAmpmIdx}
                        />
                        <CustomWheelPicker
                            data={HOURS}
                            selectedIndex={hourIdx}
                            onSelect={setHourIdx}
                        />
                        <CustomWheelPicker
                            data={MINUTES}
                            selectedIndex={minuteIdx}
                            onSelect={setMinuteIdx}
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
        backgroundColor: "rgba(0,0,0,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: 340,
        paddingBottom: 14,
        paddingTop: 28,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        borderRadius: 30,
        elevation: 4,
    },
    pickerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10,
        width: "100%",
        gap: 12,
        position: "relative",
    },
    list: {
        width: 90,
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    itemText: {
        fontSize: 22,
        color: colors.grey300,
        fontWeight: "normal",
    },
    selectedItem: {},
    selectedItemText: {
        fontSize: 24,
        color: colors.grey800,
        fontWeight: "normal",
    },
    centerGuideBox: {
        position: "absolute",
        top: ITEM_HEIGHT * Math.floor((VISIBLE_ITEMS - 1) / 2),
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: "#001743",
        opacity: 0.02,
        borderRadius: 12,
        zIndex: -1,
    },
});