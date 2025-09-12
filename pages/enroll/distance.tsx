import { colors, Slider, Text } from "@toss-design-system/react-native";
import React, { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import CustomMapView from "../../components/map-view";
import { cityViewList } from "../../utill/city-list";
import { useAppSelector } from "store";

type EnrollDistanceProps = {
    contentRatio?: number;
};

export const Route = BedrockRoute("/enroll/distance", {
    validateParams: (params) => params,
    component: EnrollDistance,
});

const ZOOM_STEP = 0.275;

function getZoomByValue(value) {
    return 12.5 - (value - 1) * ZOOM_STEP;
}

export function EnrollDistance({ contentRatio = 1 }: EnrollDistanceProps) {
    const [value, setValue] = useState(5);
    const { country, cityIndex, cityDistance } = useAppSelector(
        (state) => state.travelSlice
    );

    const lat = cityViewList[country][cityIndex].sub[cityDistance[0]].lat;
    const lng = cityViewList[country][cityIndex].sub[cityDistance[0]].lng;

    return (
        <View style={{ marginHorizontal: 24, justifyContent: 'center' }}>
            <CustomMapView
                lat={lat}
                lng={lng}
                zoom={getZoomByValue(value)} // zoom 계산해서 전달!
                range={value}
                contentRatio={contentRatio}
            />
            <Slider
                value={value}
                onChange={setValue}
                min={1}
                max={10}
                step={1}
                color={colors.green300}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text typography="t5" fontWeight="medium" color={colors.grey700}>
                    내 근처
                </Text>
                <Text typography="t5" fontWeight="medium" color={colors.grey700}>
                    전체
                </Text>
            </View>
        </View>
    );
}