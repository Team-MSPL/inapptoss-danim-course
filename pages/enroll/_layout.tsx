import React, { PropsWithChildren } from "react";
import { CustomProgressBar } from "../../components/progress-bar";
import { RouteButton } from "../../components/route-button";
import { View } from "react-native";
import { FixedBottomCTAProvider } from "@toss-design-system/react-native";
import { StepText } from "../../components/step-text";
import { useNavigation } from "react-native-bedrock";
import { routeStack } from "../../utill/route-stack";
import NavigationBar from "../../components/navigation-bar";

export default function Layout({ children }: PropsWithChildren) {
  const navigation = useNavigation();
  const textData =
    routeStack[navigation.getState()?.routes?.at(-1)?.name.split("/enroll")[1]];

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar />
      <FixedBottomCTAProvider>
        {textData?.title ? (
          <>
            <CustomProgressBar />
            <StepText
              title={textData?.title}
              subTitle1={textData?.subTitle1}
              subTitle2={textData?.subTitle2}
            ></StepText>
            {children}
            {textData?.next != "distance" && <RouteButton />}
          </>
        ) : (
          children
        )}
      </FixedBottomCTAProvider>
    </View>
  );
}
