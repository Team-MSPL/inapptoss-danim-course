import React, { useCallback } from "react";
import { View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import {
  Button,
  colors,
  Text,
  ListRow,
  Top,
  FixedBottomCTA,
  FixedBottomCTAProvider,
} from "@toss-design-system/react-native";
import { appLogin } from "@apps-in-toss/framework";
import { StepText } from "../components/step-text";
export const Route = BedrockRoute("/", {
  validateParams: (params) => params,
  component: Index,
});

export function Index() {
  const handlePress = async () => {
    const data = await fetch("http://3.37.54.226/manageNetwork/ping");
    const json = await data.json();
    console.log(json);
  };
  const handleLogin = useCallback(async () => {
    /**
     * appLogin을 호출하면
     * - 토스 로그인을 처음 진행하는 토스 로그인 창이 열리고, 앱인토스 콘솔에서 등록한 약관 동의 화면이 표시돼요. 사용자가 필수 약관에 동의하면 인가 코드가 반환돼요.
     * - 토스 로그인을 이미 진행한 경우 별도의 로그인 창 없이 바로 인가 코드가 반환돼요.
     */
    const { authorizationCode, referrer } = await appLogin();
    console.log(authorizationCode, referrer);
    /**
     * 획득한 authorizationCode 와 referrer 값을 서버로 전달해요.
     */
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        {/* <StepText
          title={"여행 출발지는 어디인가요?"}
          subTitle1={"1.여행 계획을 알려주세요"}
          subTitle2={"선택하신 지역 근처의 공항과 기차역을 찾아봤어요."}
        ></StepText> */}
        <Top
          title={
            <Text typography="t6" fontWeight="medium" color={colors.grey600}>
              성향을 토대로 다님 AI가 추천을해줘요!
            </Text>
          }
          subtitle1={
            <Text typography="t3" fontWeight="bold" color={colors.grey900}>
              1분만에 다님으로{`\n`} 여행 일정을 추천받아보세요
            </Text>
          }
        ></Top>

        <ListRow
          left={<ListRow.LeftText>01.01</ListRow.LeftText>}
          contents={
            <Text typography="t5" fontWeight="semiBold" color={colors.grey700}>
              성향에 맞춘 여행 일정
            </Text>
          }
        />
        <ListRow
          left={<ListRow.LeftText>01.01</ListRow.LeftText>}
          contents={
            <Text typography="t5" fontWeight="semiBold" color={colors.grey700}>
              시간 절약
            </Text>
          }
        />
        <ListRow
          left={<ListRow.LeftText>01.01</ListRow.LeftText>}
          contents={
            <Text typography="t5" fontWeight="semiBold" color={colors.grey700}>
              즐거운 여행
            </Text>
          }
        />
        {/* <FixedBottomCTA viewStyle={{ backgroundColor: "#C3F550" }}>
          확인
        </FixedBottomCTA> */}
        {/* <FixedBottomCTA.Double
          leftButton={
            <Button type="dark" style="weak">
              왼팔
            </Button>
          }
          rightButton={<Button>오른팔</Button>}
        /> */}
      </FixedBottomCTAProvider>
    </View>
  );
}
