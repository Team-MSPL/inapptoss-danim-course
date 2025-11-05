import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/reservation/cancel-fail', {
  validateParams: (params) => params,
  component: ReservationCancelFail,
});

function ReservationCancelFail() {
  return (
    <View>
      <Text>Hello ReservationCancelFail</Text>
    </View>
  );
}
