import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector } from 'store';
import NavigationBar from '../../components/navigation-bar';
import { createRoute } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';
import { StepText } from "../../components/step-text";
import { FixedBottomCTAProvider } from "@toss-design-system/react-native";

const LOTTIE_URL = "https://static.toss.im/lotties/loading/load-ripple.json";

export const Route = createRoute('/join/loading', {
  validateParams: (params) => params,
  component: RegionSearchLoading,
});

function RegionSearchLoading() {
  const request = useAppSelector((state) => state.regionSearchSlice.request);

  useEffect(() => {
    async function fetchData() {
      console.log('지역 추천 요청 정보:', request);
      // 실제 API 호출 후 navigation.navigate('/join/result') 등
    }
    fetchData();
  }, [request]);

  return (
    <View style={styles.container}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <StepText
          title={'나그네님을 위한 여행지역을 \n찾는 중이에요'}
          subTitle1={''}
          subTitle2={'잠시만 기다려주세요.'}
        />
        <View style={styles.inner}>
          <LottieView
            source={{ uri: LOTTIE_URL }}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 60,
  },
  lottie: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 280,
    maxHeight: 280,
  },
});

export default RegionSearchLoading;