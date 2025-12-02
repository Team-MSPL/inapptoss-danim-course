import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';
import { StepText } from '../../components/step-text';
import { FixedBottomCTAProvider } from '@toss-design-system/react-native';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import { useCountryStore } from '../../zustand/countryStore';
import { getRecentSelectList, patchRecentSelectList, postRegionSearch } from '../../zustand/api';

const LOTTIE_URL = "https://static.toss.im/lotties/loading/load-ripple.json";

export const Route = createRoute('/join/loading', {
  validateParams: (params) => params,
  component: RegionSearchLoading,
});

function safeNavToPopular(navigation: any) {
  try {
    navigation.navigate('/join/popular');
  } catch {
    navigation.goBack();
  }
}

function applyRetryDefaultsToStore() {
  try {
    (useRegionSearchStore as any).setState({
      selectPopular: [0, 100],
      distanceSensitivity: 10,
    });
  } catch (e) {
    console.warn('[RegionSearchLoading] setState failed', e);
  }
}

export default function RegionSearchLoading() {
  const navigation = useNavigation();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // ---- NEW: read selected country (Korean) and map to English for API ----
        const selectedCountryKo = (useCountryStore as any).getState?.()?.selectedCountryKo;
        // mapping based on provided list (includes common variants)
        const countryMap: Record<string, string> = {
          '대한민국': 'Korea',
          '한국': 'Korea',
          '일본': 'Japan',
          '중국': 'China',
          '베트남': 'Vietnam',
          '태국': 'Thailand',
          '필리핀': 'Philippines',
          '싱가포르': 'Singapore',
          // keep flexibility for other labels (e.g. '홍콩과 마카오' not in this map)
        };

        if (selectedCountryKo) {
          const key = String(selectedCountryKo).trim();
          const mappedEn = countryMap[key];
          if (mappedEn) {
            try {
              // update regionSearchStore.country to English value before building payload
              (useRegionSearchStore as any).setState({ country: mappedEn });
              console.log('[RegionSearchLoading] region store country set to', mappedEn);
            } catch (e) {
              console.warn('[RegionSearchLoading] failed to set region store country', e);
            }
          } else {
            console.log('[RegionSearchLoading] selected country not mapped to English:', selectedCountryKo);
            // If not mapped, do not override store.country (leave existing)
          }
        }
        // ---- END new country mapping ----

        // get freshest store state at runtime (after possible country update)
        const storeState = (useRegionSearchStore as any).getState();
        // persist recent select list first (same as original flow)
        await patchRecentSelectList(storeState.selectList);
        const result = await postRegionSearch(storeState);
        if (cancelled) return;
        navigation.reset({
          index: 1,
          routes: [
            { name: `/${import.meta.env.APP_START_MODE}` },
            { name: `/join/result`, params: { result } },
          ],
        });
      } catch (e: any) {
        if (e?.response?.status === 405) {
          setRetrying(true);
          applyRetryDefaultsToStore();

          try {
            const updatedState = (useRegionSearchStore as any).getState();

            const selectListToPatch =
              updatedState?.selectList ??
              (e?.config && e?.config.data && (JSON.parse(e.config.data)?.selectList ?? null)) ??
              null;

            if (selectListToPatch) {
              try {
                await patchRecentSelectList(selectListToPatch);
              } catch (patchErr) {
                console.warn('[RegionSearchLoading] patchRecentSelectList on retry failed', patchErr);
              }
            }

            const retryPayload = {
              ...(updatedState ?? {}),
              selectPopular: [0, 100],
              distanceSensitivity: 10,
            };

            const retryResult = await postRegionSearch(retryPayload);
            if (cancelled) return;
            navigation.reset({
              index: 1,
              routes: [
                { name: `/${import.meta.env.APP_START_MODE}` },
                { name: `/join/result`, params: { result: retryResult } },
              ],
            });
            return;
          } catch (retryErr: any) {
            console.warn('[RegionSearchLoading] retry postRegionSearch failed', retryErr);
            Alert.alert(
              '추천 지역 없음',
              '자동 재시도에서도 적절한 추천 지역을 찾지 못했습니다. 인기도 범위를 재조정한 뒤 다시 시도해주세요.',
              [
                {
                  text: '확인',
                  onPress: () => safeNavToPopular(navigation),
                },
              ],
              { cancelable: false }
            );
            return;
          }
        }

        console.error('[RegionSearchLoading] postRegionSearch error', e);
        Alert.alert(
          '오류가 발생했습니다',
          '잠시 후 다시 시도해주세요.',
          [
            {
              text: '확인',
              onPress: () => {
                navigation.goBack();
              },
            },
          ],
          { cancelable: false }
        );
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <StepText
          title={
            retrying
              ? '범위를 다시 지정하여 여행지역을\n찾는 중이에요'
              : '나그네님을 위한 여행지역을 \n찾는 중이에요'
          }
          subTitle1={''}
          subTitle2={'잠시만 기다려주세요.'}
        />
        <View style={styles.inner}>
          <LottieView source={{ uri: LOTTIE_URL }} autoPlay loop style={styles.lottie} />
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