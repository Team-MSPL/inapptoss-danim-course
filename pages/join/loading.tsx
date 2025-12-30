import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import NavigationBar from '../../components/navigation-bar';
import { createRoute, useNavigation } from '@granite-js/react-native';
import LottieView from '@granite-js/native/lottie-react-native';
import { StepText } from '../../components/step-text';
import { FixedBottomCTAProvider } from '@toss-design-system/react-native';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import { useCountryStore } from '../../zustand/countryStore';
import { getRecentSelectList, patchRecentSelectList, postRegionSearch } from '../../zustand/api';
import { tendencyData, tendencyDataJoin } from '../../components/join/constants/tendencyData';

const LOTTIE_URL = 'https://static.toss.im/lotties/loading/load-ripple.json';

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

const EXPECTED_LENGTHS_JOIN = [6, 6, 7, 6, 4];
const EXPECTED_LENGTHS_ENROLL = [7, 6, 6, 11, 4];

function matchesExpectedLengths(arr: any, expected: number[]) {
  if (!Array.isArray(arr) || arr.length !== expected.length) return false;
  return expected.every((len, idx) => Array.isArray(arr[idx]) && arr[idx].length === len);
}

function convertToEnrollFormat(maybe: any) {
  console.log('[RegionSearchLoading] convertToEnrollFormat input:', maybe);

  const sourceListsDefault = tendencyDataJoin;
  const incomingIsJoin = matchesExpectedLengths(maybe, EXPECTED_LENGTHS_JOIN);
  const incomingIsEnroll = matchesExpectedLengths(maybe, EXPECTED_LENGTHS_ENROLL);

  let sourceLists = sourceListsDefault;
  if (incomingIsEnroll) {
    sourceLists = tendencyData;
    console.log('[RegionSearchLoading] detected incoming as ENROLL format');
  } else if (incomingIsJoin) {
    sourceLists = tendencyDataJoin;
    console.log('[RegionSearchLoading] detected incoming as JOIN format');
  } else {
    console.log('[RegionSearchLoading] incoming format ambiguous, evaluating per-category matches');
    if (Array.isArray(maybe) && maybe.length === 5) {
      const joinMatches = maybe.reduce(
        (acc: number, cur: any, i: number) => acc + (Array.isArray(cur) && cur.length === EXPECTED_LENGTHS_JOIN[i] ? 1 : 0),
        0
      );
      const enrollMatches = maybe.reduce(
        (acc: number, cur: any, i: number) => acc + (Array.isArray(cur) && cur.length === EXPECTED_LENGTHS_ENROLL[i] ? 1 : 0),
        0
      );
      console.log('[RegionSearchLoading] ambiguous counts', { joinMatches, enrollMatches });
      sourceLists = enrollMatches > joinMatches ? tendencyData : tendencyDataJoin;
      console.log('[RegionSearchLoading] chosen sourceLists based on counts:', enrollMatches > joinMatches ? 'ENROLL' : 'JOIN');
    } else {
      sourceLists = tendencyDataJoin;
      console.log('[RegionSearchLoading] defaulting sourceLists to JOIN');
    }
  }

  const targetLists = tendencyData; // enroll target
  const targetExpected = EXPECTED_LENGTHS_ENROLL;

  if (!Array.isArray(maybe)) {
    const zeros = targetExpected.map((len) => new Array(len).fill(0));
    console.log('[RegionSearchLoading] input not array, returning zeros:', zeros);
    return zeros;
  }

  const out: number[][] = [];
  for (let catIdx = 0; catIdx < targetLists.length; catIdx++) {
    const tList = targetLists[catIdx]?.list ?? [];
    const sList = sourceLists[catIdx]?.list ?? [];
    const sourceArr = Array.isArray(maybe[catIdx]) ? maybe[catIdx] : [];
    const targetArr = new Array(tList.length).fill(0);
    for (let ti = 0; ti < tList.length; ti++) {
      const label = tList[ti];
      const sIndex = sList.findIndex((s: string) => String(s) === String(label));
      if (sIndex >= 0 && sIndex < sourceArr.length) {
        targetArr[ti] = Number(sourceArr[sIndex]) ? 1 : 0;
      } else {
        targetArr[ti] = 0;
      }
    }
    out.push(targetArr);
  }

  console.log('[RegionSearchLoading] convertToEnrollFormat result lengths:', out.map((a) => a.length));
  console.log('[RegionSearchLoading] convertToEnrollFormat result sample:', out);
  return out;
}

