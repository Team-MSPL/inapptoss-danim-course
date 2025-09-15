import { Stack } from "react-native-bedrock";
import { TimetableDay, TimetableState } from "./type";
import { View } from "react-native";
import { Badge, colors, ListRow } from "@toss-design-system/react-native";
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
    showTooltip?: boolean;
};

export function DayList({
                            dayItems, dayIndex, modify, tooltips, setTooltips,
                            copyTimetable, navigation, showHourBottomSheet, handleRemoveCheck,
                            setCopyTimetable, setModify
                        }: DayListProps) {
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
        >
            {dayItems.map((value, idx) => (
                <View key={idx} style={{ position: "relative" }}>
                    <ListRow
                        onPress={() => {
                            if (!modify && value?.name?.includes("추천")) {
                                navigation.navigate("/recommend-place", {
                                    data: copyTimetable, day: dayIndex, index: idx,
                                    setCopyTimetable, setModify,
                                });
                            } else {
                                setTooltips({ day: dayIndex, index: idx, status: !tooltips.status });
                            }
                        }}
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
                                type="2RowTypeA"
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
                                topProps={{ color: colors.grey800 }}
                                bottomProps={{ color: colors.grey600 }}
                            />
                        }
                        right={
                            modify ? (
                                <ListRow.Icon name="icon-dots-mono" />
                            ) : (
                                <Badge
                                    size="small"
                                    badgeStyle="weak"
                                    type={categoryColor[value?.category ?? 0]}
                                >
                                    {categoryTitle[value?.category ?? 0] ?? ""}
                                </Badge>
                            )
                        }
                    />
                    {tooltips.status && tooltips.day === dayIndex && tooltips.index === idx && (
                        <EditTooltip
                            showHourBottomSheet={showHourBottomSheet}
                            handleRemoveCheck={handleRemoveCheck}
                        />
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