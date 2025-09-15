import React, { useState } from "react";
import { Stack } from "react-native-bedrock";
import { TimetableDay, TimetableState } from "./type";
import { View, Text, TouchableOpacity } from "react-native";
import { Badge, colors, ListRow, Icon } from "@toss-design-system/react-native";
import { categoryColor, categoryTitle } from "./constants";
import { EditTooltip } from "./EditTooltip";

type DayListProps = {
    dayItems: TimetableDay;
    dayIndex: number;
    modify: boolean;
    tooltips: { day: number; index: number; status: boolean };
    setTooltips: React.Dispatch<React.SetStateAction<{ day: number; index: number; status: boolean }>>;
    copyTimetable: TimetableState;
    navigation: any;
    showHourBottomSheet: () => void;
    handleRemoveCheck: () => void;
    setCopyTimetable: React.Dispatch<React.SetStateAction<TimetableState>>;
    setModify: React.Dispatch<React.SetStateAction<boolean>>;
    onLayout?: (e: any) => void;
};

function getTimeDiffText(prev, next) {
    const prevEndMinutes = ((prev.y ?? 0) + prev.takenTime / 30) * 30 + 360;
    const nextStartMinutes = (next.y ?? 0) * 30 + 360;
    let diff = nextStartMinutes - prevEndMinutes;
    if (diff <= 0) return ""; // 이동시간이 음수면 표시 안 함

    const hour = Math.floor(diff / 60);
    const min = diff % 60;
    return `${hour > 0 ? `${hour}시간` : ""}${min > 0 ? ` ${min}분` : ""}`.trim();
}

export function DayList({
                            dayItems, dayIndex, modify, tooltips, setTooltips,
                            copyTimetable, navigation, showHourBottomSheet, handleRemoveCheck,
                            setCopyTimetable, setModify, onLayout
                        }: DayListProps) {
    // 순서 변경 모드 여부
    const [isReorderMode, setIsReorderMode] = useState(false);

    return (
        <Stack.Vertical
            style={{
                position: "relative",
                borderRadius: 13,
                paddingVertical: 20,
                marginTop: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.grey200,
            }}
            onLayout={onLayout}
        >
            {dayItems.map((value, idx) => (
                <View key={idx} style={{ position: "relative" }}>
                    <TouchableOpacity
                        onPress={() => {
                            // 편집 모드: 툴팁 열기
                            setTooltips({ day: dayIndex, index: idx, status: !tooltips.status });
                        }}
                        onLongPress={() => {
                            // 순서 변경 모드 토글 (꾹 누르면 켜고, 또 꾹 누르면 끔)
                            if (modify) setIsReorderMode(prev => !prev);
                        }}
                    >
                        <ListRow
                            left={
                                !value?.name?.includes("추천") ? (
                                    <ListRow.Icon
                                        name={`icon-number-${
                                            dayItems.filter(fil => !fil.name?.includes("추천"))
                                                .findIndex(find => find.name === value?.name) + 1
                                        }-square`}
                                    />
                                ) : (
                                    <ListRow.Icon name="icon-number--1-squar" />
                                )
                            }
                            contents={
                                <ListRow.Texts
                                    type="2RowTypeF"
                                    top={
                                        `${Math.floor(((value.y ?? 0) * 30 + 360) / 60)}:` +
                                        `${String(((value.y ?? 0) * 30 + 360) % 60).padStart(2, "0")}` +
                                        " ~ " +
                                        (Math.floor((((value.y ?? 0) + value.takenTime / 30) * 30 + 360) / 60) < 25
                                            ? `${Math.floor((((value.y ?? 0) + value.takenTime / 30) * 30 + 360) / 60)}:` +
                                            `${String((((value.y ?? 0) + value.takenTime / 30) * 30 + 360) % 60).padStart(2, "0")}`
                                            : "")
                                    }
                                    bottom={value?.name}
                                    topProps={{ color: colors.grey500 }}
                                    bottomProps={{ color: colors.grey800 }}
                                />
                            }
                            right={
                                modify ? (
                                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                        <ListRow.Icon name={isReorderMode ? "icon-arrow-up-down" : "icon-dots-mono"} />
                                    </View>
                                ) : (
                                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                        <Badge
                                            size="small"
                                            badgeStyle="weak"
                                            type={categoryColor[value?.category ?? 0]}
                                        >
                                            {categoryTitle[value?.category ?? 0] ?? ""}
                                        </Badge>
                                    </View>
                                )
                            }
                        />
                    </TouchableOpacity>
                    {tooltips.status && tooltips.day === dayIndex && tooltips.index === idx && (
                        <EditTooltip
                            showHourBottomSheet={showHourBottomSheet}
                            handleRemoveCheck={handleRemoveCheck}
                        />
                    )}
                    {!modify && idx < dayItems.length - 1 && (
                        (() => {
                            const moveText = getTimeDiffText(dayItems[idx], dayItems[idx + 1]);
                            if (!moveText) return null;
                            return (
                                <ListRow
                                    left={
                                        <View style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingLeft: 10,
                                        }}>
                                            <Icon name="icon-car-mono" color={colors.grey500} size={16} />
                                            <Text style={{
                                                marginLeft: 15,
                                                color: colors.grey500,
                                                fontSize: 16,
                                                fontWeight: "400",
                                            }}>
                                                {moveText}
                                            </Text>
                                        </View>
                                    }
                                />
                            );
                        })()
                    )}
                    {modify && value?.category !== 4 && (
                        <ListRow
                            onPress={() => {
                                navigation.navigate("/add-place", {
                                    day: dayIndex, index: idx, data: copyTimetable, setCopyTimetable,
                                });
                            }}
                            left={<ListRow.Icon name="icon-plus-circle-blue" />}
                            contents={
                                <ListRow.Texts
                                    type="1RowTypeA"
                                    top="일정 추가하기"
                                    topProps={{ color: colors.grey800 }}
                                />
                            }
                        />
                    )}
                </View>
            ))}
        </Stack.Vertical>
    );
}