import React, {useEffect, useState} from 'react';
import { View, StyleSheet } from 'react-native';
import MainHome from './main/main-home';
import MainTrip from './main/main-trip';
import MainTravelShop from './main/main-travel-shop';
import MainInfo from './main/main-info';
import CustomBottomBar from '../components/main/custom-bottom-bar';
import {useTopNavigation} from "@apps-in-toss/framework";
import {useNavigation} from "@granite-js/react-native";

export default function Main() {
  const [tab, setTab] = useState(0);
  const navigation = useNavigation();
  const { addAccessoryButton } = useTopNavigation();
  useEffect(() => {
    addAccessoryButton({
      title: 'letter',
      icon: {
        name: 'icon-letter-mono',
      },
      id: 'letter',
      onPress: () => {
        setTab(3);
        navigation.navigate('/info/my-inquiry-list')
      }, // 콜백함수 등록
    });
  }, [navigation]);

  const renderScreen = () => {
    switch (tab) {
      case 0:
        return <MainHome />;
      case 1:
        return <MainTrip />;
      // case 2:
      //   return <MainTravelShop />;
      case 2:
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
