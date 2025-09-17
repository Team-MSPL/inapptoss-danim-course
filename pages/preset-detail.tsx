import { FlatList } from "@react-native-bedrock/native/react-native-gesture-handler";
import {
  BottomSheet,
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Tab,
  Text,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import React, { useCallback, useRef, useState } from "react";
import { View, NativeSyntheticEvent, NativeScrollEvent, Animated, Dimensions } from "react-native";
import { BedrockRoute, useNavigation } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import CustomMapViewMarker from "../components/map-view-marker";
import {
  detailTripadvisor,
  recommendApi,
  recommendTripadvisor,
  travelSliceActions,
} from "../redux/travle-slice";
import { useDistance } from "../hooks/useDistance";
import { CommonActions } from "@react-native-bedrock/native/@react-navigation/native";
import NavigationBar from "../components/navigation-bar";
import { PresetTendencyHeader } from "../components/preset-detail/PresetTendencyHeader";
import { PresetDayCard } from "../components/preset-detail/PresetDayCard";
import ArrowToggleButton from "../components/timetable/ArrowToggleButton";

interface RecommendOptions {
  value: any;
  index: number;
  idx: number;
}

interface HandleAutoRecommendOptions {
  item: any[];
  copy: any[];
  idx: number;
}

interface TendencyObj {
  tendencyNameList: string[];
  tendencyRanking: number[];
}

export const Route = BedrockRoute("/preset-detail", {
  validateParams: (params: any) => params,
  component: PresetDetail,
});

function PresetDetail() {
  const params = Route.useParams() as { index: number };
  const {
    presetDatas,
    presetTendencyList,
    nDay,
    day,
    region,
  } = useAppSelector((state) => state.travelSlice);

  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const bottomSheet = useBottomSheet();
  const { open: openToast } = useToast();

  const [tabValue, setTabValue] = useState<string>("0");
  const [itemLayouts, setItemLayouts] = useState<number[]>([]);
  const scrollRef = useRef<FlatList<any>>(null);

  // 지도 높이 애니메이션 관련
  const defaultHeight = (Dimensions.get("window").height * 240) / 812;
  const [isMapOpen, setIsMapOpen] = useState(true);
  const animatedHeight = useRef(new Animated.Value(defaultHeight)).current;

  const handleToggleMapHeight = () => {
    const toValue = isMapOpen ? 0 : defaultHeight;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 350,
      useNativeDriver: false,
    }).start();
    setIsMapOpen(!isMapOpen);
  };

  // ----------------------
  // 추천 관련 핸들러
  // ----------------------

  const getRecommendList = async (opts: any): Promise<any[]> => {
    try {
      const isOverseas = region[0].startsWith("해외");
      let result = await dispatch(
          isOverseas
              ? recommendTripadvisor({ ...opts, category: opts.apiCategory, name: opts.status.name })
              : recommendApi({ ...opts, category: opts.apiCategory }),
      ).unwrap();
      result = isOverseas ? result.data : result;
      if (!result.length) {
        result = await dispatch(
            isOverseas
                ? recommendTripadvisor({ ...opts, category: opts.apiCategory, radius: Number(opts.radius) * 1.5, name: opts.status.name })
                : recommendApi({ ...opts, category: opts.apiCategory, radius: Number(opts.radius) * 1.5 }),
        ).unwrap();
        result = isOverseas ? result.data : result;
        if (!result.length) {
          openToast("동선에는 딱 맞는 추천 장소가 아직 없어요");
          navigation.reset({ index: 0, routes: [{ name: "/" }] });
          return [];
        }
      }
      if (isOverseas) {
        const copy = await dispatch(detailTripadvisor({ id: result[0].location_id })).unwrap();
        result = [{
          ...result,
          place_name: copy.name,
          y: copy.latitude,
          x: copy.longitude,
        }, {}];
      }
      return result;
    } catch (err) {
      openToast("동선에는 딱 맞는 추천 장소가 아직 없어요");
      navigation.reset({ index: 0, routes: [{ name: "/" }] })
      return [];
    }
  };

  const accommodationRecommend = async ({ value, index, idx }: RecommendOptions): Promise<any> => {
    const timetable = presetDatas[params?.index];
    if (timetable[idx].length < 2) return;

    let lat = 0, lng = 0, goCheck = true;
    if (index === 0) {
      if (timetable[idx][index + 1].name.includes("추천")) goCheck = false;
      else {
        lat = timetable[idx][index + 1].lat;
        lng = timetable[idx][index + 1].lng;
      }
    } else {
      if (timetable[idx][index - 1].name.includes("추천")) goCheck = false;
      else {
        lat = timetable[idx][index - 1].lat;
        lng = timetable[idx][index - 1].lng;
      }
    }
    if (!goCheck) return;

    const startNumber = value.y;
    const count = value.takenTime / 30;
    const sequentialArray = Array.from({ length: count }, (_, i) => startNumber + i);

    return getRecommendList({
      name: "숙소 추천",
      x: value.x,
      index,
      y: sequentialArray,
      category: value.category,
      lat,
      lng,
      apiCategory: region[0].startsWith("해외") ? "hotels" : "AD5",
      radius: 2000,
      backupLat: index !== 0 ? timetable[idx][index - 1].lat : timetable[idx][index + 1].lat,
      backupLng: index !== 0 ? timetable[idx][index - 1].lng : timetable[idx][index + 1].lng,
      status: index !== 0 ? timetable[idx][index - 1] : timetable[idx][index + 1],
    });
  };

  const restaurantRecommend = useCallback(async ({ value, index, idx }: RecommendOptions): Promise<any> => {
    const timetable = presetDatas[params?.index];
    if (timetable[idx].length === 1) return;

    let lat = 0, lng = 0, radius = 2000;
    let status = timetable[idx][index - 1];
    let goCheck = true;

    if (index === timetable[idx].length - 1) {
      if (timetable[idx][timetable[idx].length - 2].name.includes("추천")) goCheck = false;
      else {
        lat = timetable[idx][timetable[idx].length - 2].lat;
        lng = timetable[idx][timetable[idx].length - 2].lng;
        status = timetable[idx][timetable[idx].length - 2];
      }
    } else if (index === 0) {
      if (timetable[idx][1].name.includes("추천")) goCheck = false;
      else {
        lat = timetable[idx][1].lat;
        lng = timetable[idx][1].lng;
        status = timetable[idx][1];
      }
    } else {
      const departure = { lat: timetable[idx][index - 1].lat, lng: timetable[idx][index - 1].lng };
      const arrival = { lat: timetable[idx][index + 1].lat, lng: timetable[idx][index + 1].lng };
      const distance = Math.ceil(useDistance({ departure, arrival }));
      lat = (departure.lat + arrival.lat) / 2;
      lng = (departure.lng + arrival.lng) / 2;
      radius = distance >= 20 ? 20000 : distance === 0 ? 2000 : distance * 1000;
      if (timetable[idx][index - 1].name.includes("추천") && timetable[idx][index + 1].name.includes("추천")) goCheck = false;
      else if (timetable[idx][index - 1].name.includes("추천")) status = timetable[idx][index + 1];
      else if (timetable[idx][index + 1].name.includes("추천")) status = timetable[idx][index - 1];
    }
    if (!goCheck) return;

    const startNumber = value.y;
    const count = value.takenTime / 30;
    const sequentialArray = Array.from({ length: count }, (_, i) => startNumber + i);

    return getRecommendList({
      name: "식당 추천",
      x: value.x,
      index,
      y: sequentialArray,
      category: value.category,
      lat,
      lng,
      apiCategory: region[0].startsWith("해외") ? "restaurants" : "FD6",
      radius,
      backupLat: timetable[idx][index - 1]?.lat ?? 0,
      backupLng: timetable[idx][index - 1]?.lng ?? 0,
      status,
    });
  }, [presetDatas, region, params?.index]);

  const handleAutoRecommend = async ({ item, copy, idx }: HandleAutoRecommendOptions): Promise<any[]> => {
    try {
      let updated = [...item];
      const handleItems = item.map(async (value, index) => {
        if (value.name === "점심 추천" || value.name === "저녁 추천") {
          const items = await restaurantRecommend({ value, index, idx });
          if (items?.length) {
            const checks = updated.filter(checkValue => items[0].place_name === checkValue.name);
            const itemData = items[checks.length === 0 ? 0 : 1];
            updated[index] = {
              ...updated[index],
              name: itemData.place_name,
              lat: Number(itemData.y),
              lng: Number(itemData.x),
              category: value.category,
              x: value.x,
              y: value.y,
              id: Number(itemData.y) + updated[index]?.name,
            };
          } else openToast("동선에는 딱 맞는 추천 장소가 아직 없어요");
        } else if (value.name === "숙소 추천" && index !== 0) {
          const items = await accommodationRecommend({ value, index, idx });
          if (items?.length) {
            const itemData = items[0];
            updated[index] = {
              ...updated[index],
              name: itemData.place_name,
              lat: Number(itemData.y),
              lng: Number(itemData.x),
              category: value.category,
              x: value.x,
              y: value.y,
              id: Number(itemData.y) + updated[index]?.name,
            };
          } else openToast("동선에는 딱 맞는 추천 장소가 아직 없어요");
        } else if (index === 0 && value.name === "숙소 추천") {
          const lastDay = copy[idx - 1]?.[copy[idx - 1].length - 1];
          if (lastDay?.category === value.category && lastDay?.name !== "숙소 추천") {
            updated[index] = {
              ...updated[index],
              name: lastDay.name,
              lat: Number(lastDay.lat),
              lng: Number(lastDay.lng),
              category: value.category,
              x: value.x,
              y: value.y,
              id: Number(lastDay.lat) + updated[index]?.name,
            };
          }
        }
      });
      await Promise.all(handleItems);
      return updated;
    } catch (e) {
      console.error(e);
      return item;
    }
  };

  // ----------------------
  // 기타 핸들러
  // ----------------------

  const handleItemLayout = (event: { nativeEvent: { layout: { height: number } } }, idx: number) => {
    const { height } = event.nativeEvent.layout;
    setItemLayouts(prev => {
      const copy = [...prev];
      copy[idx] = height;
      return copy;
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    let sum = 0, index = 0;
    for (let i = 0; i < itemLayouts.length; i++) {
      sum += itemLayouts[i] || 0;
      if (offsetY < sum) {
        index = i;
        break;
      }
    }
    setTabValue(String(index));
  };

  const [tabPressed, setTabPressed] = useState(false);

  const moveScroll = (e: string) => {
    setTabPressed(true);
    scrollRef.current?.scrollToIndex({ index: Number(e), animated: false });
    setTabValue(e);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (tabPressed) {
      setTabPressed(false);
      return;
    }
    if (viewableItems?.length > 0) {
      setTabValue(String(viewableItems[0].index));
    }
  });

  // ----------------------
  // 성향 계산 함수
  // ----------------------

  const calculateTendency = (tendencyObj: TendencyObj): string => {
    const { tendencyNameList, tendencyRanking } = tendencyObj || {};
    const filteredNames: string[] = [], filteredRanks: number[] = [];
    tendencyNameList?.forEach((item, idx) => {
      if (!["봄", "여름", "가을", "겨울"].includes(item)) {
        filteredNames.push(item);
        filteredRanks.push(tendencyRanking[idx]);
      }
    });
    let min = 100, minIdx = -1, nextMin = 100, nextMinIdx = -1;
    filteredRanks.forEach((item, idx) => {
      if (item <= min) {
        nextMin = min; nextMinIdx = minIdx;
        min = item; minIdx = idx;
      } else if (item <= nextMin) {
        nextMin = item; nextMinIdx = idx;
      }
    });
    return (tendencyNameList[minIdx] ?? "") +
        (tendencyNameList[nextMinIdx] ? ", " + tendencyNameList[nextMinIdx] : "");
  };

  // ----------------------
  // CTA/BottomSheet 로직
  // ----------------------

  const [isLoading, setIsLoading] = useState(false);

  const goNext = async (autoRecommendFlag: boolean) => {
    setIsLoading(true);
    try {
      let copy = [...presetDatas[params.index]];
      if (copy.length !== nDay + 1) {
        copy = [...copy, ...Array(nDay + 1 - copy.length).fill([])];
      }
      dispatch(travelSliceActions.setAutoRecommendFlag(autoRecommendFlag));
      if (autoRecommendFlag) {
        await copy.reduce(async (prev, item, idx) => {
          await prev;
          copy[idx] = await handleAutoRecommend({ item, copy, idx });
        }, Promise.resolve());
      }
      dispatch(travelSliceActions.enrollTimetable(copy));
      navigation.dispatch(CommonActions.reset({
        index: 0,
        routes: [{ name: "/timetable" }],
      }));
    } catch (err) {
      console.error(err, "에러");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRecommend = (autoRecommendFlag: boolean) => bottomSheet.open({
    children: (
        <>
          <Text typography="t4" fontWeight="bold" color={colors.grey800} style={{ alignSelf: "center", marginTop: 35 }}>잠깐</Text>
          <Text typography="t5" fontWeight="regular" color={colors.grey600} style={{ textAlign: "center" }}>
            일정을 확정하면 본 결과를{`\n`}다시 확인하실 수 없어요
          </Text>
          <BottomSheet.CTA.Double
              leftButton={
                <Button type="dark" style="weak" display="block" onPress={bottomSheet.close}>아니오</Button>
              }
              rightButton={
                <Button type="primary" style="fill" display="block" onPress={() => { goNext(autoRecommendFlag); bottomSheet.close(); }}>네</Button>
              }
          />
        </>
    ),
  });

  const handleAccommodation = () => {
    if (nDay === 0) confirmRecommend(false);
    else {
      bottomSheet.open({
        children: (
            <>
              <Text typography="t4" fontWeight="bold" color={colors.grey800} style={{ alignSelf: "center", marginTop: 35 }}>
                식당과 숙소까지 한번에{`\n`}추천해드릴까요?
              </Text>
              <Text typography="t5" fontWeight="regular" color={colors.grey600} style={{ textAlign: "center" }}>
                별점이 높은 곳부터 추천해드려요
              </Text>
              <BottomSheet.CTA.Double
                  leftButton={
                    <Button type="dark" style="weak" display="block" onPress={() => { confirmRecommend(false); bottomSheet.close(); }}>아니오</Button>
                  }
                  rightButton={
                    <Button type="primary" style="fill" display="block" onPress={() => { confirmRecommend(true); bottomSheet.close(); }}>네</Button>
                  }
              />
            </>
        ),
      });
    }
  };

  return (
      <View style={{ flex: 1 }}>
        <NavigationBar />
        <FixedBottomCTAProvider>
          <PresetTendencyHeader
              index={params?.index}
              tendencyList={presetTendencyList}
              calculateTendency={calculateTendency}
          />
          <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
            <CustomMapViewMarker
                presetData={presetDatas[params?.index]}
                selectedIndex={tabValue}
                isWideZoom={false}
                height={null}
            />
          </Animated.View>
          <View
              onTouchEnd={handleToggleMapHeight}
              style={{
                width: Dimensions.get("window").width,
                height: 40,
                backgroundColor: 'white',
                alignItems: "center",
                justifyContent: "center"
              }}
          >
            <ArrowToggleButton expanded={isMapOpen} onPress={handleToggleMapHeight} />
          </View>
          <Tab
              fluid
              size="large"
              onChange={moveScroll}
              value={tabValue}
              style={{ marginTop: 5 }}
          >
            {Array.from({ length: presetDatas[params?.index].length }, (_, idx) =>
                <Tab.Item key={idx} value={String(idx)}>DAY {idx + 1}</Tab.Item>
            )}
          </Tab>
          <FlatList
              keyExtractor={(_, index) => index.toString()}
              ref={scrollRef}
              style={
                isMapOpen ? { flex: 1, height: 400 } : { flex: 1 }
              }
              data={presetDatas[params?.index]}
              onScrollToIndexFailed={info => setTimeout(() => {
                scrollRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 500)}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item, index }) => (
                  <PresetDayCard
                      item={item}
                      index={index}
                      day={day}
                      handleItemLayout={handleItemLayout}
                  />
              )}
          />
          <FixedBottomCTA
              onPress={handleAccommodation}
              disabled={isLoading}
          >
            {isLoading ? "잠시만 기다려주세요..." : "이 여행 일정 선택하기"}
          </FixedBottomCTA>
        </FixedBottomCTAProvider>
      </View>
  );
}

export default PresetDetail;