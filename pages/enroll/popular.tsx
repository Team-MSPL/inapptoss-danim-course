import { colors, Slider, Text } from "@toss-design-system/react-native";
import React, { useState } from "react";
import { View } from "react-native";
import { BedrockRoute, Image } from "react-native-bedrock";

export const Route = BedrockRoute("/enroll/popular", {
  validateParams: (params) => params,
  component: EnrollPopular,
});

function EnrollPopular() {
  const [value, onChange] = useState(5);
  return (
    <View style={{ marginHorizontal: 24 }}>
      <Image
        source={require("../../assets/images/asd.png")}
        style={{ width: 300, height: 300 }}
      ></Image>
      <Slider
        value={value}
        onChange={onChange}
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
    </View>
  );
}
