import React, { useState } from "react";
import { Stack } from "react-native-bedrock";
import { TimetableDay, TimetableState } from "./type";
import { View, Text, TouchableOpacity } from "react-native";
import { Badge, colors, ListRow, Icon } from "@toss-design-system/react-native";
import { categoryColor, categoryTitle } from "./constants";
import { EditTooltip } from "./EditTooltip";
import { MoveTooltip } from "./MoveTooltip";

type DayListProps = {
    dayItems: TimetableDay;
    dayIndex: number;
    modify: boolean;
    setModify: React.Dispatch<React.SetStateAction<boolean>>;
    tooltips: { day: number; index: number; status: boolean };
    setTooltips: React.Dispatch<React.SetStateAction<{ day: number; index: number; status: boolean }>>;
    copyTimetable: TimetableState;
    setCopyTimetable: React.Dispatch<React.SetStateAction<TimetableState>>;
    navigation: any;
    showHourBottomSheet: () => void;
    handleRemoveCheck: () => void;
    onLayout?: (e: any) => void;
};

function getTimeDiffText(prev, next) {
    const prevEndMinutes = ((prev.y ?? 0) * 30 + 360) + prev.takenTime;
    const nextStartMinutes = (next.y ?? 0) * 30 + 360;
    let diff = nextStartMinutes - prevEndMinutes;
    if (diff <= 0) return "";
    const hour = Math.floor(diff / 60);
    const min = diff % 60;
    return `${hour > 0 ? `${hour}시간` : ""}${min > 0 ? ` ${min}분` : ""}`.trim();
}

// 요소별 duration, 뒤와의 gap 추출
function extractTimeMeta(arr: any[]) {
    return arr.map((item, i, array) => {
        const start = (item.y ?? 0) * 30 + 360;
        const end = start + item.takenTime;
        const nextStart = array[i + 1] ? ((array[i + 1].y ?? 0) * 30 + 360) : null;
        const gap = nextStart !== null ? Math.max(nextStart - end, 0) : 0;
        return {
            ...item,
            _origDuration: item.takenTime,
            _origGap: gap
        };
    });
}

// 순서 이동 + 원래 구간 duration, gap 유지
function moveAndAdjustWithGaps(origArr: any[], idx: number, dir: -1 | 1): any[] {
    if (idx + dir < 0 || idx + dir >= origArr.length) return origArr;
    const items = extractTimeMeta(origArr);
    const moved = items.splice(idx, 1)[0];
    items.splice(idx + dir, 0, moved);
    let cur = 360; // 9:00
    const newArr = items.map((item, i) => {
        const newItem = {
            ...item,
            y: Math.floor((cur - 360) / 30),
            takenTime: item._origDuration
        };
        cur += item._origDuration + (item._origGap || 0);
        delete newItem._origDuration;
        delete newItem._origGap;
        return newItem;
    });
    return newArr;
}

export function DayList({
                            dayItems, dayIndex, modify, setModify, tooltips, setTooltips,
                            copyTimetable, setCopyTimetable,
                            navigation, showHourBottomSheet, handleRemoveCheck, onLayout
                        }: DayListProps) {
    // 전체 순서수정모드
    const [isReorderMode, setIsReorderMode] = useState(false);
    // MoveTooltip 활성 인덱스
    const [moveTooltipIdx, setMoveTooltipIdx] = useState<number | null>(null);

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
                            if (modify && isReorderMode) {
                                // 이미 MoveTooltip이 떠 있으면 닫고, 아니면 띄움
                                setMoveTooltipIdx(moveTooltipIdx === idx ? null : idx);
                            } else if (modify && !isReorderMode) {
                                setTooltips({ day: dayIndex, index: idx, status: !tooltips.status });
                            }
                        }}
                        onLongPress={() => {
                            if (modify) {
                                setIsReorderMode(prev => {
                                    if (prev) setMoveTooltipIdx(null);
                                    return !prev;
                                });
                                setTooltips({ day: -1, index: -1, status: false });
                            }
                        }}
                        delayLongPress={250}
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
                                        (Math.floor((((value.y ?? 0) * 30 + 360) + value.takenTime) / 60) < 25
                                            ? `${Math.floor((((value.y ?? 0) * 30 + 360) + value.takenTime) / 60)}:` +
                                            `${String((((value.y ?? 0) * 30 + 360) + value.takenTime) % 60).padStart(2, "0")}`
                                            : "")
                                    }
                                    bottom={value?.name}
                                    topProps={{ color: colors.grey500 }}
                                    bottomProps={{ color: colors.grey800 }}
                                />
                            }
                            right={
                                !modify ? (
                                    // 수정모드 X: Badge만
                                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                        <Badge
                                            size="small"
                                            badgeStyle="weak"
                                            type={categoryColor[value?.category ?? 0]}
                                        >
                                            {categoryTitle[value?.category ?? 0] ?? ""}
                                        </Badge>
                                    </View>
                                ) : isReorderMode ? (
                                    // 순서수정모드: 모든 요소 화살표
                                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                        <ListRow.Icon name="icon-arrow-up-down" />
                                    </View>
                                ) : (
                                    // 일정수정모드: dots
                                    <TouchableOpacity
                                        onPress={() => {
                                            setTooltips({ day: dayIndex, index: idx, status: true });
                                            setMoveTooltipIdx(null);
                                        }}
                                        style={{alignItems: 'center', justifyContent: 'center'}}
                                    >
                                        <ListRow.Icon name="icon-dots-mono" />
                                    </TouchableOpacity>
                                )
                            }
                        />
                    </TouchableOpacity>
                    {/* MoveTooltip: 순서수정모드+해당 요소 누르면 노출 */}
                    {modify && isReorderMode && moveTooltipIdx === idx && (
                        <MoveTooltip
                            onMoveUp={() => {
                                setCopyTimetable(prev => {
                                    const newCopy = [...prev];
                                    newCopy[dayIndex] = moveAndAdjustWithGaps(dayItems, idx, -1);
                                    return newCopy;
                                });
                                setMoveTooltipIdx(null); // 완료시 닫기
                            }}
                            onMoveDown={() => {
                                setCopyTimetable(prev => {
                                    const newCopy = [...prev];
                                    newCopy[dayIndex] = moveAndAdjustWithGaps(dayItems, idx, 1);
                                    return newCopy;
                                });
                                setMoveTooltipIdx(null); // 완료시 닫기
                            }}
                            disableUp={idx === 0}
                            disableDown={idx === dayItems.length - 1}
                        />
                    )}
                    {/* 일정수정모드: EditTooltip */}
                    {modify && !isReorderMode && tooltips.status && tooltips.day === dayIndex && tooltips.index === idx && (
                        <EditTooltip
                            showHourBottomSheet={showHourBottomSheet}
                            handleRemoveCheck={handleRemoveCheck}
                        />
                    )}
                    {/* 일반모드: 이동시간 표시 등 */}
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
                    {/* 일정 추가 버튼 */}
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