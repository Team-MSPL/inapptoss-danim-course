import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import MainHome from "./main/main-home";
import MainTrip from "./main/main-trip";
import MainInfo from "./main/main-info";
import MainCountrySelection from "./main/country-selection";
import CustomBottomBar from "../components/main/custom-bottom-bar";
import { useTopNavigation } from "@apps-in-toss/framework";
import { useNavigation } from "@granite-js/react-native";
import { useRegionModeStore } from "../zustand/modeStore";

/**
 * Main
 *
 * Behavior change:
 * - For tab index 2 we now show the country selection screen (CountrySelection).
 * - When the user picks a country, CountrySelection navigates to '/travel/shop' (a separate screen),
 *   so the product-list view is shown on a different route, not inside the Main tab content.
 *
 * Note:
 * - Ensure the route '/travel/shop' is registered in your app's router and points to TravelShopScreen.
 * - If you prefer to register '/country/select' and navigate there instead, adjust CountrySelection accordingly.
 */

export default function Main() {
  const [tab, setTab] = useState(0);
  const navigation = useNavigation();
  const { addAccessoryButton } = useTopNavigation();

  useEffect(() => {
    addAccessoryButton({
      title: "letter",
      icon: {
        name: "icon-letter-mono",
      },
      id: "letter",
      onPress: () => {
        setTab(3);
        navigation.navigate("/info/my-inquiry-list");
      },
    });
    useRegionModeStore.getState().setRegionMode("enroll");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderScreen = () => {
    switch (tab) {
      case 0:
        return <MainHome />;
      case 1:
        return <MainTrip />;
      case 2:
        // show country selection in main tab; selection navigates to a different route
        return <MainCountrySelection />;
      case 3:
        return <MainInfo />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      <CustomBottomBar currentIndex={tab} onTabPress={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
});