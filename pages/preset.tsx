import {
  colors,
  LinearGradient,
  Text,
  Top,
} from "@toss-design-system/react-native";
import React from "react";
import { View } from "react-native";
import { BedrockRoute, Image, Stack } from "react-native-bedrock";
import { useAppSelector } from "store";

export const Route = BedrockRoute("/preset", {
  validateParams: (params) => params,
  component: Preset,
});

function Preset() {
  const { presetDatas, regionInfo, region, presetTendencyList, nDay } =
    useAppSelector((state) => state.travelSlice);
  return (
    <View>
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
    </View>
  );
}
