import React, { useState } from 'react';
import {Dimensions, TouchableOpacity, View, Image, StyleSheet} from 'react-native';
import HomeScreen from './main/HomeScreen';
import MyTripScreen from './main/MyTripScreen';
import TravelShopScreen from './main/TravelShopScreen';
import MyInfoScreen from './main/MyInfoScreen';
import CustomBottomBar from '../components/main/CustomBottomBar';

export default function MainScreen() {
  const [tab, setTab] = useState(0);

  const renderScreen = () => {
    switch (tab) {
      case 0:
        return <HomeScreen />;
      case 1:
        return <MyTripScreen />;
      case 2:
        return <TravelShopScreen />;
      case 3:
        return <MyInfoScreen />;
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