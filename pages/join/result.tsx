import React from 'react';
import { Text, View } from 'react-native';
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/join/result', {
  validateParams: (params) => params,
  component: JoinResult,
});

function JoinResult() {
  return (
    <View>
      <Text>Hello JoinResult</Text>
    </View>
  );
}
