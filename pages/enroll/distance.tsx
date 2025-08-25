import WebView from "@react-native-bedrock/native/react-native-webview";
import { colors, Slider, Text } from "@toss-design-system/react-native";
import React, { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import CustomMapView from "../../components/map-view";
import { cityViewList } from "../../utill/city-list";
import { useAppSelector } from "store";

export const Route = BedrockRoute("/enroll/distance", {
  validateParams: (params) => params,
  component: EnrollDistance,
});

export function EnrollDistance() {
  const [value, setValue] = useState();
  const { country, cityIndex, cityDistance } = useAppSelector(
    (state) => state.travelSlice
  );

  return (
    <View style={{ marginHorizontal: 24 }}>
      <CustomMapView
        lat={cityViewList[country][cityIndex].sub[cityDistance[0]].lat}
        lng={cityViewList[country][cityIndex].sub[cityDistance[0]].lng}
        isWideZoom={cityDistance[0] == 0}
        range={value}
      />
      <Slider
        value={value}
        onChange={(e) => setValue(e)}
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
