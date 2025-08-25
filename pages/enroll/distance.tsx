import { colors, Slider, Text } from "@toss-design-system/react-native";
import React, { useState } from "react";
import { View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";

export const Route = BedrockRoute("/enroll/distance", {
  validateParams: (params) => params,
  component: EnrollDistance,
});

function EnrollDistance() {
  const [value, setValue] = useState();
  return (
    <>
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
          가장 덜 알려진
        </Text>
        <Text typography="t5" fontWeight="medium" color={colors.grey700}>
          가장 유명한
        </Text>
      </View>
    </>
  );
}
