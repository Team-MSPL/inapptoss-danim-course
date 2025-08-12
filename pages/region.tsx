import { FixedBottomCTAProvider } from "@toss-design-system/react-native";
import React from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { CustomProgressBar } from "../components/progress-bar";
import { StepText } from "../components/step-text";
import { styles } from "./country";
import TendencyButton from "../components/tendency-button";
import { RouteButton } from "../components/route-button";
import { cityViewList } from "../utill/city-list";

export const Route = BedrockRoute("/region", {
  validateParams: (params) => params,
  component: Region,
});

function Region() {
  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <CustomProgressBar />
        <StepText
          title={"여행지는 어디인가요?"}
          subTitle1={"1. 여행 계획을 알려주세요"}
        ></StepText>

        <RouteButton />
      </FixedBottomCTAProvider>
    </View>
  );
}
