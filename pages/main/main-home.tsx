import React, { useRef } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import { Image } from '@granite-js/react-native';
import {
  Badge,
  colors,
  FixedBottomCTAProvider,
  Text,
  Top,
  BottomSheet,
  Button, useBottomSheet
} from '@toss-design-system/react-native';
import { useNavigation } from '@granite-js/react-native';
import { getRecentSelectList } from '../../zustand/api';
import { useRegionSearchStore } from '../../zustand/regionSearchStore';
import { useDispatch } from 'react-redux';
import { travelSliceActions } from "../../redux/travle-slice";
import {useRecentModeStore} from "../../zustand/modeStore";

export default function MainHome() {
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();
  const setRecentMode = useRecentModeStore((state) => state.setRecentMode);

  const setSelectList = useRegionSearchStore((state) => state.setSelectList);
  const dispatch = useDispatch();

  const handleNavigate = async (route: string) => {
    try {
      const data = await getRecentSelectList();
      console.log('getRecentSelectList result:', data);

      // support both shapes: plain array OR { recentSelectList: [...] }
      const recent = Array.isArray(data) ? data : data?.recentSelectList;

      // valid only when recent is 2D array AND at least one inner array has length > 0
      const hasValidRecent =
        Array.isArray(recent) &&
        recent.length > 0 &&
        recent.some((inner) => Array.isArray(inner) && inner.length > 0);

      if (hasValidRecent) {
        confirmRecommend({ recentSelectList: recent }, route);
      } else {
        // no meaningful recent -> skip confirm
        navigation.navigate(route);
      }
    } catch (error) {
      console.error('API 에러:', error);
      navigation.navigate(route);
    }
  };

  // expectedLengths는 앱 스펙에 맞춰 조정하세요
  const EXPECTED_LENGTHS = [7, 6, 6, 11, 4]; // 예시: 각 카테고리별 항목수

  function normalizeSelectList(maybe: any): number[][] {
    // ensure array-of-arrays
    const out: number[][] = [];

    if (!Array.isArray(maybe)) {
      // invalid -> return zero-filled structure
      return EXPECTED_LENGTHS.map((len) => Array.from({ length: len }, () => 0));
    }

    // for each expected category index, take provided inner array or zeros
    for (let i = 0; i < EXPECTED_LENGTHS.length; i++) {
      const expectedLen = EXPECTED_LENGTHS[i];
      const provided = Array.isArray(maybe[i]) ? maybe[i] : [];
      const normalized = new Array(expectedLen).fill(0);
      for (let j = 0; j < Math.min(expectedLen, provided.length); j++) {
        // try coerce to 0/1 number
        const v = Number(provided[j]) || 0;
        normalized[j] = v;
      }
      out.push(normalized);
    }

    return out;
  }

  // 바텀시트 confirmRecommend 구현
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
                if(route === '/join/who') {
                  setSelectList([[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0]]);
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
                // inside rightButton onPress
                onPress={() => {
                  setRecentMode('recent');
                  const recentRaw = apiResult?.recentSelectList ?? [];
                  const normalized = normalizeSelectList(recentRaw);

                  if(route === '/join/who') {
                    setSelectList(normalized); // zustand에 안전하게 저장
                  } else {
                    // redux로 전달 전에 normalize
                    dispatch(travelSliceActions.updateFiled({ field: 'tendency', value: normalized }));
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