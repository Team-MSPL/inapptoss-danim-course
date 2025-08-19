import {
  Border,
  colors,
  FixedBottomCTAProvider,
  SearchField,
  Text,
} from "@toss-design-system/react-native";
import React, { useCallback, useRef, useState } from "react";
import { BedrockRoute } from "react-native-bedrock";
import { CustomProgressBar } from "../../components/progress-bar";
import { StepText } from "../../components/step-text";
import { styles } from "./country";
import TendencyButton from "../../components/tendency-button";
import { RouteButton } from "../../components/route-button";
import { cityViewList } from "../../utill/city-list";
import { useAppDispatch, useAppSelector } from "store";
import {
  ScrollView,
  TouchableOpacity,
} from "@react-native-bedrock/native/react-native-gesture-handler";
import { travelSliceActions } from "../../redux/travle-slice";
import { Pressable, View } from "react-native";
import { CustomColor } from "../../utill/custom-color";

export const Route = BedrockRoute("/enroll/region", {
  validateParams: (params) => params,
  component: Region,
});

function Region() {
  const { country, cityIndex, region, cityDistance } = useAppSelector(
    (state) => state.travelSlice
  );
  const filterList = ["도심권", "동남권", "동북권", "서남권", "서북권"];
  const checkList = ["서울", "제주"];
  const selectPopularity = (e: {
    id: number;
    subTitle: string;
    subId: number;
  }) => {
    dispatch(
      travelSliceActions.selectPopularity({
        region: checkList.includes(e.subTitle) ? ["전체"] : [e.subTitle],
        cityIndex: e.id,
        cityDistance: [e.subId],
      })
    );
  };

  const selectRegion = (e: any) => {
    if (e.subTitle === "전체" || region.includes("전체")) {
      dispatch(
        travelSliceActions.firstSelectRegion({
          region: [e.subTitle],
          cityDistance: [e.id],
        })
      );
    } else if (region.includes(e.subTitle)) {
      const copy = region.filter((item) => item !== e.subTitle);
      const copyIndex = cityDistance.filter((item) => item !== e.id);
      dispatch(
        travelSliceActions.firstSelectRegion({
          region: copy,
          cityDistance: copyIndex,
        })
      );
    } else {
      let copy = [];
      let copyIndex = [];
      if (!(country == 0 && cityIndex == 2)) {
        copy = [...region];
        copyIndex = [...cityDistance];
      }
      copy.push(e.subTitle);
      copyIndex.push(e.id);
      dispatch(
        travelSliceActions.firstSelectRegion({
          region: copy,
          cityDistance: copyIndex,
        })
      );
    }
  };
  const handleRegionSerarch = (e: string) => {
    return cityViewList[country]
      .map((item, index) => {
        if (index != 0) {
          return item.sub.map((value, idx) => {
            if (value.subTitle == "전체") {
              let copy = { ...value, subTitle: item.title };
              return copy;
            } else {
              return value;
            }
          });
        }
      })
      .filter((item) => item != undefined)
      .reduce(function (acc, cur) {
        return [...acc, ...cur];
      })
      ?.filter((item) => !filterList.includes(item?.subTitle))
      .filter((item, index) => item.subTitle.includes(e));
  };
  const [value, setValue] = useState("");
  const dispatch = useAppDispatch();
  const [regionText, setRegionText] = useState("");
  const [regionSearchState, setRegionSearchState] = useState(false);
  const handleRegionText = useCallback((e: string) => {
    setValue(e);
    setRegionMatchList(handleRegionSerarch(e));
  }, []);
  const regionSearchRef = useRef<TextInput | null>(null);
  const [regionMatchList, setRegionMatchList] = useState<
    { id: number; lat: number; lng: number; subTitle: string }[]
  >([]);
  const selectCity = (e: number) => {
    if (region) {
      dispatch(travelSliceActions.updateFiled({ field: "region", value: [] }));
    }
    dispatch(travelSliceActions.updateFiled({ field: "cityIndex", value: e }));
  };
  return (
    <>
      <SearchField
        hasClearButton
        placeholder="지역을 검색해보세요"
        style={{ marginHorizontal: 24 }}
        value={value}
        onChange={(e) => {
          setRegionSearchState(
            e.nativeEvent.text.length == 0 && regionText.length >= 1
              ? false
              : true
          );
          handleRegionText(e.nativeEvent.text);
          // setValue(e.nativeEvent.text);
        }}
      />
      <View style={{ marginHorizontal: 24 }}>
        <ScrollView style={{ zIndex: 2 }}>
          {regionSearchState &&
            value != "" &&
            regionMatchList.map((item, index) => {
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    dispatch(
                      travelSliceActions.selectPopularity({
                        region: cityViewList[country].filter(
                          (asd) => asd.title == item.subTitle
                        )[0]?.id
                          ? ["전체"]
                          : [item.subTitle],
                        cityIndex:
                          cityViewList[country]
                            .slice(1)
                            .filter(
                              (asd) =>
                                asd.sub.filter(
                                  (qqq) => qqq.subTitle == item.subTitle
                                ).length >= 1
                            )[0]?.id ??
                          cityViewList[country].filter(
                            (asd) => asd.title == item.subTitle
                          )[0]?.id,
                        cityDistance: [item.id],
                      })
                    );
                    regionSearchRef.current?.blur();
                    setRegionText(item.subTitle);
                    setRegionSearchState(false);
                  }}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.grey400,
                  }}
                >
                  <Text>{item.subTitle}</Text>
                </Pressable>
              );
            })}
        </ScrollView>
      </View>

      <ScrollView
        // ref={cityScrollRef}
        horizontal={true}
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: 24 }}
      >
        {cityViewList[country].map((item, idx) => {
          return (
            <TouchableOpacity
              key={idx}
              style={{
                padding: 10,
                backgroundColor:
                  cityIndex == idx ? CustomColor.primary : "#FAFAFB",
                borderRadius: 14,
                minWidth: 60,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                marginRight: cityViewList[country].length - 1 == idx ? 32 : 8,
              }}
              onPress={() => {
                selectCity(item.id);
              }}
            >
              <Text typography="t5" fontWeight="semibold">
                {item?.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Border type="full" style={{ marginVertical: 16 }} />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 24,
        }}
      >
        {cityIndex != null &&
          cityViewList[country][cityIndex].sub?.map((item, idx) => {
            return (
              <TouchableOpacity
                key={idx}
                style={{
                  padding: 10,
                  backgroundColor: region.includes(item.subTitle)
                    ? "rgba(202, 251, 7,0.2)"
                    : "#FAFAFB",
                  borderWidth: region.includes(item.subTitle) ? 1 : 0,
                  borderColor: CustomColor.primary,
                  borderRadius: 14,
                  minWidth: 60,
                  height: region.includes(item.subTitle) ? 42 : 40,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  marginBottom: 8,
                }}
                onPress={() => {
                  console.log(region);
                  cityIndex == 0 ? selectPopularity(item) : selectRegion(item);
                }}
              >
                <Text typography="t5" fontWeight="semibold">
                  {item?.subTitle}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
      {country == 0 && cityIndex == 1 && (
        <View
          style={{
            marginHorizontal: 24,
            borderRadius: 20,
            borderColor: "#FAFAFB",
            borderWidth: 1,
            paddingHorizontal: 24,
            paddingVertical: 20,
            gap: 10,
          }}
        >
          {cityViewList[country][1].sub.map((item, idx) => {
            return idx != 0 ? (
              <View key={idx} style={{ flexDirection: "row" }}>
                <View style={{ width: 94 }}>
                  <Text
                    typography="t7"
                    fontWeight="regular"
                    color={colors.grey600}
                  >
                    {item.subTitle}
                  </Text>
                </View>
                <View style={{ width: 164 }}>
                  <Text
                    typography="t7"
                    fontWeight="regular"
                    color={colors.grey400}
                  >
                    {item?.example}
                  </Text>
                </View>
              </View>
            ) : null;
          })}
        </View>
      )}
    </>
  );
}
