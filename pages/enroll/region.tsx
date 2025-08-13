import {
  FixedBottomCTAProvider,
  SearchField,
} from "@toss-design-system/react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { CustomProgressBar } from "../../components/progress-bar";
import { StepText } from "../../components/step-text";
import { styles } from "./country";
import TendencyButton from "../../components/tendency-button";
import { RouteButton } from "../../components/route-button";
import { cityViewList } from "../../utill/city-list";
import { useAppSelector } from "store";

export const Route = BedrockRoute("/enroll/region", {
  validateParams: (params) => params,
  component: Region,
});

function Region() {
  const { country } = useAppSelector((state) => state.travelSlice);
  const filterList = ["도심권", "동남권", "동북권", "서남권", "서북권"];
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
  return (
    <>
      <SearchField
        hasClearButton
        placeholder="지역을 검색해보세요"
        style={{ marginHorizontal: 24 }}
        value={value}
        onChange={(e) => {
          setValue(e.nativeEvent.text);
          console.log(handleRegionSerarch(e.nativeEvent.text));
        }}
      />
    </>
  );
}
