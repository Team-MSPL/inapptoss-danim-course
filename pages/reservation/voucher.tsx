import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/reservation/voucher', {
  validateParams: (params) => params,
  component: ReservationVoucher,
});

function ReservationVoucher() {
  return (
    <View>
      <Text>Hello ReservationVoucher</Text>
    </View>
  );
}
