import { FlatList, ScrollView } from '@react-native-bedrock/native/react-native-gesture-handler';
import {
  Asset,
  Badge,
  BottomSheet,
  Button,
  colors,
  LinearGradient,
  StepperRow,
  Tab,
  Text,
  Top,
  useBottomSheet,
} from '@toss-design-system/react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import {
  BedrockRoute,
  closeView,
  Flex,
  Image,
  Stack,
  useBackEvent,
  useNavigation,
} from 'react-native-bedrock';
import { useAppSelector } from 'store';
import NavigationBar from '../components/navigation-bar';
import GrayCircle from "../components/design/gray-circle";

export const Route = BedrockRoute('/preset', {
  validateParams: (params) => params,
  component: Preset,
});

function Preset() {
  const { presetDatas, regionInfo, region, presetTendencyList, nDay } = useAppSelector(
    (state) => state.travelSlice,
  );
  const [tabValue, setTabalue] = useState('0');
  const [itemLayouts, setItemLayouts] = useState<number[]>([]);
  const scrollRef = useRef(null);

  const handleItemLayout = (event, idx) => {
    const { height } = event.nativeEvent.layout;
    setItemLayouts((prev) => {
      const copy = [...prev];
      copy[idx] = height;
      return copy;
    });
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    let sum = 0;
    let index = 0;
    for (let i = 0; i < itemLayouts.length; i++) {
      sum += itemLayouts[i] || 0;
      if (offsetY < sum) {
        index = i;
        break;
      }
    }
    setTabalue(String(index));
  };

  const moveScroll = (e) => {
    scrollRef.current?.scrollToIndex({
      index: Number(e),
      animated: true,
    });
    setTabalue(e);
  };

  const backEvent = useBackEvent();

  const bottomSheet = useBottomSheet();
  const [handler, setHandler] = useState<{ callback: () => void } | undefined>({
    callback: () =>
      bottomSheet.open({
        children: (
          <>
            <Text
              typography="t4"
              fontWeight="bold"
              color={colors.grey800}
              style={{ alignSelf: 'center', marginTop: 35 }}
            >
              저장이 필요해요
            </Text>
            <Text
              typography="t5"
              fontWeight="regular"
              color={colors.grey600}
              style={{ textAlign: 'center' }}
            >
              홈으로 이동시 지역 추천이 끝나요.{`\n`}일정 선택 후에 종료해야 저장 할 수 있어요.
            </Text>
            <BottomSheet.CTA.Double
              leftButton={
                <Button
                  type="dark"
                  style="weak"
                  display="block"
                  onPress={() => {
                    navigation.popToTop();
                  }}
                >
                  {'종료하기'}
                </Button>
              }
              rightButton={
                <Button
                  type="primary"
                  style="fill"
                  display="block"
                  onPress={() => {
                    bottomSheet.close();
                  }}
                >
                  {'선택하러 가기'}
                </Button>
              }
            ></BottomSheet.CTA.Double>
          </>
        ),
      }),
  });

  useEffect(() => {
    const callback = handler?.callback;

    if (callback != null) {
      backEvent.addEventListener(callback);

      return () => {
        backEvent.removeEventListener(callback);
      };
    }

    return;
  }, [backEvent, handler]);
  const navigation = useNavigation();
  const goDetail = (e: number) => {
    navigation.navigate('/preset-detail', { index: e });
  };
  const onViewableItemsChanged = useRef((items) => {
    setTabalue(String(items?.changed[0]?.index));
  });
  const calculateTendency = (e: any) => {
    let copy = [];
    let copy2 = [];
    e?.tendencyNameList?.forEach((item, idx) => {
      if (!['봄', '여름', '가을', '겨울'].includes(item)) {
        copy.push(item);
        copy2.push(e.tendencyRanking[idx]);
      }
    });
    let min = 100;
    let minIndex = -1;
    let nextMin = 100;
    let nextMinIndex = -1;
    copy2.forEach((item, idx) => {
      if (item <= min) {
        nextMin = min;
        nextMinIndex = minIndex;
        min = item;
        minIndex = idx;
      } else if (item <= nextMin) {
        nextMin = item;
        nextMinIndex = idx;
      }
    });
    let result =
      (e?.tendencyNameList[minIndex] ?? '') +
      (e?.tendencyNameList[nextMinIndex] ? ', ' + e?.tendencyNameList[nextMinIndex] : '');
    return result;
  };
  const [tendencyViewIndex, setTendencyViewIndex] = useState<boolean[]>(
    Array(presetDatas.length).fill(true),
  );
  const renderItem = ({ item, index }) => {
    // 점수/이름 쌍을 만들어 정렬
    const names = presetTendencyList[index]?.tendencyNameList || [];
    const points = presetTendencyList[index]?.tendencyPointList || [];
    const tendencyPairs = names.map((name, i) => ({
      name,
      point: points[i]
    }));
    // 내림차순 정렬
    const sortedTendencyPairs = [...tendencyPairs].sort((a, b) => b.point - a.point);

    return (
      <Stack.Vertical
        style={{
          position: 'relative',
          borderWidth: 1,
          borderColor: '#eeeeee',
          borderRadius: 13,
          paddingHorizontal: 24,
          paddingVertical: 20,
          marginTop: 10,
          marginBottom: 30,
          marginHorizontal: 24,
        }}
        onLayout={(e) => handleItemLayout(e, index)}
      >
        {/* ...성향 badge 표시 부분 동일 */}

        {/* 타임라인 */}
        <View style={{ flexDirection: 'column', marginTop: 20, marginBottom: 16 }}>
          {item?.map((value, idx) => {
            const isLast = idx === item.length - 1;
            // 대표 장소명
            const mainPlace = value[value[0].category == 4 ? 1 : 0].name;
            // 서브 장소 개수
            const subPlaceCount =
              value.filter((itemValue) => !itemValue.name.includes('추천')).length - 1;
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: isLast ? 0 : 20,
                }}
              >
                {/* 왼쪽: 타임라인 */}
                <View style={{ alignItems: 'center', width: 54 }}>
                  <GrayCircle size={8.5} style={{ marginTop: 5 }} />
                  {/* 세로선 (마지막엔 생략) */}
                  {!isLast && (
                    <View
                      style={{
                        width: 1.5,
                        height: 32,
                        backgroundColor: '#E5E7EB',
                        marginTop: 2,
                      }}
                    />
                  )}
                  <Text
                    typography="t7"
                    color={colors.grey800}
                    style={{ position: 'absolute', top: -2, left: 18, fontWeight: '500' }}
                  >
                    {`${idx + 1}일 차`}
                  </Text>
                </View>
                {/* 오른쪽: 장소 정보 */}
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text typography="t6" fontWeight="bold" color={colors.grey900}>
                    {mainPlace}
                  </Text>
                  {subPlaceCount >= 1 && (
                    <Text
                      typography="t7"
                      color={colors.grey700}
                      style={{ marginTop: 2 }}
                    >{`+${subPlaceCount}개 장소`}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <Button
          type="primary"
          style="weak"
          display="full"
          onPress={() => {
            goDetail(index);
          }}
        >
          일정 자세히 보기
        </Button>
      </Stack.Vertical>
    );
  };

  // 상단 카드(최고 점수 맨 앞으로)
  const topNames = presetTendencyList[0]?.tendencyNameList || [];
  const topPoints = presetTendencyList[0]?.tendencyPointList || [];
  const topPairs = topNames.map((name, i) => ({
    name,
    point: topPoints[i]
  }));
  const sortedTopPairs = [...topPairs].sort((a, b) => b.point - a.point);

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <Top
        title={
          <Text typography="t6" fontWeight="regular" color={colors.grey700}>
            점수가 낮은 일정은 간단한 동선을 우선시했어요
          </Text>
        }
        subtitle1={
          <Text typography="t3" fontWeight="bold" color={colors.grey900}>
            나그네님,{`\n`}이런 여행 일정은 어때요?
          </Text>
        }
      ></Top>
      <View style={{ paddingHorizontal: 24 }}>
        <View
          style={{
            height: 103,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Image
            source={{ uri: regionInfo.photo }}
            resizeMode="cover"
            style={{
              width: '100%',
              height: 103,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />

          {/* 검정색 오버레이 (반투명) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: 103,
              borderRadius: 16,
            }}
          />

          {/* 텍스트 및 뱃지 등 컨텐츠 */}
          <View
            style={{
              height: 103,
              width: '100%',
              padding: 20,
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Text typography="st5" fontWeight="semibold" color={colors.white}>
              {region[0].split('/').at(-1)}
              {region.length >= 2 ? ` 외 ${region.length - 1}지역` : ''}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              {sortedTopPairs.slice(0, 3).map((item, idx) => (
                <View
                  key={item.name + item.point}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <Text
                    typography="t7"
                    fontWeight="medium"
                    color={colors.white}
                    style={{ alignSelf: 'center' }}
                  >
                    {item.name}
                  </Text>
                </View>
              ))}
              {sortedTopPairs.length >= 4 && (
                <Text
                  typography="t7"
                  fontWeight="medium"
                  color={colors.white}
                  style={{ alignSelf: 'center' }}
                >
                  +{sortedTopPairs.length - 3}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
      <Text
        typography="t6"
        fontWeight="medium"
        color={colors.blue700}
        style={{ marginHorizontal: 24, marginTop: 16 }}
      >
        * {nDay == 0 ? '당일치기' : nDay + '박 ' + (nDay + 1) + '일'} 일정이에요
      </Text>
      <Tab
        fluid
        size="large"
        onChange={(e) => {
          moveScroll(e);
        }}
        value={tabValue}
        style={{ marginTop: 5 }}
      >
        {[...Array.from({ length: presetDatas.length }, (item, index) => index)].map(
          (item, idx) => {
            return <Tab.Item key={idx} value={String(idx)}>{idx + 1}</Tab.Item>;
          },
        )}
      </Tab>
      <FlatList
        keyExtractor={(_, index) => index.toString()}
        style={{ flex: 1 }}
        ref={scrollRef}
        data={presetDatas}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            scrollRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 500); // 일정 시간 후 재시도
        }}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 90,
        }}
        renderItem={renderItem}
      ></FlatList>
    </View>
  );
}
export default Preset;