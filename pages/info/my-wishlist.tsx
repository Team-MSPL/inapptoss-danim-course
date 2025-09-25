import { Text } from '@toss-design-system/react-native';
import React from 'react';
import { View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import MyGuide from './my-guide';

export const Route = createRoute('/info/my-wishlist', {
  validateParams: (params) => params,
  component: MyWishlist,
});

export default function MyWishlist() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>관심 상품</Text>
    </View>
  );
}
