import React from 'react';
import {Text, View} from 'react-native';
import {createRoute} from '@granite-js/react-native';

export const Route = createRoute('/product/pay-fail', {
  validateParams: (params) => params,
  component: ProductPayFail,
});

function ProductPayFail() {
  return (
    <View>
      <Text>Hello ProductPayFail</Text>
    </View>
  );
}
