import { FlatList } from "@react-native-bedrock/native/react-native-gesture-handler";
import {
  BottomCTA,
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
import CustomMapView from "../components/map-view";
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

export const Route = BedrockRoute("/preset-detail", {
  validateParams: (params) => params,
  component: PresetDetail,
});

function PresetDetail() {
  const params = Route.useParams();
  const [tabValue, setTabalue] = useState("0");
  const { presetDatas, presetTendencyList, nDay, day, region } = useAppSelector(
    (state) => state.travelSlice
  );
  const scrollRef = useRef(null);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const dispatch = useAppDispatch();
  const bottomSheet = useBottomSheet();
  const navigation = useNavigation();
  const { open } = useToast();

  const accommodationRecommend = async (e: {
    value: any;
    index: number;
    idx: number;
  }) => {
    try {
      let timetable = presetDatas[params?.index];
      if (timetable[e.idx].length < 2) {
      } else {
        let lat = 0;
        let lng = 0;
        let goCheck = true;
        if (e.index == 0) {
          if (timetable[e.idx][e.index + 1].name.includes("추천")) {
            goCheck = false;
          } else {
            lat = timetable[e.idx][e.index + 1].lat;
            lng = timetable[e.idx][e.index + 1].lng;
          }
        } else {
          if (timetable[e.idx][e.index - 1].name.includes("추천")) {
            goCheck = false;
          } else {
            lat = timetable[e.idx][e.index - 1].lat;
            lng = timetable[e.idx][e.index - 1].lng;
          }
        }
        if (goCheck) {
          const startNumber = e.value.y; // 시작 숫자
          const count = e.value.takenTime / 30; // 원하는 갯수
          const sequentialArray = Array.from(
            { length: count },
            (_, index) => startNumber + index
          );
          const data = await getRecommendList({
            name: "숙소 추천",
            x: e.value.x,
            index: e.index,
            y: sequentialArray,
            category: e.value.category,
            lat: lat,
            lng: lng,
            apiCategory: region[0].startsWith("해외") ? "hotels" : "AD5",
            radius: 2000,
            backupLat:
              e.index != 0
                ? timetable[e.idx][e.index - 1].lat
                : timetable[e.idx][e.index + 1].lat,
            backupLng:
              e.index != 0
                ? timetable[e.idx][e.index - 1].lng
                : timetable[e.idx][e.index + 1].lng,
            status:
              e.index != 0
                ? timetable[e.idx][e.index - 1]
                : timetable[e.idx][e.index + 1],
          });
          return data;
        } else {
          // dispatch(
          // 	modalSliceActions.setOpenModal({
          // 		modalTitle: '추천이 불가합니다.',
          // 		modalSubTitle: '앞,뒤 관광지를 바탕으로 추천을 해드려요\n관광지를 추가한 후 시도해주세요',
          // 	}),
          // );
        }
      }
    } catch (e) {}
  };

  const getRecommendList = async (e: {
    name: string;
    x: number;
    index: number;
    y: number;
    category: string;
    lat: number;
    lng: number;
    apiCategory: string;
    radius: number;
    backupLat: number;
    backupLng: number;
    status: any;
  }) => {
    try {
      let result = await dispatch(
        region[0].startsWith("해외")
          ? recommendTripadvisor({
              category: e.apiCategory,
              lat: e.lat,
              lng: e.lng,
              radius: e.radius,
              name: e.status.name,
            })
          : recommendApi({
              category: e.apiCategory,
              lat: e.lat,
              lng: e.lng,
              radius: e.radius,
            })
      ).unwrap();
      result = region[0].startsWith("해외") ? result.data : result;
      if (result.length == 0) {
        result = await dispatch(
          region[0].startsWith("해외")
            ? recommendTripadvisor({
                category: e.apiCategory,
                lat: e.lat,
                lng: e.lng,
                radius: Number(e.radius) * 1.5,
                name: e.status.name,
              })
            : recommendApi({
                category: e.apiCategory,
                lat: e.lat,
                lng: e.lng,
                radius: Number(e.radius) * 1.5,
              })
        ).unwrap();
        result = region[0].startsWith("해외") ? result.data : result;
        result.length == 0 && open("동선에는 딱 맞는 추천 장소가 아직 없어요");
        return [];
      }
      if (region[0].startsWith("해외")) {
        let copy = await dispatch(
          detailTripadvisor({ id: result[0].location_id })
        ).unwrap();
        console.log(copy);
        result = [
          {
            ...result,
            place_name: copy.name,
            y: copy.latitude,
            x: copy.longitude,
          },
          {},
        ];
      }
      return result;
    } catch (err) {
      open("동선에는 딱 맞는 추천 장소가 아직 없어요");
      navigation.goBack();
    } finally {
      // dispatch(LoadingSliceActions.offLoading());
    }
  };

  const restaurantRecommend = useCallback(
    async (e: { value: any; index: number; idx: number }) => {
      let timetable = presetDatas[params?.index];
      try {
        let lat = 0;
        let lng = 0;
        let radius = 2000;
        let status = timetable[e.idx][e.index - 1];
        let goCheck = true;
        if (timetable[e.idx].length == 1) {
        } else {
          if (e.index == timetable[e.idx].length - 1) {
            if (
              timetable[e.idx][timetable[e.idx].length - 2].name.includes(
                "추천"
              )
            ) {
              goCheck = false;
            } else {
              lat = timetable[e.idx][timetable[e.idx].length - 2].lat;
              lng = timetable[e.idx][timetable[e.idx].length - 2].lng;
              status = timetable[e.idx][timetable[e.idx].length - 2];
            }
          } else if (e.index == 0) {
            if (timetable[e.idx][1].name.includes("추천")) {
              goCheck = false;
            } else {
              lat = timetable[e.idx][1].lat;
              lng = timetable[e.idx][1].lng;
              status = timetable[e.idx][1];
            }
          } else {
            const departure = {
              lat: timetable[e.idx][e.index - 1].lat,
              lng: timetable[e.idx][e.index - 1].lng,
            };
            const arrival = {
              lat: timetable[e.idx][e.index + 1].lat,
              lng: timetable[e.idx][e.index + 1].lng,
            };
            const distance = Math.ceil(
              useDistance({ departure: departure, arrival: arrival })
            );
            lat =
              (timetable[e.idx][e.index - 1].lat +
                timetable[e.idx][e.index + 1].lat) /
              2;
            lng =
              (timetable[e.idx][e.index - 1].lng +
                timetable[e.idx][e.index + 1].lng) /
              2;
            radius =
              distance >= 20 ? 20000 : distance == 0 ? 2000 : distance * 1000;
            if (
              timetable[e.idx][e.index - 1].name.includes("추천") &&
              timetable[e.idx][e.index + 1].name.includes("추천")
            ) {
              goCheck = false;
            } else if (timetable[e.idx][e.index - 1].name.includes("추천")) {
              status = timetable[e.idx][e.index + 1];
            } else if (timetable[e.idx][e.index + 1].name.includes("추천")) {
              status = timetable[e.idx][e.index - 1];
            }
          }
          if (goCheck) {
            const startNumber = e.value.y; // 시작 숫자
            const count = e.value.takenTime / 30; // 원하는 갯수

            const sequentialArray = Array.from(
              { length: count },
              (_, index) => startNumber + index
            );
            const data = await getRecommendList({
              name: "식당 추천",
              x: e.value.x,
              index: e.index,
              y: sequentialArray,
              category: e.value.category,
              lat: lat,
              lng: lng,
              apiCategory: region[0].startsWith("해외") ? "restaurants" : "FD6",
              radius: radius,
              backupLat: timetable[e.idx][e.index - 1]?.lat ?? 0,
              backupLng: timetable[e.idx][e.index - 1]?.lng ?? 0,
              status: status,
            });
            return data;
          } else {
            // dispatch(
            // 	modalSliceActions.setOpenModal({
            // 		modalTitle: '추천이 불가합니다.',
            // 		modalSubTitle: '앞,뒤 관광지를 바탕으로 추천을 해드려요\n관광지를 추가한 후 시도해주세요',
            // 	}),
            // );
          }
        }
      } catch (e) {}
    },
    [presetDatas, region]
  );

  const handleAutoRecommend = async ({ item, copy, idx }: any) => {
    try {
      let copy2 = [...item];
      const handleItems = item.map(async (value, index) => {
        if (value.name == "점심 추천" || value.name == "저녁 추천") {
          let items = await restaurantRecommend({
            value: value,
            index: index,
            idx: idx,
          });
          if (items?.length != 0) {
            let checks = copy2.filter((checkValue, checkIndex) => {
              items[0].place_name == checkValue.name;
            });
            items = items[checks.length == 0 ? 0 : 1];
            copy2[index] = {
              ...copy2[index],
              name: items.place_name,
              lat: Number(items.y),
              lng: Number(items.x),
              category: value.category,
              x: value.x,
              y: value.y,
              id: Number(items.y) + copy2[index]?.name,
            };
          } else {
            open("동선에는 딱 맞는 추천 장소가 아직 없어요");
          }
        } else if (value.name == "숙소 추천" && index != 0) {
          let items = await accommodationRecommend({
            value: value,
            index: index,
            idx: idx,
          });
          if (items?.length != 0) {
            items = items[0];
            copy2[index] = {
              ...copy2[index],
              name: items.place_name,
              lat: Number(items.y),
              lng: Number(items.x),
              category: value.category,
              x: value.x,
              y: value.y,
              id: Number(items.y) + copy2[index]?.name,
            };
          } else {
            open("동선에는 딱 맞는 추천 장소가 아직 없어요");
          }
        } else if (index == 0 && value.name == "숙소 추천") {
          if (
            copy[idx - 1].at(-1)?.category == value.category &&
            copy[idx - 1].at(-1)?.name != "숙소 추천"
          ) {
            copy2[index] = {
              ...copy2[index],
              name: copy[idx - 1].at(-1)?.name,
              lat: Number(copy[idx - 1].at(-1)?.lat),
              lng: Number(copy[idx - 1].at(-1)?.lng),
              category: value.category,
              x: value.x,
              y: value.y,
              id: Number(copy[idx - 1].at(-1)?.lat) + copy2[index]?.name,
            };
          }
        }
      });
      await Promise.all(handleItems);
      return copy2;
    } catch (e: any) {
    } finally {
      // dispatch(LoadingSliceActions.offLoading());
    }
  };

  const goNext = async (e: boolean) => {
    try {
      let copy = [...presetDatas[params.index]];
      if (presetDatas[params.index].length != nDay + 1) {
        const check = nDay + 1 - presetDatas[params.index].length;
        for (let i = 0; i < check; i++) {
          copy.push([]);
        }
      }
      dispatch(travelSliceActions.setAutoRecommendFlag(e));
      if (e) {
        await copy.reduce(async (prev, item, idx) => {
          await prev;
          const newElem = await handleAutoRecommend({ item, copy, idx });
          copy[idx] = newElem;
        }, Promise.resolve());
      }
      dispatch(travelSliceActions.enrollTimetable(copy));
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "/timetable" }],
        })
      );
    } catch (err) {
      console.log(err, "에러");
    }
  };
  const handleAccommodation = () => {
    if (nDay == 0) {
      handleRecommend(false);
    } else {
      bottomSheet.open({
        children: (
          <>
            <Text
              typography="t4"
              fontWeight="bold"
              color={colors.grey800}
              style={{ alignSelf: "center", marginTop: 35}}
            >
              식당과 숙소까지 한번에{`\n`}추천해드릴까요?
            </Text>
            <Text
              typography="t5"
              fontWeight="regular"
              color={colors.grey600}
              style={{ textAlign: "center" }}
            >
              별점이 높은 곳부터 추천해드려요
            </Text>
            <BottomSheet.CTA.Double
              leftButton={
                <Button
                  type="dark"
                  style="weak"
                  display="block"
                  onPress={() => {
                    handleRecommend(false);
                    bottomSheet.close();
                  }}
                >
                  {"아니오"}
                </Button>
              }
              rightButton={
                <Button
                  type="primary"
                  style="fill"
                  display="block"
                  onPress={() => {
                    handleRecommend(true);
                    bottomSheet.close();
                  }}
                >
                  {"네"}
                </Button>
              }
            ></BottomSheet.CTA.Double>
          </>
        ),
      });
    }
  };
  const handleRecommend = (e: boolean) => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: "center", marginTop:35 }}
          >
            잠깐
          </Text>
          <Text
            typography="t5"
            fontWeight="regular"
            color={colors.grey600}
            style={{ textAlign: "center" }}
          >
            일정을 확정하면 본 결과를{`\n`}다시 확인하실 수 없어요
          </Text>
          <BottomSheet.CTA.Double
            leftButton={
              <Button
                type="dark"
                style="weak"
                display="block"
                onPress={() => {
                  bottomSheet.close();
                }}
              >
                {"아니오"}
              </Button>
            }
            rightButton={
              <Button
                type="primary"
                style="fill"
                display="block"
                onPress={() => {
                  goNext(e);
                  bottomSheet.close();
                }}
              >
                {"네"}
              </Button>
            }
          ></BottomSheet.CTA.Double>
        </>
      ),
    });
  };
  const calculateTendency = (e: any) => {
    let copy = [];
    let copy2 = [];
    e?.tendencyNameList?.forEach((item, idx) => {
      if (!["봄", "여름", "가을", "겨울"].includes(item)) {
        copy.push(item);
        copy2.push(e.tendencyRanking[idx]);
      }
    });
    let min = 100;
    let minIndex = -1;
    let nextMin = 100;
    let nextMinIndex = -1;
    console.log(copy, copy2);
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
      (e?.tendencyNameList[minIndex] ?? "") +
      (e?.tendencyNameList[nextMinIndex]
        ? ", " + e?.tendencyNameList[nextMinIndex]
        : "");
    return result;
  };
  const onViewableItemsChanged = useRef((items) => {
    setTabalue(String(items?.changed[0]?.index));
  });
  const moveScroll = (e) => {
    scrollRef.current?.scrollToIndex({
      index: Number(e),
      animated: false,
    });
    setTabalue(e);
  };

  const renderItem = ({ item, index }) => {
    return (
      <Stack.Vertical
        style={{
          position: "relative", // ← 이걸 추가
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
          {moment(day[index]).format("YY-MM-DD") + " "}(
          {weekdays[moment(day[index]).days()]})
        </Text>
        <View style={{ height: 20 }}></View>
        {item?.map((value, idx) => (
          <StepperRow
            hideLine={idx == item.length - 1}
            left={<StepperRow.NumberIcon number={idx + 1} />}
            center={
              <StepperRow.Texts
                type="A"
                title={value.name + " "}
                description={
                  !value.name.includes("추천")
                    ? Math.floor(value.takenTime / 60) != 0 &&
                      Math.floor(value.takenTime / 60) +
                        "시간" +
                        (value.takenTime % 60 != 0
                          ? (value.takenTime % 60) + "분"
                          : "")
                    : ""
                }
              />
            }
          />
        ))}
      </Stack.Vertical>
    );
  };
  const [layoutHeights, setLayoutHeights] = useState({
    listRow: 0,
    map: 0,
    tab: 0,
    cta: 0,
  });

  const totalFixedHeight =
    layoutHeights.listRow +
    layoutHeights.map +
    layoutHeights.tab +
    layoutHeights.cta;

  const screenHeight = Dimensions.get("window").height;
  const flatListHeight = screenHeight - totalFixedHeight;

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
                source={{
                  uri: "https://static.toss.im/2d-emojis/png/4x/u1F31F.png",
                }}
              />
            }
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={params?.index + 1 + "번 일정"}
                // bottom={calculateTendency(presetTendencyList[params.index])}
                bottom={
                  <Text
                    typography="t6"
                    fontWeight="regular"
                    color={colors.grey600}
                  >
                    <Text
                      typography="t6"
                      fontWeight="regular"
                      color={colors.blue500}
                    >
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

        <Tab
          fluid
          size="large"
          onChange={(e) => {
            moveScroll(e);
          }}
          value={tabValue}
          style={{ marginTop: 5 }}
        >
          {[
            ...Array.from(
              { length: presetDatas[params?.index].length },
              (item, index) => index
            ),
          ].map((item, idx) => {
            return <Tab.Item value={String(idx)}>DAY {idx + 1}</Tab.Item>;
          })}
        </Tab>
        <FlatList
          keyExtractor={(_, index) => index.toString()}
          style={{ height: 400 }}
          ref={scrollRef}
          data={presetDatas[params?.index]}
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
            itemVisiblePercentThreshold: 80, // 50% 이상 보이면 감지
          }}
          renderItem={renderItem}
        ></FlatList>
        <FixedBottomCTA onPress={handleAccommodation}>
          이 여행 일정 선택하기
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}
