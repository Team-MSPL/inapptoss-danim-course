import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { useRoute } from '@granite-js/native/@react-navigation/native';
import MainTravelShop from "./main-travel-shop";

export const Route = createRoute('/main/travel-shop-screen', {
  validateParams: (params) => params,
  component: MainTravelShopScreen,
});

export default function MainTravelShopScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const params = (route as any).params ?? {};
  const initialCountry: string | null = params.country ?? null;

  useEffect(() => {
    if (!initialCountry) {
      // navigation.navigate("/country/select");
    }
  }, [initialCountry]);

  return (
    <View style={{ flex: 1 }}>
      <MainTravelShop initialCountry={initialCountry} />
    </View>
  );
}