import { colors, Slider, Text } from "@toss-design-system/react-native";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { BedrockRoute, Image } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../../redux/travle-slice";
import { RouteButton } from "../../components/route-button";

export const Route = BedrockRoute("/enroll/popular", {
  validateParams: (params) => params,
  component: EnrollPopular,
});

export function EnrollPopular() {
  const { popular } = useAppSelector((state) => state.travelSlice);
  const dispatch = useAppDispatch();
  const handlePopular = (e: number) => {
    // dispatch(travelSliceActions.updateFiled({ field: "popular", value: e }));
    dispatch(travelSliceActions.updatePopluar(e));
  };
  const [value, setValue] = useState(popular);
  const imageList = [
    "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2Fasd.png?alt=media&token=3df1ca25-0ab7-4289-aec1-268172db19be",
    "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F2.png?alt=media&token=a99b1cc7-2885-4051-8624-228f5e374de6",
    "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F3.png?alt=media&token=cc71b542-6c97-4e91-b935-2fc9da9842fe",
    "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F4.png?alt=media&token=4d270043-8980-4846-bd17-cdd9a4a5df12",
    "https://firebasestorage.googleapis.com/v0/b/danim-image/o/popular%2F5.png?alt=media&token=4952eea8-3f5c-44f6-bfca-45906ff9cc0c",
  ];

  return (
    <View style={{ marginHorizontal: 24 }}>
      <Image
        key={Math.ceil(value / 2)}
        source={{ uri: imageList[Math.ceil(value / 2) - 1] }}
        style={{ width: 300, height: 300, alignSelf: "center" }}
      ></Image>

      <Text>인기도: {value}</Text>
      <Slider
        value={value}
        onChange={(e) => {
          setValue(e);
        }}
        min={1}
        max={10}
        step={1}
        color={colors.green300}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 덜 알려진
        </Text>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 유명한
        </Text>
      </View>
      <RouteButton
        onPress={() => {
          dispatch(travelSliceActions.updatePopluar(value));
        }}
      />
    </View>
  );
}
