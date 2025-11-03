import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/product/pay-success', {
  validateParams: (params) => params,
  component: ProductPaySuccess,
});

function ProductPaySuccess() {
  return (
    <View>
      <Text>Hello ProductPaySuccess</Text>
    </View>
  );
}
