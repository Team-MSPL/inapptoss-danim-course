import React from "react";
import { Stack } from "react-native-bedrock";
import { colors, StepperRow, Text } from "@toss-design-system/react-native";
import { View } from "react-native";
import { WEEKDAYS } from "./constants";
import moment from "moment";

type TimetableItem = {
    name: string;
    takenTime: number;
};

type PresetDayCardProps = {
    item: TimetableItem[];
    index: number;
    day: string[];
    handleItemLayout: (e: any, idx: number) => void;
};


export function PresetDayCard({ item, index, day, handleItemLayout }: PresetDayCardProps) {
    const isLast = index === day.length - 1;
    return (
        <Stack.Vertical
            style={{
                position: "relative",
                borderWidth: 1,
                borderColor: "#eeeeee",
                borderRadius: 13,
                paddingHorizontal: 24,
                paddingVertical: 20,
                marginTop: 10,
                marginBottom: isLast ? 155 : 20,
                marginHorizontal: 24,
            }}
            onLayout={e => handleItemLayout(e, index)}
        >
            <Text typography="t5" fontWeight="medium" color={colors.blue700}>
                {moment(day[index]).format("YY-MM-DD") + " "}({WEEKDAYS[moment(day[index]).days()]})
            </Text>
            <View style={{ height: 20 }} />
            {item?.map((value, idx) => (
                <StepperRow
                    key={idx}
                    hideLine={idx === item.length - 1}
                    left={<StepperRow.NumberIcon number={idx + 1} />}
                    center={
                        <StepperRow.Texts
                            type="A"
                            title={value.name + " "}
                            description={
                                !value.name.includes("추천")
                                    ? Math.floor(value.takenTime / 60) !== 0
                                        ? `${Math.floor(value.takenTime / 60)}시간${value.takenTime % 60 !== 0 ? `${value.takenTime % 60}분` : ""}`
                                        : ""
                                    : ""
                            }
                        />
                    }
                />
            ))}
        </Stack.Vertical>
    );
}