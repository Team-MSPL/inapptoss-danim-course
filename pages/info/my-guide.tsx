import { Text } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/info/my-guide', {
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
