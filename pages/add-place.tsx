import { SegmentedControl } from "@toss-design-system/react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";

export const Route = BedrockRoute("/add-place", {
  validateParams: (params) => params,
  component: AddPlace,
});

function AddPlace() {
  const params = Route.useParams();
  const [value1, setValue1] = useState("여행지");
  return (
    <View>
      <SegmentedControl.Root
        size={"large"}
        name="segmented"
        value={value1}
        onChange={setValue1}
      >
        <SegmentedControl.Item value="여행지">여행지</SegmentedControl.Item>
        <SegmentedControl.Item value="숙소">숙소</SegmentedControl.Item>
        <SegmentedControl.Item value="식당">식당</SegmentedControl.Item>
        {/* <SegmentedControl.Item value="오늘의커피">오늘의커피</SegmentedControl.Item> */}
      </SegmentedControl.Root>
    </View>
  );
}
