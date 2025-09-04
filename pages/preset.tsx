import {
  FlatList,
  ScrollView,
} from "@react-native-bedrock/native/react-native-gesture-handler";
import {
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
} from "@toss-design-system/react-native";
import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import {
  BedrockRoute,
  closeView,
  Flex,
  Image,
  Stack,
  useBackEvent,
  useNavigation,
} from "react-native-bedrock";
import { useAppSelector } from "store";
import NavigationBar from "../components/navigation-bar";

export const Route = BedrockRoute("/preset", {
  validateParams: (params) => params,
  component: Preset,
});

function Preset() {
  const { presetDatas, regionInfo, region, presetTendencyList, nDay } =
    useAppSelector((state) => state.travelSlice);
  const [tabValue, setTabalue] = useState("0");
  const scrollRef = useRef(null);
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
              style={{ alignSelf: "center" }}
            >
              저장이 필요해요
            </Text>
            <Text
              typography="t5"
              fontWeight="regular"
              color={colors.grey600}
              style={{ textAlign: "center" }}
            >
              홈으로 이동시 지역 추천이 끝나요.{`\n`}일정 선택 후에 종료해야
              저장 할 수 있어요.
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
                  {"종료하기"}
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
                  {"선택하러 가기"}
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
    navigation.navigate("/preset-detail", { index: e });
  };
  const onViewableItemsChanged = useRef((items) => {
    console.log(items?.changed[0]?.index);
    setTabalue(String(items?.changed[0]?.index));
  });
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
  const [tendencyViewIndex, setTendencyViewIndex] = useState<boolean[]>(
    Array(presetDatas.length).fill(true)
  );
  const renderItem = ({ item, index }) => {
    return (
      <>
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
          {presetTendencyList[index]?.tendencyNameList.length >= 1 && (
            <>
              {presetTendencyList[index]?.tendencyNameList.length >= 2 &&
                presetDatas.length >= 2 && (
                  <Text
                    typography="t5"
                    fontWeight="medium"
                    color={colors.grey800}
                  >
                    다른 일정에 비해
                    <Text
                      typography="t5"
                      fontWeight="medium"
                      color={colors.blue700}
                    >
                      [{calculateTendency(presetTendencyList[index])}]
                    </Text>
                    성향이 더 높아요
                  </Text>
                )}
              <Flex
                direction="row"
                style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}
              >
                {presetTendencyList[index]?.tendencyNameList
                  .slice(
                    0,
                    tendencyViewIndex[index]
                      ? 4
                      : presetTendencyList[index]?.tendencyNameList.length
                  )
                  .map((item, index) => {
                    return (
                      <Badge size="medium" type="blue" badgeStyle="weak">
                        {item + " "}{" "}
                        {presetTendencyList[index]?.tendencyPointList[index]}점
                      </Badge>
                    );
                  })}
              </Flex>
            </>
          )}
          <View style={{ height: 20 }}></View>
          {item?.map((value, idx) => (
            <StepperRow
              hideLine={idx == item.length - 1}
              left={<StepperRow.NumberIcon number={idx + 1} />}
              center={
                <StepperRow.Texts
                  type="A"
                  title={value[value[0].category == 4 ? 1 : 0].name}
                  description={
                    value.filter(
                      (itemValue) => !itemValue.name.includes("추천")
                    ).length -
                      1 >=
                    1
                      ? `+${
                          value.filter(
                            (itemValue) => !itemValue.name.includes("추천")
                          ).length - 1
                        }개 장소`
                      : ""
                  }
                />
              }
            />
          ))}
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
          {/* <PrimaryButton
            alignSelf="center"
            marginBottom={heightPercentage(10)}
            marginTop={heightPercentage(10)}
            width={widthPercentage(290)}
            height={heightPercentage(50)}
            label="일정 자세히 보기"
            backgroundColor={colors.backgroundGray}
            textColor={colors.PointYellow}
            onPress={async () => {
              goDetail(index);
              await logEvent("view_course_result_detail", {
                place: item[0][0].name,
              });
            }}
          ></PrimaryButton> */}
        </Stack.Vertical>
      </>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <NavigationBar />
      <Top
        title={
          <Text typography="t6" fontWeight="regular" color={colors.grey700}>
            점수가 낮은 일정은 간단한 동선을 우선시했어요!
            {/* 성향을 토대로 다님 AI가 추천을해줘요! */}
          </Text>
        }
        subtitle1={
          <Text typography="t3" fontWeight="bold" color={colors.grey900}>
            나그네님,{`\n`}이런 여행 일정은 어때요?
            {/* 1분만에 다님으로{`\n`} 여행 일정을 추천받아보세요 */}
          </Text>
        }
      ></Top>
      <View style={{ paddingHorizontal: 24 }}>
        <LinearGradient
          height={103}
          degree={0}
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.5)"]}
          easing={"easeOut"}
          style={{ borderRadius: 99 }}
        >
          <Image
            source={{ uri: regionInfo.photo }}
            resizeMode="stretch"
            style={{
              position: "absolute",
              width: "100%",
              height: 103,
              opacity: 0.1,
            }}
          ></Image>
          <Stack.Vertical gutter={3} style={{ padding: 20 }}>
            <Text typography="st5" fontWeight="semibold" color={colors.white}>
              {region[0].split("/").at(-1)}
              {region.length >= 2 ? ` 외 ${region.length - 1}지역` : ""}
            </Text>

            <Stack.Horizontal gutter={12}>
              {presetTendencyList[0]?.tendencyNameList
                .slice(0, 3)
                .map((item, idx) => {
                  return (
                    <View
                      style={{
                        borderRadius: 12,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        backgroundColor: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <Text
                        typography="t7"
                        fontWeight="medium"
                        color={colors.white}
                        style={{ alignSelf: "center" }}
                      >
                        {item}
                      </Text>
                    </View>
                  );
                })}
              {presetTendencyList[0]?.tendencyNameList.length >= 4 && (
                <Text
                  typography="t7"
                  fontWeight="medium"
                  color={colors.white}
                  style={{ alignSelf: "center" }}
                >
                  +{presetTendencyList[0]?.tendencyNameList.length - 3}
                </Text>
              )}
            </Stack.Horizontal>
          </Stack.Vertical>
        </LinearGradient>
      </View>
      <Text
        typography="t6"
        fontWeight="medium"
        color={colors.blue700}
        style={{ marginHorizontal: 24 }}
      >
        * {nDay == 0 ? "당일치기" : nDay + "박 " + (nDay + 1) + "일"} 일정이에요
      </Text>
      <Tab
        fluid
        size="large"
        onChange={(e) => {
          moveScroll(e);
          console.log(tabValue);
        }}
        value={tabValue}
        style={{ marginTop: 5 }}
      >
        {[
          ...Array.from({ length: presetDatas.length }, (item, index) => index),
        ].map((item, idx) => {
          return <Tab.Item value={String(idx)}>{idx + 1}</Tab.Item>;
        })}
      </Tab>
      <FlatList
        keyExtractor={(_, index) => index.toString()}
        style={{ height: 400 }}
        ref={scrollRef}
        data={presetDatas}
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
          itemVisiblePercentThreshold: 90, // 50% 이상 보이면 감지
        }}
        renderItem={renderItem}
      ></FlatList>
    </ScrollView>
  );
}
