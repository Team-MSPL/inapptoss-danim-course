import {FixedBottomCTAProvider, Text} from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import {BedrockRoute} from "react-native-bedrock";
import NavigationBar from "../../components/navigation-bar";
import {CustomProgressBarJoin} from "../../components/join/custom-progress-bar-join";

export const Route = BedrockRoute('/join/who', {
  validateParams: (params) => params,
  component: JoinWho,
});

export default function JoinWho() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <CustomProgressBarJoin currentIndex={1}/>
        <Text>누구랑 여행갈겨?</Text>
      </FixedBottomCTAProvider>
    </View>
  );
}