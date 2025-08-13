import React from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";

export const Route = BedrockRoute("/enroll/essential", {
  validateParams: (params) => params,
  component: Essential,
});

function Essential() {
  return (
    <View>
      <Text>Hello Essential</Text>
    </View>
  );
}
