import React, { PropsWithChildren } from "react";
import { CustomProgressBar } from "../../components/progress-bar";
import { RouteButton } from "../../components/route-button";
import { View } from "react-native";
import { FixedBottomCTAProvider } from "@toss-design-system/react-native";
import { StepText } from "../../components/step-text";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <CustomProgressBar />
        <StepText
          title={"여행 출발지는 어디인가요?"}
          subTitle1={"1. 여행 계획을 알려주세요"}
          subTitle2={"선택하신 지역 근처의 공항과 기차역을 찾아봤어요"}
        ></StepText>
        {children}
        <RouteButton />
      </FixedBottomCTAProvider>
    </View>
  );
}
