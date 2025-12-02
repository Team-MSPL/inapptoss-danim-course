import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';
import { StepText } from '../../components/step-text';
import { FixedBottomCTAProvider } from '@toss-design-system/react-native';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
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
    // fallback in case route names differ
    navigation.goBack();
  }
}

function applyRetryDefaultsToStore() {
  // set store-level defaults for retry: selectPopular -> [0,100], distanceSensitivity -> 10
  // useRegionSearchStore is a Zustand hook; its .setState is available to update state directly
  try {
    // set only the keys we need; preserve others
    (useRegionSearchStore as any).setState({
      selectPopular: [0, 100],
      distanceSensitivity: 10,
    });
  } catch (e) {
    // ignore if setState not available; we'll still proceed with local retry payload
    console.warn('[RegionSearchLoading] setState failed', e);
  }
}

export default function RegionSearchLoading() {
  const navigation = useNavigation();

  // local UI flag to show alternate title when retrying after 405
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // get freshest store state at runtime
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
        // if 405 -> modify selectPopular and distanceSensitivity, retry automatically
        if (e?.response?.status === 405) {
          // switch UI title
          setRetrying(true);

          // update store values (best-effort). We'll also construct a local retry payload.
          applyRetryDefaultsToStore();

          try {
            // obtain updated store state after applying defaults (if setState worked)
            const updatedState = (useRegionSearchStore as any).getState();

            // If updatedState.selectList exists use it, otherwise fallback to previous stored value
            const selectListToPatch = updatedState?.selectList ?? (e?.config && e?.config.data && (JSON.parse(e.config.data)?.selectList ?? null)) ?? null;
            if (selectListToPatch) {
              try {
                await patchRecentSelectList(selectListToPatch);
              } catch (patchErr) {
                console.warn('[RegionSearchLoading] patchRecentSelectList on retry failed', patchErr);
                // continue to attempt postRegionSearch anyway
              }
            }

            // Build payload for retry: prefer updatedState but fallback to partial info from original error if available
            const retryPayload = {
              ...(updatedState ?? {}),
              // ensure selectPopular and distanceSensitivity are set regardless
              selectPopular: [0, 100],
              distanceSensitivity: 10,
            };

            // Attempt retry
            const retryResult = await postRegionSearch(retryPayload);
            if (cancelled) return;
            // success -> navigate to result
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
            // show alert and navigate back to popular selection so user can adjust manually
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

        // non-405 errors: log and show generic message (fallback to previous UX if desired)
        console.error('[RegionSearchLoading] postRegionSearch error', e);
        Alert.alert(
          '오류가 발생했습니다',
          '잠시 후 다시 시도해주세요.',
          [
            {
              text: '확인',
              onPress: () => {
                // back to previous screen
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
    // intentionally run once on mount; navigation is stable
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