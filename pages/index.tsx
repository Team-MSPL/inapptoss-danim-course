import React from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { Button } from "@toss-design-system/react-native";
export const Route = BedrockRoute("/", {
  validateParams: (params) => params,
  component: Index,
});
const handlePress = async () => {
  const data = await fetch("http://3.37.54.226/manageNetwork/ping");
  const json = await data.json();
  console.log(json);
};
export function Index() {
  return (
    <View>
      <Text>Hello Index</Text>
      <Button onPress={() => handlePress()}>버튼</Button>
    </View>
  );
}
