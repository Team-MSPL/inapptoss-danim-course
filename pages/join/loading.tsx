import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';
import { StepText } from '../../components/step-text';
import {FixedBottomCTAProvider, useToast} from '@toss-design-system/react-native';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import {getRecentSelectList, patchRecentSelectList, postRegionSearch} from '../../zustand/api';

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
        await patchRecentSelectList(storeState.selectList);
        const result = await postRegionSearch(storeState);
        navigation.reset({ index: 0, routes: [{ name: `/join/result`, params: { result }}]});
      } catch (e: any) {
        if (e?.response?.status === 405) {
          Alert.alert(
            '추천 지역 없음',
            '지역의 인기도와 여행 반경을 재설정 후, 다시 시도해주세요.',
            [
              {
                text: '확인',
                onPress: () => navigation.navigate('/join/popular'),
              },
            ],
            { cancelable: false }
          );
        } else {
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