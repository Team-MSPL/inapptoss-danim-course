import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import MainHome from "./main/main-home";
import MainTrip from "./main/main-trip";
import MainInfo from "./main/main-info";
import MainCountrySelection from "./main/country-selection";
import CustomBottomBar from "../components/main/custom-bottom-bar";
import { useTopNavigation } from "@apps-in-toss/framework";
import { useNavigation } from "@granite-js/react-native";
import { useRegionModeStore } from "../zustand/modeStore";
import MyReservation from "./info/my-reservation";
import { useMainTabStore } from "../zustand/mainTabStore";

export default function Main() {
  const tab = useMainTabStore((s) => s.tab);
  const setTab = useMainTabStore((s) => s.setTab);
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
        return <MyReservation />;
      case 3:
        return <MainCountrySelection />;
      case 4:
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