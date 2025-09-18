import { Text } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import {BedrockRoute} from "react-native-bedrock";
import MyGuide from "./my-guide";

export const Route = BedrockRoute('/info/my-reservation', {
  validateParams: (params) => params,
  component: MyReservation,
});

export default function MyReservation() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text>내예약</Text>
    </View>
  );
}
