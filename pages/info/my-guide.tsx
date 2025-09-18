import { Text } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import {BedrockRoute} from "react-native-bedrock";

export const Route = BedrockRoute('/info/my-guide', {
  validateParams: (params) => params,
  component: MyGuide,
});

export default function MyGuide() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>이용 안내</Text>
    </View>
  );
}