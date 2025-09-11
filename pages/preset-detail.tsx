import { FlatList } from "@react-native-bedrock/native/react-native-gesture-handler";
import {
  BottomSheet,
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  ListRow,
  StepperRow,
  Tab,
  Text,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import moment from "moment";
import React, { useCallback, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { BedrockRoute, Stack, useNavigation } from "react-native-bedrock";
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

// --- CONSTANTS & ROUTE ---
export const Route = BedrockRoute("/preset-detail", {
  validateParams: (params) => params,
  component: PresetDetail,
});
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// --- MAIN COMPONENT ---
function PresetDetail() {
  const params = Route.useParams();
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

  // UI State
  const [tabValue, setTabValue] = useState("0");
  const scrollRef = useRef(null);

  // --- 추천 API ---
  const getRecommendList = async (opts) => {
    try {
      // 기본 추천
      let result = await dispatch(
          region[0].startsWith("해외")
              ? recommendTripadvisor({ ...opts, category: opts.apiCategory, name: opts.status.name })
              : recommendApi({ ...opts, category: opts.apiCategory })
      ).unwrap();
      result = region[0].startsWith("해외") ? result.data : result;

      // 결과 없을 때 재시도(반경 확장)
      if (result.length === 0) {
        result = await dispatch(
            region[0].startsWith("해외")
                ? recommendTripadvisor({ ...opts, category: opts.apiCategory, radius: Number(opts.radius) * 1.5, name: opts.status.name })
                : recommendApi({ ...opts, category: opts.apiCategory, radius: Number(opts.radius) * 1.5 })
        ).unwrap();
        result = region[0].startsWith("해외") ? result.data : result;
        if (result.length === 0) {
          openToast("동선에는 딱 맞는 추천 장소가 아직 없어요");
          return [];
        }
      }

      // 해외일 때 상세정보 조회
      if (region[0].startsWith("해외")) {
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
      navigation.goBack();
      return [];
    }
  };

  // --- 숙소 추천 ---
  const accommodationRecommend = async ({ value, index, idx }) => {
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

    return await getRecommendList({
      name: "숙소 추천",
      x: value.x,
      index,
      y: sequentialArray,
      category: value.category,
      lat, lng,
      apiCategory: region[0].startsWith("해외") ? "hotels" : "AD5",
      radius: 2000,
      backupLat: index !== 0 ? timetable[idx][index - 1].lat : timetable[idx][index + 1].lat,
      backupLng: index !== 0 ? timetable[idx][index - 1].lng : timetable[idx][index + 1].lng,
      status: index !== 0 ? timetable[idx][index - 1] : timetable[idx][index + 1],
    });
  };

  // --- 식당 추천 ---
  const restaurantRecommend = useCallback(async ({ value, index, idx }) => {
    const timetable = presetDatas[params?.index];
    if (timetable[idx].length === 1) return;

    let lat = 0, lng = 0, radius = 2000;
    let status = timetable[idx][index - 1];
    let goCheck = true;

    // 위치/반경 설정
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

    return await getRecommendList({
      name: "식당 추천",
      x: value.x,
      index,
      y: sequentialArray,
      category: value.category,
      lat, lng,
      apiCategory: region[0].startsWith("해외") ? "restaurants" : "FD6",
      radius,
      backupLat: timetable[idx][index - 1]?.lat ?? 0,
      backupLng: timetable[idx][index - 1]?.lng ?? 0,
      status,
    });
  }, [presetDatas, region]);

  // --- DAY별 추천 자동완성 ---
  const handleAutoRecommend = async ({ item, copy, idx }) => {
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
    } catch (e) {}
  };

  // --- 일정 확정/추천 CTA ---
  const goNext = async (autoRecommendFlag) => {
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
      console.log(err, "에러");
    }
  };

  // --- BottomSheet 핸들러들 ---
  const confirmRecommend = (autoRecommendFlag) => bottomSheet.open({
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

  // --- 성향 텍스트 계산 ---
  const calculateTendency = (tendencyObj) => {
    const { tendencyNameList, tendencyRanking } = tendencyObj || {};
    const filteredNames = [], filteredRanks = [];
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

  // --- 탭 이동/스크롤 핸들러 ---
  const onViewableItemsChanged = useRef((items) => {
    setTabValue(String(items?.changed[0]?.index));
  });
  const moveScroll = (e) => {
    scrollRef.current?.scrollToIndex({ index: Number(e), animated: false });
    setTabValue(e);
  };

  // --- 렌더 함수 ---
  const renderItem = ({ item, index }) => (
      <Stack.Vertical
          style={{
            position: "relative",
            borderWidth: 1,
            borderColor: "#eeeeee",
            borderRadius: 13,
            paddingHorizontal: 24,
            paddingVertical: 20,
            marginTop: 10,
            marginHorizontal: 24,
          }}
      >
        <Text typography="t5" fontWeight="medium" color={colors.blue700}>
          {moment(day[index]).format("YY-MM-DD") + " "}({WEEKDAYS[moment(day[index]).days()]})
        </Text>
        <View style={{ height: 20 }} />
        {item?.map((value, idx) => (
            <StepperRow
                key={idx}
                hideLine={idx === item.length - 1}
                left={<StepperRow.NumberIcon number={idx + 1} />}
                center={
                  <StepperRow.Texts
                      type="A"
                      title={value.name + " "}
                      description={
                        !value.name.includes("추천")
                            ? Math.floor(value.takenTime / 60) !== 0
                                ? `${Math.floor(value.takenTime / 60)}시간${value.takenTime % 60 !== 0 ? `${value.takenTime % 60}분` : ""}`
                                : ""
                            : ""
                      }
                  />
                }
            />
        ))}
      </Stack.Vertical>
  );

  // --- MAIN RENDER ---
  return (
      <View style={{ flex: 1 }}>
        <NavigationBar />
        <FixedBottomCTAProvider>
          {presetTendencyList[params?.index]?.tendencyNameList.length >= 2 && (
              <ListRow
                  left={
                    <ListRow.Image
                        width={24}
                        height={24}
                        type="default"
                        source={{ uri: "https://static.toss.im/2d-emojis/png/4x/u1F31F.png" }}
                    />
                  }
                  contents={
                    <ListRow.Texts
                        type="2RowTypeA"
                        top={`${params?.index + 1}번 일정`}
                        bottom={
                          <Text typography="t6" fontWeight="regular" color={colors.grey600}>
                            <Text typography="t6" fontWeight="regular" color={colors.blue500}>
                              [{calculateTendency(presetTendencyList[params.index])}]
                            </Text>{" "}
                            성향이 높은 일정이에요
                          </Text>
                        }
                        topProps={{ color: colors.grey800 }}
                        bottomProps={{ color: colors.grey600 }}
                    />
                  }
              />
          )}

          <CustomMapViewMarker
              presetData={presetDatas[params?.index]}
              selectedIndex={tabValue}
              isWideZoom={false}
          />

          <Tab fluid size="large" onChange={moveScroll} value={tabValue} style={{ marginTop: 5 }}>
            {Array.from({ length: presetDatas[params?.index].length }, (_, idx) =>
                <Tab.Item key={idx} value={String(idx)}>DAY {idx + 1}</Tab.Item>
            )}
          </Tab>

          <FlatList
              keyExtractor={(_, index) => index.toString()}
              style={{ height: 400 }}
              ref={scrollRef}
              data={presetDatas[params?.index]}
              onScrollToIndexFailed={info => setTimeout(() => {
                scrollRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 500)}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
              renderItem={renderItem}
          />

          <FixedBottomCTA onPress={handleAccommodation}>
            이 여행 일정 선택하기
          </FixedBottomCTA>
        </FixedBottomCTAProvider>
      </View>
  );
}
