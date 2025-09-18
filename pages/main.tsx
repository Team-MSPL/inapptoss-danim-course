import React, { useState } from 'react';
import {Dimensions, TouchableOpacity, View, Image, StyleSheet} from 'react-native';
import MainHome from './main/main-home';
import MainTrip from './main/main-trip';
import MainTravelShop from './main/main-travel-shop';
import MainInfo from './main/main-info';
import CustomBottomBar from '../components/main/custom-bottom-bar';

export default function Main() {
  const [tab, setTab] = useState(0);

  const renderScreen = () => {
    switch (tab) {
      case 0:
        return <MainHome />;
      case 1:
        return <MainTrip />;
      case 2:
        return <MainTravelShop />;
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
  container: { flex: 1, backgroundColor: '#f8f8f8' },
});