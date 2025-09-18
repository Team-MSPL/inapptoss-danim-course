import React from 'react';
import { Text, View } from 'react-native';
import { BedrockRoute } from 'react-native-bedrock';
import {PartnerNavigation} from "@toss-design-system/react-native";

export const Route = BedrockRoute('/info/one-on-one-inquiry', {
  validateParams: (params) => params,
  component: InfoOneOnOneInquiry,
});

function InfoOneOnOneInquiry() {
  return (
    <View>
      <PartnerNavigation
        title="다님"
        icon={{
          source: {
            uri: 'https://static.toss.im/appsintoss/561/454aa293-9dc9-4c77-9662-c42d09255859.png',
          },
        }}
      ></PartnerNavigation>
      <Text>Hello InfoOneOnOneInquiry</Text>
    </View>
  );
}
