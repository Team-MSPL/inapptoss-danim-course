import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';
import { StepText } from '../../components/step-text';
import { FixedBottomCTAProvider } from '@toss-design-system/react-native';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import { postRegionSearch } from '../../zustand/api';

const LOTTIE_URL = "https://static.toss.im/lotties/loading/load-ripple.json";

export const Route = createRoute('/join/loading', {
  validateParams: (params) => params,
  component: RegionSearchLoading,
});

function RegionSearchLoading() {
  const storeState = useRegionSearchStore((state) => state);
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchData() {
      try {
        console.log(storeState);
        const result = await postRegionSearch(storeState);
        navigation.navigate('/join/result', { result });
      } catch (e: any) {
        if (e?.response?.status === 405) {
          // 405면 메인으로
          Alert.alert(
            '서버 오류',
            '문제가 발생하여 메인화면으로 이동합니다.',
            [
              {
                text: '확인',
                onPress: () => navigation.navigate('/main'),
              },
            ],
            { cancelable: false }
          );
        } else {
          // 기타 에러는 콘솔 출력
          console.error(e);
        }
      }
    }
    fetchData();
  }, [storeState, navigation]);

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