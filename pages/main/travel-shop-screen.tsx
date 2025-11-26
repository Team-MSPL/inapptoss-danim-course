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

  // route.params may be undefined depending on navigation implementation.
  const params = (route as any).params ?? {};
  const initialCountry: string | null = params.country ?? null;

  useEffect(() => {
    // If no initialCountry was passed, optionally navigate back to country selection
    // or handle it gracefully inside MainTravelShop.
    if (!initialCountry) {
      // navigation.navigate("/country/select"); // optional
    }
  }, [initialCountry]);

  return (
    <View style={{ flex: 1 }}>
      {/* Reuse your MainTravelShop component, passing the initialCountry prop */}
      <MainTravelShop initialCountry={initialCountry} />
    </View>
  );
}