import { Text } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import MyGuide from './my-guide';

export const Route = createRoute('/info/my-reservation', {
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
