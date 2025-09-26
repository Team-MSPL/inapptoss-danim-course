import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useAppSelector } from 'store';
import NavigationBar from '../../components/navigation-bar';
import { createRoute } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';

const LOTTIE_URL = "https://static.toss.im/lotties/loading/load-ripple.json";

export const Route = createRoute('/join/loading', {
  validateParams: (params) => params,
  component: RegionSearchLoading,
});

function RegionSearchLoading() {
  const request = useAppSelector((state) => state.regionSearchSlice.request);

  useEffect(() => {
    // API 호출 예시 (비동기)
    async function fetchData() {
      console.log('지역 추천 요청 정보:', request);
      // 실제 API 호출 후 navigation.navigate('/join/result') 등
    }
    fetchData();
  }, [request]);

  return (
    <View style={styles.container}>
      <NavigationBar />
      <View style={styles.inner}>
        <Text style={styles.title}>
          {'여행자'}님을 위한 여행지역을{'\n'}찾는 중이에요
        </Text>
        <Text style={styles.subtitle}>잠시만 기다려주세요.</Text>
        <View style={{ height: 40 }} />
        <LottieView
          source={{ uri: LOTTIE_URL }}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    marginTop: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#A4AAB3',
    marginTop: 8,
    textAlign: 'center',
  },
  lottie: {
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
});