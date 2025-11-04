import React from 'react';
import {Text, View} from 'react-native';
import {createRoute} from '@granite-js/react-native';

export const Route = createRoute('/reservation/detail', {
  validateParams: (params) => params,
  component: ReservationDetail,
});

function ReservationDetail() {
  return (
    <View>
      <Text>Hello ReservationDetail</Text>
    </View>
  );
}
