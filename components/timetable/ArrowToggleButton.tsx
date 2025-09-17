import React from "react";
import { TouchableOpacity, View } from "react-native";
import {colors} from "@toss-design-system/react-native";

export default function ArrowToggleButton({
                                              expanded,
                                              onPress,
                                          }: {
    expanded: boolean;
    onPress: () => void;
}) {
    const ARROW_COLOR = colors.grey200;
    const ARROW_WIDTH = 50;
    const ARROW_HEIGHT = 10.25;
    const STROKE_WIDTH = 2;

    const arrowTransform = expanded ? [] : [{ scaleY: -1 }];

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.4}
            style={{
                width: ARROW_WIDTH,
                height: ARROW_HEIGHT + 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
            }}
        >
            <View
                style={{
                    width: ARROW_WIDTH,
                    height: ARROW_HEIGHT,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: arrowTransform,
                }}
            >
                <View
                    style={{
                        width: ARROW_WIDTH / 2 + 2,
                        height: STROKE_WIDTH,
                        backgroundColor: ARROW_COLOR,
                        borderRadius: STROKE_WIDTH,
                        transform: [{ rotate: "-20deg" }],
                        position: "absolute",
                        left: 0,
                        top: (ARROW_HEIGHT - STROKE_WIDTH) / 2,
                        marginRight: -6,
                    }}
                />
                {/* 오른쪽 대각선 */}
                <View
                    style={{
                        width: ARROW_WIDTH / 2 + 2,
                        height: STROKE_WIDTH,
                        backgroundColor: ARROW_COLOR,
                        borderRadius: STROKE_WIDTH,
                        transform: [{ rotate: "20deg" }],
                        position: "absolute",
                        right: 0,
                        top: (ARROW_HEIGHT - STROKE_WIDTH) / 2,
                        marginLeft: -6,
                    }}
                />
            </View>
        </TouchableOpacity>
    );
}