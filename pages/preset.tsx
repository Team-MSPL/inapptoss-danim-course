import { FlatList } from '@granite-js/native/react-native-gesture-handler';
import {
  Button,
  colors,
  LinearGradient,
  Tab,
  Text,
  Top,
  useBottomSheet,
  Badge,
} from '@toss-design-system/react-native';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import {
  createRoute,
  Flex,
  Image,
  Stack,
  useBackEvent,
  useNavigation,
} from '@granite-js/react-native';
import { useAppSelector } from 'store';
import NavigationBar from '../components/navigation-bar';
import GrayCircle from '../components/design/gray-circle';

export const Route = createRoute('/preset', {
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
            <View style={{paddingHorizontal: 18, paddingVertical: 12, marginTop: 12}}>
              <Button
                type="dark"
                style="weak"
                display="block"
                onPress={() => {
                  navigation.reset({ index: 0, routes: [{ name: `/${import.meta.env.APP_START_MODE}` }] });
                }}
              >
                {'종료하기'}
              </Button>
            </View>
            <View style={{paddingHorizontal: 18, paddingBottom: 20}}>
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
            </View>
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
      point: points[i],
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
        {/* 성향 설명 + Badge 영역 */}
        {sortedTendencyPairs.length >= 1 && (
          <>
            {sortedTendencyPairs.length >= 2 && presetDatas.length >= 2 && (
              <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                다른 일정에 비해{' '}
                <Text typography="t5" fontWeight="medium" color={colors.blue700}>
                  [{calculateTendency(presetTendencyList[index])}]
                </Text>{' '}
                성향이 더 높아요
              </Text>
            )}
            <Flex direction="row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {sortedTendencyPairs
                .slice(0, tendencyViewIndex[index] ? 4 : sortedTendencyPairs.length)
                .map((item, i) => {
                  // 최고점수만 yellow, 나머지는 blue
                  const badgeType = i === 0 ? 'blue' : 'elephant';
                  return (
                    <Badge
                      size="medium"
                      type={badgeType}
                      badgeStyle="weak"
                      key={item.name + item.point}
                    >
                      {item.name + ' '}
                      {item.point}점
                    </Badge>
                  );
                })}
            </Flex>
          </>
        )}

        {/* 타임라인 */}
        <View style={{ flexDirection: 'column', marginTop: 20, marginBottom: 16 }}>
          {item?.map((value, idx) => {
            const isLast = idx === item.length - 1;
            const mainPlace = value[value[0].category == 4 ? 1 : 0].name;
            const subPlaceCount =
              value.filter((itemValue) => !itemValue.name.includes('추천')).length - 1;

            const CIRCLE_SIZE = 8;
            const TIMELINE_WIDTH = 28;
            const LINE_WIDTH = 1.5;
            const ROW_HEIGHT = 56;

            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                {/* 타임라인 (왼쪽 선+원) */}
                <View
                  style={{
                    width: TIMELINE_WIDTH,
                    alignItems: 'center',
                    position: 'relative',
                    height: ROW_HEIGHT,
                  }}
                >
                  <GrayCircle size={CIRCLE_SIZE} />
                  {!isLast && (
                    <View
                      style={{
                        position: 'absolute',
                        top: CIRCLE_SIZE,
                        left: (TIMELINE_WIDTH - LINE_WIDTH) / 2,
                        width: LINE_WIDTH,
                        height: ROW_HEIGHT - CIRCLE_SIZE,
                        backgroundColor: '#E5E7EB',
                      }}
                    />
                  )}
                </View>
                {/* 오른쪽: 1일차 + 장소 */}
                <View style={{ flexDirection: 'row', flex: 1, bottom: 5 }}>
                  <Text
                    typography="t7"
                    color={'#505A69'}
                    style={{
                      width: 50,
                      minWidth: 36,
                      fontWeight: '500',
                      textAlign: 'left',
                    }}
                  >
                    {`${idx + 1}일 차`}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 30 }}>
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
              </View>
            );
          })}
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: 'white',
            width: '100%',
            alignItems: 'center',
            marginBottom: 4,
          }}
          onPress={() => goDetail(index)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                color: colors.blue500,
                fontWeight: '500',
                fontSize: 18,
                letterSpacing: 0,
              }}
            >
              일정 자세히 보기
            </Text>
            <Text
              style={{
                color: colors.blue500,
                fontWeight: 'bold',
                fontSize: 18,
                marginLeft: 6,
              }}
            >
              {'>'}
            </Text>
          </View>
        </TouchableOpacity>
      </Stack.Vertical>
    );
  };

  // 상단 카드: 카테고리 뱃지 3개만 (점수, 성향 등 X)
  const topNames = presetTendencyList[0]?.tendencyNameList || [];

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <View style={{ padding: 28 }}>
        <Image
          source={{ uri: regionInfo.photo }}
          resizeMode="cover"
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            marginBottom: 20,
          }}
        />
        <Text typography="t3" fontWeight="bold" color={colors.grey900}>
          <Text typography="t3" fontWeight="bold" style={{ color: colors.blue700 }}>
            {region[0].split('/').at(-1)}
          </Text>
          {' '}
          {nDay === 0 ? '당일치기' : `${nDay}박 ${nDay + 1}일`} 일정 추천
        </Text>
        <Text typography="t6" fontWeight="regular" color={colors.grey700} style={{marginTop: 6}}>
          나그네님을 위해 알찬 일정을 만들어봤어요!
        </Text>
      </View>

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
            return (
              <Tab.Item key={idx} value={String(idx)}>
                {idx + 1}
              </Tab.Item>
            );
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
