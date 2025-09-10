import {
  AnimateSkeleton,
  Badge,
  Border,
  BottomSheet,
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  LinearGradient,
  ListRow,
  Skeleton,
  Tab,
  Text,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import React, { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import {
  BedrockRoute,
  Image,
  Lottie,
  Stack,
  useNavigation,
} from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import { cityViewList } from "../utill/city-list";
import { useTendencyHandler } from "../hooks/useTendencyHandler";
import { EnrollWho } from "./enroll/who";
import { EnrollTransit } from "./enroll/transit";
import { EnrollBusy } from "./enroll/busy";
import { StepText } from "../components/step-text";
import { routeStack } from "../utill/route-stack";
import { EnrollConcept } from "./enroll/concept";
import { EnrollPlay } from "./enroll/play";
import { EnrollPopular } from "./enroll/popular";
import { EnrollDistance } from "./enroll/distance";
import { EnrollTourOne } from "./enroll/tour-one";
import { EnrollTourTwo } from "./enroll/tour-two";
import { getTravelAi, travelSliceActions } from "../redux/travle-slice";
import NavigationBar from "../components/navigation-bar";

export const Route = BedrockRoute("/final-check", {
  validateParams: (params) => params,
  component: FinalCheck,
});

function FinalCheck() {
  const {
    day,
    region,
    nDay,
    country,
    cityIndex,
    season,
    transit,
    bandwidth,
    tendency,
    popular,
    essentialPlaces,
    accommodations,
    regionInfo,
    travelName,
    distance,
    timeLimitArray,
  } = useAppSelector((state) => state.travelSlice);
  const navigation = useNavigation();
  const { open } = useToast();
  const seasonList = [
    { title: "봄", svg: "https://static.toss.im/2d-emojis/png/4x/u1F33C.png" },
    {
      title: "여름",
      svg: "https://static.toss.im/2d-emojis/png/4x/u1F3DD.png",
    },
    {
      title: "가을",
      svg: "https://static.toss.im/2d-emojis/png/4x/u1F341.png",
    },
    { title: "겨울", svg: "https://static.toss.im/2d-emojis/png/4x/u2744.png" },
  ];
  const [value, setValue] = useState("0");

  const { tendencyList, countryList } = useTendencyHandler();

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const bottomSheet = useBottomSheet();
  const showHourBottomSheet = (e: number) => {
    bottomSheet.open({
      children: (
        <ModifyBottomSheetContent
          onCancel={() => {
            bottomSheet.close();
          }}
          startIndex={e}
        />
      ),
    });
  };
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const goNext = useCallback(async () => {
    try {
      setLoading(true);
      if (
        travelName == "신나는 여행" &&
        tendencyList[0]?.list[tendency[0].findIndex((item) => item == 1)]
      ) {
        let changeName =
          tendencyList[0]?.list[tendency[0].findIndex((item) => item == 1)] +
          (tendency[0].findIndex((item) => item == 1) == 0 ||
          tendency[0].findIndex((item) => item == 1) == 4
            ? " "
            : " 함께하는 ") +
          seasonList[season.findIndex((item) => item == 1)].title +
          "여행";
        dispatch(travelSliceActions.enrollTravelName(changeName));
      }
      let a = region.map(
        (item) => cityViewList[country][cityIndex].title + " " + item
      );
      if (
        (country == 0 &&
          cityViewList[country][cityIndex].id >= 3 &&
          region[0] == "전체") ||
        (country == 0 &&
          cityViewList[country][cityIndex].id == 1 &&
          region[0] == "전체") ||
        (country != 0 && region[0] == "전체")
      ) {
        a = cityViewList[country][cityIndex].sub.map(
          (value, idx) =>
            cityViewList[country][cityIndex].title + " " + value.subTitle
        );
        a.shift();
      }
      // //["해외/Vietnam/나트랑", "해외/Vietnam/다낭"]
      if (country == 0 && cityIndex == 2) {
        a = [region[0] + " 전체"];
      }
      let copy = [...tendency];
      copy[3] = [...copy[3], ...copy[4]];
      copy.pop();
      copy.push(season);
      if (country != 0) {
        a = a.map((item, idx) => {
          return `해외/${countryList[country].en}/${item
            .slice(
              item.indexOf(cityViewList[country][cityIndex].title) +
                cityViewList[country][cityIndex].title.length
            )
            .trim()}`;
        });
      }
      const result = await dispatch(
        getTravelAi({
          regionList: a,
          accomodationList: accommodations,
          selectList: copy,
          essentialPlaceList: essentialPlaces,
          timeLimitArray: timeLimitArray,
          nDay: nDay + 1,
          transit: transit,
          distanceSensitivity: distance,
          bandwidth: bandwidth,
          freeTicket: true,
          version: 3,
          password: "(주)나그네들_g5hb87r8765rt68i7ur78",
        })
      ).unwrap();

      dispatch(travelSliceActions.selectRegion(a));
      if (result) {
        dispatch(
          travelSliceActions.updateFiled({ field: "tendency", value: copy })
        );
        navigation.popToTop();
        navigation.navigate("/preset");
        !result.data.enoughPlace &&
          open(
            `해당 지역에 선택하신 성향의 \n 관광지가 부족하여,일정을 채우지 못했어요`,
            {
              icon: "icon-warning-circle",
            }
          );
      } else {
        open(`네트워크 연결이 불안정해요${`\n`}잠시후 시도해주세요`, {
          icon: "icon-warning-circle",
        });
      }
    } catch (error) {
      console.log(error);
      open(`네트워크 연결이 불안정해요${`\n`}잠시후 시도해주세요`, {
        icon: "icon-warning-circle",
      });
    } finally {
      setLoading(false);
    }
  }, [essentialPlaces, accommodations]);

  return loading ? (
    <AnimateSkeleton delay={500} withGradient={true} withShimmer={true}>
      <Skeleton height={60} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <Skeleton height={60} style={{ marginTop: 12 }} />
    </AnimateSkeleton>
  ) : (
    // <Lottie
    //   height={"100%"}
    //   src="https://firebasestorage.googleapis.com/v0/b/danim-image/o/loading-json%2Floading.json?alt=media&token=93dc5b78-a489-413f-bc77-29444985e83b"
    //   autoPlay={true}
    //   loop={true}
    //   onAnimationFailure={() => {
    //     console.log("Animation Failed");
    //   }}
    //   onAnimationFinish={() => {
    //     console.log("Animation Finished");
    //   }}
    // />
    <FixedBottomCTAProvider>
      <NavigationBar />

      <View style={{ marginHorizontal: 24 }}>
        <Text
          typography="st8"
          fontWeight="bold"
          color={colors.grey700}
          style={{ alignSelf: "center" }}
        >
          선택사항 확인
        </Text>
        <Border type="full" style={{ marginVertical: 16 }} />

        <LinearGradient
          height={200}
          degree={0}
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.5)"]}
          easing={"easeOut"}
          onPress={() => {
            showHourBottomSheet(0);
          }}
        >
          <Image
            source={{ uri: regionInfo.photo }}
            resizeMode="stretch"
            style={{
              position: "absolute",
              width: "100%",
              height: 200,
              opacity: 0.1,
            }}
          ></Image>
          <Stack.Vertical gutter={0} style={{ padding: 24 }}>
            <Stack.Horizontal justify="space-between">
              <Text typography="t7" fontWeight="medium" color={colors.white}>
                {day[0].format("YY.MM.DD") +
                  " - " +
                  day[nDay].format("YY.MM.DD")}
              </Text>
              <Text typography="t6" fontWeight="medium" color={colors.white}>
                편집
              </Text>
            </Stack.Horizontal>
            <Text typography="st5" fontWeight="semibold" color={colors.white}>
              {cityViewList[country][cityIndex].title + " " + region}
            </Text>
            <Stack.Horizontal gutter={7}>
              <View
                style={{
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Image
                  style={{ width: 42, height: 42 }}
                  source={{
                    uri: seasonList[season.findIndex((item) => item == 1)]?.svg,
                  }}
                />
              </View>
              <Text
                typography="st8"
                fontWeight="bold"
                color={colors.white}
                style={{ alignSelf: "center" }}
              >
                {
                  tendencyList[0]?.list[
                    tendency[0].findIndex((item) => item == 1)
                  ]
                }
                {tendency[0].find((item) => item == 1) == undefined
                  ? ""
                  : tendency[0].findIndex((item) => item == 1) == 0 ||
                    tendency[0].findIndex((item) => item == 1) == 4
                  ? " "
                  : " 함께하는 "}
                {seasonList[season.findIndex((item) => item == 1)].title} 여행
              </Text>
            </Stack.Horizontal>
            <Stack.Horizontal gutter={12} style={{ marginTop: 16 }}>
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
                  {!transit ? "자동차·렌트카" : "대중교통"}
                </Text>
              </View>
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
                  {bandwidth ? "여유있는 일정" : "알찬 일정"}
                </Text>
              </View>
            </Stack.Horizontal>
          </Stack.Vertical>
        </LinearGradient>
        <Tab fluid defaultValue={"0"} size="large" onChange={setValue}>
          {[
            "내 여행 성향",
            ...Array.from({ length: nDay + 1 }, (item, index) => index),
          ].map((item, idx) => {
            return (
              <Tab.Item value={String(idx)}>
                {idx == 0 ? "내 여행 성향" : `DAY ${idx}`}
              </Tab.Item>
            );
          })}
        </Tab>
        {value == "0" ? (
          <Stack.Vertical
            style={{
              position: "relative", // ← 이걸 추가
              borderWidth: 1,
              borderColor: "#eeeeee",
              borderRadius: 13,
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginTop: 10,
            }}
          >
            <Text
              onPress={() => {
                showHourBottomSheet(3);
              }}
              typography="t5"
              fontWeight="medium"
              color={colors.grey800}
              textAlign="right"
            >
              편집
            </Text>
            <Stack.Vertical gutter={21}>
              {tendency[1].find((item) => item == 1) && (
                <Stack.Vertical gutter={13}>
                  <Text
                    typography="t5"
                    fontWeight="medium"
                    color={colors.grey800}
                  >
                    여행테마
                  </Text>
                  <Stack.Horizontal gutter={4}>
                    {tendency[1].map((item, inx) => {
                      return item ? (
                        <Badge size="medium" type="blue" badgeStyle="weak">
                          {tendencyList[1]?.list[inx]}
                        </Badge>
                      ) : null;
                    })}
                  </Stack.Horizontal>
                </Stack.Vertical>
              )}
              {tendency[2].find((item) => item == 1) && (
                <Stack.Vertical gutter={13}>
                  <Text
                    typography="t5"
                    fontWeight="medium"
                    color={colors.grey800}
                  >
                    이런 걸 하고 싶어요
                  </Text>
                  <Stack.Horizontal gutter={4}>
                    {tendency[2].map((item, inx) => {
                      return item ? (
                        <Badge size="medium" type="red" badgeStyle="weak">
                          {tendencyList[2]?.list[inx]}
                        </Badge>
                      ) : null;
                    })}
                  </Stack.Horizontal>
                </Stack.Vertical>
              )}
              {tendency[3].find((item) => item == 1) && (
                <Stack.Vertical gutter={13}>
                  <Text
                    typography="t5"
                    fontWeight="medium"
                    color={colors.grey800}
                  >
                    이런 곳에 가고 싶어요
                  </Text>
                  <Stack.Horizontal gutter={4}>
                    {tendency[3].map((item, inx) => {
                      return item ? (
                        <Badge size="medium" type="teal" badgeStyle="weak">
                          {tendencyList[3]?.list[inx]}
                        </Badge>
                      ) : null;
                    })}
                  </Stack.Horizontal>
                </Stack.Vertical>
              )}
              <Stack.Vertical gutter={13}>
                <Text
                  typography="t5"
                  fontWeight="medium"
                  color={colors.grey800}
                >
                  여행지 인기도
                </Text>
                <Badge size="medium" type="yellow" badgeStyle="weak">
                  {popular}
                </Badge>
              </Stack.Vertical>
            </Stack.Vertical>
          </Stack.Vertical>
        ) : (
          (() => {
            const filteredPlaces = essentialPlaces.filter(
              (place) => place.day === Number(value)
            );
            return (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginHorizontal: 24,
                  }}
                >
                  <Text
                    typography="t5"
                    fontWeight="semibold"
                    color={colors.grey700}
                  >
                    {"DAY" + value}
                  </Text>
                  <Text typography="t6" fontWeight="regular" color="#6B7684">
                    {day[Number(value) - 1].format("YY.MM.DD") +
                      " (" +
                      weekdays[day[Number(value) - 1].days()] +
                      ")"}
                  </Text>
                </View>

                {filteredPlaces.map((data, index) => {
                  const refKey = `${index}_key`;
                  return (
                    <ListRow
                      key={refKey}
                      contents={
                        <ListRow.Texts
                          type="1RowTypeA"
                          top={data?.name}
                          topProps={{
                            typography: "t5",
                            fontWeight: "semibold",
                            color: colors.grey800,
                          }}
                        />
                      }
                      right={
                        <Badge
                          size="small"
                          type={"green"}
                          badgeStyle="weak"
                          fontWeight="bold"
                        >
                          {"여행지"}
                        </Badge>
                      }
                    />
                  );
                })}
                {accommodations[Number(value)].name && (
                  <ListRow
                    contents={
                      <ListRow.Texts
                        type="1RowTypeA"
                        top={accommodations[Number(value)].name}
                        topProps={{
                          typography: "t5",
                          fontWeight: "semibold",
                          color: colors.grey800,
                        }}
                      />
                    }
                    right={
                      <Badge
                        size="small"
                        type={"red"}
                        badgeStyle="weak"
                        fontWeight="bold"
                      >
                        {"숙소"}
                      </Badge>
                    }
                  />
                )}
                <ListRow
                  onPress={() => {
                    if (
                      accommodations[Number(value)]?.name != "" &&
                      filteredPlaces.length == 3
                    ) {
                      open("숙소는 1개, 여행지는 3개까지 추가 할 수 있어요.", {
                        icon: "icon-warning-circle",
                      });
                    } else {
                      navigation.navigate("/enroll/essential-search", {
                        idx: Number(value) - 1,
                      });
                    }
                  }}
                  left={
                    <ListRow.Icon
                      name="icon-plus-mono"
                      style={{
                        backgroundColor: colors.grey100,
                      }}
                      color={colors.blue500}
                      type="border"
                    />
                  }
                  right={
                    <ListRow.Icon
                      name="icon-arrow-right-mono"
                      color={colors.grey400}
                    />
                  }
                  contents={
                    <ListRow.Texts
                      type="1RowTypeA"
                      top={"추가하기"}
                      topProps={{
                        typography: "t5",
                        fontWeight: "medium",
                        color: colors.grey800,
                      }}
                    />
                  }
                />
              </>
            );
          })()
        )}
        <FixedBottomCTA
          onPress={() => {
            goNext();
          }}
        >
          추천 일정 조회하기
        </FixedBottomCTA>
      </View>
    </FixedBottomCTAProvider>
  );
}

type ModifyBottomSheetContentProps = {
  startIndex: number;
  onCancel: () => void;
};

function ModifyBottomSheetContent({
  startIndex,
  onCancel,
}: ModifyBottomSheetContentProps) {
  const navigationStack = [
    { title: "who", component: <EnrollWho /> },
    { title: "transit", component: <EnrollTransit /> },
    { title: "busy", component: <EnrollBusy /> },
    { title: "concept", component: <EnrollConcept /> },
    { title: "play", component: <EnrollPlay /> },
    { title: "tour-one", component: <EnrollTourOne /> },
    { title: "tour-two", component: <EnrollTourTwo /> },
    { title: "popular", component: <EnrollPopular /> },
    { title: "distance", component: <EnrollDistance /> },
  ];
  const [step, setStep] = useState(startIndex);
  const textData = routeStack["/" + navigationStack[step]?.title];

  return (
    <View>
      <StepText
        title={textData?.title}
        subTitle1={textData?.subTitle1}
        subTitle2={textData?.subTitle2}
      ></StepText>
      {navigationStack[step]?.component}

      <BottomSheet.CTA.Double
          containerStyle={{backgroundColor: 'white'}}
        leftButton={
          <Button
            type="dark"
            style="weak"
            display="block"
            onPress={() => {
              setStep(step - 1);
            }}
            disabled={step == 0}
          >
            이전으로
          </Button>
        }
        rightButton={
          <Button
            display="block"
            onPress={() => {
              if (step == navigationStack.length - 1) {
                onCancel();
              } else {
                setStep(step + 1);
              }
            }}
          >
            {step == navigationStack.length - 1 ? "완료" : "다음으로"}
          </Button>
        }
      />
    </View>
  );
}