export default function RegionSearchLoading() {
  const navigation = useNavigation();
  const [retrying, setRetrying] = useState(false);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function fetchData() {
      try {
        const currentStateBefore = (useRegionSearchStore as any).getState();
        const originalSelectList = currentStateBefore?.selectList ?? null;
        console.log('[RegionSearchLoading] fetchData start - original selectList lengths:',
          Array.isArray(originalSelectList) ? originalSelectList.map((s: any) => (Array.isArray(s) ? s.length : null)) : null
        );

        if (originalSelectList) {
          try {
            const convertedImmediately = convertToEnrollFormat(originalSelectList);
            try {
              (useRegionSearchStore as any).setState({ selectList: convertedImmediately });
              console.log('[RegionSearchLoading] fetchData start - store.selectList replaced with converted enroll-format (immediate)');
            } catch (setErr) {
              console.warn('[RegionSearchLoading] failed to set converted selectList in store (immediate conversion)', setErr);
            }
          } catch (convErr) {
            console.warn('[RegionSearchLoading] immediate conversion failed, leaving original selectList as-is', convErr);
          }
        } else {
          console.log('[RegionSearchLoading] fetchData start - no original selectList to convert');
        }

        const selectedCountryKo = (useCountryStore as any).getState?.()?.selectedCountryKo;
        const countryMap: Record<string, string> = {
          대한민국: 'Korea',
          한국: 'Korea',
          일본: 'Japan',
          중국: 'China',
          베트남: 'Vietnam',
          태국: 'Thailand',
          필리핀: 'Philippines',
          싱가포르: 'Singapore',
        };

        if (selectedCountryKo && !cancelledRef.current) {
          const key = String(selectedCountryKo).trim();
          const mappedEn = countryMap[key];
          if (mappedEn) {
            try {
              (useRegionSearchStore as any).setState({ country: mappedEn });
            } catch (e) {
              console.warn('[RegionSearchLoading] failed to set region store country', e);
            }
          }
        }

        const storeState = (useRegionSearchStore as any).getState();

        // Now patchRecentSelectList with the already-converted selectList (if present)
        console.log('[RegionSearchLoading] about to call patchRecentSelectList with selectList lengths:',
          Array.isArray(storeState?.selectList) ? storeState.selectList.map((s: any) => (Array.isArray(s) ? s.length : null)) : null
        );
        try {
          await patchRecentSelectList(storeState.selectList);
          console.log('[RegionSearchLoading] patchRecentSelectList succeeded (post-immediate-conversion)');
        } catch (patchErr) {
          console.warn('[RegionSearchLoading] patchRecentSelectList failed (post-immediate-conversion)', patchErr);
          // continue, retry logic below will handle 405 etc.
        }

        if (cancelledRef.current) return;
        const result = await postRegionSearch(storeState);
        if (cancelledRef.current) return;

        try {
          navigation.reset({
            index: 1,
            routes: [
              { name: `/${import.meta.env.APP_START_MODE}` },
              { name: `/join/result`, params: { result } },
            ],
          });
        } catch (e) {
          if (!cancelledRef.current) navigation.goBack();
        }
      } catch (e: any) {
        if (e?.response?.status === 405) {
          if (cancelledRef.current) return;
          setRetrying(true);
          applyRetryDefaultsToStore();

          try {
            const updatedState = (useRegionSearchStore as any).getState();

            const selectListToPatch =
              updatedState?.selectList ??
              (e?.config && e?.config.data && (JSON.parse(e.config.data)?.selectList ?? null)) ??
              null;

            if (selectListToPatch && !cancelledRef.current) {
              try {
                await patchRecentSelectList(selectListToPatch);
              } catch (patchErr) {
                console.warn('[RegionSearchLoading] patchRecentSelectList on retry failed', patchErr);
              }
            }

            if (cancelledRef.current) return;

            const retryPayload = {
              ...(updatedState ?? {}),
              selectPopular: [0, 100],
              distanceSensitivity: 10,
            };

            const retryResult = await postRegionSearch(retryPayload);
            if (cancelledRef.current) return;

            try {
              navigation.reset({
                index: 1,
                routes: [
                  { name: `/${import.meta.env.APP_START_MODE}` },
                  { name: `/join/result`, params: { result: retryResult } },
                ],
              });
            } catch (navErr) {
              if (!cancelledRef.current) navigation.goBack();
            }
            return;
          } catch (retryErr: any) {
            console.warn('[RegionSearchLoading] retry postRegionSearch failed', retryErr);
            if (cancelledRef.current) return;
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
        if (cancelledRef.current) return;
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
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        <StepText
          title={
            retrying ? '범위를 다시 지정하여 여행지역을\n찾는 중이에요' : '나그네님을 위한 여행지역을 \n찾는 중이에요'
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