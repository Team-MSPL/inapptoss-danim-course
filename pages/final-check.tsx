import {
  Badge,
  Button,
  colors,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  LinearGradient,
  ListRow,
  Tab,
  Text,
  useToast,
} from "@toss-design-system/react-native";
import React, { useState } from "react";
import { View } from "react-native";
import {
  BedrockRoute,
  Image,
  Stack,
  useNavigation,
} from "react-native-bedrock";
import { useAppSelector } from "store";
import { cityViewList } from "../utill/city-list";
import { useTendencyHandler } from "../hooks/useTendencyHandler";

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

  const { tendencyList } = useTendencyHandler();

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <FixedBottomCTAProvider>
      <View style={{ marginHorizontal: 24 }}>
        <Text
          typography="st8"
          fontWeight="bold"
          color={colors.grey700}
          style={{ alignSelf: "center" }}
        >
          선택사항 확인
        </Text>
        <LinearGradient
          height={200}
          degree={0}
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.5)"]}
          easing={"easeOut"}
        >
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
                  source={{ uri: seasonList[3]?.svg }}
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
            gutter={21}
            style={{
              borderWidth: 1,
              borderColor: "#eeeeee",
              borderRadius: 13,
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginTop: 10,
            }}
          >
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
              <Text typography="t5" fontWeight="medium" color={colors.grey800}>
                여행지 인기도
              </Text>
              <Badge size="medium" type="yellow" badgeStyle="weak">
                {popular}
              </Badge>
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
        <FixedBottomCTA>
          <Button type="primary" onPress={() => {}}>
            추천 일정 조회하기
          </Button>
        </FixedBottomCTA>
      </View>
    </FixedBottomCTAProvider>
  );
}
