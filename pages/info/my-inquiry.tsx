import { Text } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import {BedrockRoute} from "react-native-bedrock";
import MyGuide from "./my-guide";

export const Route = BedrockRoute('/info/my-inquiry', {
  validateParams: (params) => params,
  component: MyInquiry,
});

export default function MyInquiry() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>문의하기</Text>
    </View>
  );
}