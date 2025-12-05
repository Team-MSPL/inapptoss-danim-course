import React from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import { Image } from '@granite-js/react-native';
import {
  Badge,
  colors,
  FixedBottomCTAProvider,
  Text,
  Top,
  BottomSheet,
  Button,
  useBottomSheet,
} from '@toss-design-system/react-native';
import { useNavigation } from '@granite-js/react-native';
import { getRecentSelectList } from '../../zustand/api';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import { useDispatch } from 'react-redux';
import { travelSliceActions } from '../../redux/travle-slice';
import { useRecentModeStore } from '../../zustand/modeStore';
import { tendencyData, tendencyDataJoin } from '../../components/join/constants/tendencyData';

export default function MainHome() {
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();
  const setRecentMode = useRecentModeStore((state) => state.setRecentMode);
  const setSelectList = useRegionSearchStore((state) => state.setSelectList);
  const dispatch = useDispatch();

  const EXPECTED_LENGTHS_JOIN = [6, 6, 7, 6, 4];
  const EXPECTED_LENGTHS_ENROLL = [7, 6, 6, 11, 4];

  function matchesExpectedLengths(arr: any, expected: number[]) {
    if (!Array.isArray(arr) || arr.length !== expected.length) return false;
    return expected.every((len, idx) => Array.isArray(arr[idx]) && arr[idx].length === len);
  }

  function mapRecentToRouteFormat(maybe: any, route: string) {
    const wantEnroll = String(route).includes('/enroll');
    const incomingIsJoin = matchesExpectedLengths(maybe, EXPECTED_LENGTHS_JOIN);
    const incomingIsEnroll = matchesExpectedLengths(maybe, EXPECTED_LENGTHS_ENROLL);
    let sourceLists = tendencyDataJoin;
    if (incomingIsEnroll) {
      sourceLists = tendencyData;
    } else if (incomingIsJoin) {
      sourceLists = tendencyDataJoin;
    } else {
      if (Array.isArray(maybe) && maybe.length === 5) {
        const joinMatches = maybe.reduce((acc: number, cur: any, i: number) => acc + (Array.isArray(cur) && cur.length === EXPECTED_LENGTHS_JOIN[i] ? 1 : 0), 0);
        const enrollMatches = maybe.reduce((acc: number, cur: any, i: number) => acc + (Array.isArray(cur) && cur.length === EXPECTED_LENGTHS_ENROLL[i] ? 1 : 0), 0);
        if (enrollMatches > joinMatches) {
          sourceLists = tendencyData;
        } else {
          sourceLists = tendencyDataJoin;
        }
      } else {
        sourceLists = tendencyDataJoin;
      }
    }
    const targetLists = wantEnroll ? tendencyData : tendencyDataJoin;
    const targetExpected = wantEnroll ? EXPECTED_LENGTHS_ENROLL : EXPECTED_LENGTHS_JOIN;
    if (!Array.isArray(maybe)) {
      return targetExpected.map((len) => Array.from({ length: len }, () => 0));
    }
    const out: number[][] = [];
    for (let catIdx = 0; catIdx < targetLists.length; catIdx++) {
      const tList = targetLists[catIdx]?.list ?? [];
      const sList = sourceLists[catIdx]?.list ?? [];
      const sourceArr = Array.isArray(maybe[catIdx]) ? maybe[catIdx] : [];
      const targetArr = new Array(targetLists[catIdx]?.list?.length ?? targetExpected[catIdx] ?? 0).fill(0);
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
    return out;
  }

  const confirmRecommend = (apiResult: any, route: string) => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: 'center', marginTop: 35 }}
          >
            최근에 선택하신 여행 성향들로 추천을 진행할까요?
          </Text>
          <BottomSheet.CTA.Double
            leftButton={
              <Button type="dark" style="weak" display="block" onPress={() => {
                if (route === '/join/who') {
                  setSelectList(EXPECTED_LENGTHS_JOIN.map((len) => new Array(len).fill(0)));
                }
                setRecentMode('current');
                bottomSheet.close();
                navigation.navigate(route);
              }}>
                아니요, 다시 선택할게요
              </Button>
            }
            rightButton={
              <Button
                type="primary"
                style="fill"
                display="block"
                onPress={() => {
                  setRecentMode('recent');
                  const recentRaw = apiResult?.recentSelectList ?? apiResult?.recent ?? [];
                  const mapped = mapRecentToRouteFormat(recentRaw, route);
                  console.log('mapRecentToRouteFormat:', { route, recentRaw, mapped });
                  if (String(route).includes('/join')) {
                    setSelectList(mapped);
                    console.log('setSelectList mapped for join', mapped);
                  } else {
                    dispatch(travelSliceActions.updateFiled({ field: 'tendency', value: mapped }));
                    console.log('dispatch updateFiled mapped for enroll', mapped);
                  }
                  bottomSheet.close();
                  navigation.navigate(route);
                }}
              >
                네, 최근 선택대로 추천해주세요
              </Button>
            }
          />
        </>
      ),
    });
  };

  const handleNavigate = async (route: string) => {
    try {
      const data = await getRecentSelectList();
      const recent = Array.isArray(data) ? data : data?.recentSelectList ?? data?.recent ?? [];
      console.log('handleNavigate recent:', { route, recent });
      const hasValidRecent =
        Array.isArray(recent) &&
        recent.length === 5 &&
        recent.some((inner) => Array.isArray(inner) && inner.length > 0);
      if (hasValidRecent) {
        confirmRecommend({ recentSelectList: recent }, route);
      } else {
        navigation.navigate(route);
      }
    } catch (error) {
      navigation.navigate(route);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <Top
          title={
            <Text typography="t6" fontWeight="medium" color={colors.grey600}>
              1분 투자로 하루 아끼기!
            </Text>
          }
          subtitle1={
            <Text typography="t3" fontWeight="bold" color={colors.grey900}>
              여행지부터 일정까지,{`\n`}다님 AI 추천해 줄게요
            </Text>
          }
        ></Top>
        <View style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 20, marginTop: 30 }}>
          <TouchableOpacity
            onPress={() => handleNavigate('/enroll/title')}
            style={{
              width: Dimensions.get('window').width - 48,
              alignSelf: 'center',
              height: 165,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 0,
              backgroundColor: '#eee',
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: 'https://firebasestorage.googleapis.com/v0/b/danim-image/o/appintoss_main%2Fappintoss-main1.png?alt=media&token=6932a5ba-3506-4c2b-a2bb-9ea2cd5aff66',
              }}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
                position: 'absolute',
              }}
            />
            <Badge
              size="medium"
              type="green"
              badgeStyle="fill"
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                zIndex: 2,
              }}
            >
              여행 일정 추천
            </Badge>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  typography="t3"
                  fontWeight="bold"
                  color="#fff"
                  style={{
                    textAlign: 'center',
                    textShadowColor: 'rgba(0,0,0,0.18)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                >
                  여행지는 골랐는데{'\n'}계획 세우기 귀찮다면?
                </Text>
                <Text
                  typography="t1"
                  fontWeight="bold"
                  color="#fff"
                  style={{
                    marginLeft: 10,
                    textShadowColor: 'rgba(0,0,0,0.12)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                    fontSize: 22,
                  }}
                >
                  →
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavigate('/join/country')}
            style={{
              width: Dimensions.get('window').width - 48,
              alignSelf: 'center',
              height: 165,
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 0,
              backgroundColor: '#eee',
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: 'https://firebasestorage.googleapis.com/v0/b/danim-image/o/appintoss_main%2Fappintoss-main2.png?alt=media&token=a2875a2d-2f7f-4218-bd13-1254198cea3c',
              }}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
                position: 'absolute',
              }}
            />
            <Badge
              size="medium"
              type="blue"
              badgeStyle="fill"
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                zIndex: 2,
              }}
            >
              여행 지역 추천
            </Badge>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  typography="t3"
                  fontWeight="bold"
                  color="#fff"
                  style={{
                    textAlign: 'center',
                    textShadowColor: 'rgba(0,0,0,0.18)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                >
                  여행은 가고 싶은데{'\n'}어디로 갈지 고민이라면?
                </Text>
                <Text
                  typography="t1"
                  fontWeight="bold"
                  color="#fff"
                  style={{
                    marginLeft: 10,
                    textShadowColor: 'rgba(0,0,0,0.12)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                    fontSize: 22,
                  }}
                >
                  →
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}