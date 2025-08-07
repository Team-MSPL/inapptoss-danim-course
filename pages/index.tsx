import React from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";

export const Route = BedrockRoute("/", {
  validateParams: (params) => params,
  component: Index,
});

export function Index() {
  return (
    <View>
      <Text>Hello Index</Text>
    </View>
  );
}
