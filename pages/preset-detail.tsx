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
} from "@toss-design-system/react-native";
import moment from "moment";
import React, { useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { BedrockRoute, Stack, useNavigation } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import CustomMapView from "../components/map-view";
import CustomMapViewMarker from "../components/map-view-marker";
import { travelSliceActions } from "../redux/travle-slice";

export const Route = BedrockRoute("/preset-detail", {
  validateParams: (params) => params,
  component: PresetDetail,
});

function PresetDetail() {
  const params = Route.useParams();
  const [tabValue, setTabalue] = useState("0");
  const { presetDatas, presetTendencyList, nDay, day } = useAppSelector(
    (state) => state.travelSlice
  );
  const scrollRef = useRef(null);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const dispatch = useAppDispatch();
  const bottomSheet = useBottomSheet();
  const navigation = useNavigation();
  const goNext = (e: boolean) => {
    try {
      let copy = [...presetDatas[params.index]];
      if (presetDatas[params.index].length != nDay + 1) {
        const check = nDay + 1 - presetDatas[params.index].length;
        for (let i = 0; i < check; i++) {
          copy.push([]);
        }
      }
      dispatch(travelSliceActions.setAutoRecommendFlag(e));
      dispatch(travelSliceActions.enrollTimetable(copy));
      navigation.navigate("/timetable");
    } catch (err) {
      console.log(err, "에러");
    }
  };
  const handleAccommodation = () => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: "center" }}
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
  };
  const handleRecommend = (e: boolean) => {
    bottomSheet.open({
      children: (
        <>
          <Text
            typography="t4"
            fontWeight="bold"
            color={colors.grey800}
            style={{ alignSelf: "center" }}
          >
            잠깐!
          </Text>
          <Text
            typography="t5"
            fontWeight="regular"
            color={colors.grey600}
            style={{ textAlign: "center" }}
          >
            일정을 확정하면 본 결과를 다시 확인하실 수 없습니다.{`\n`}확정하시면
            자동으로 저장됩니다.
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
                        (value.takenTime % 60) !=
                        0 &&
                      (value.takenTime % 60) + "분"
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
                    성향이 높은 일정이에요!
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
