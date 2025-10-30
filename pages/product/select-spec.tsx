import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/product/select-spec', {
  validateParams: (params) => params,
  component: ProductSelectSpec,
});

function ProductSelectSpec() {
  return (
    <View>
      <Text>Hello ProductSelectSpec</Text>
    </View>
  );
}
