import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { BedrockRoute, useNavigation } from "react-native-bedrock";
import {
  colors,
  Text,
  ListRow,
  Top,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  PartnerNavigation,
} from "@toss-design-system/react-native";
import { appLogin } from "@apps-in-toss/framework";
import { useAppDispatch, useAppSelector } from "store";
import { socialConnect, travelSliceActions } from "../redux/travle-slice";
export const Route = BedrockRoute("/", {
  validateParams: (params) => params,
  component: Index,
});

export function Index() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { userId, userJwtToken } = useAppSelector((state) => state.travelSlice);
  const handleNext = () => {
    if (userId != null) {
      dispatch(
        travelSliceActions.reset({ userId: userId, userJwtToken: userJwtToken })
      );
      navigation.navigate("/enroll/title");
    } else {
      handleLogin();
    }
  };
  const handleLogin = useCallback(async () => {
    /**
     * appLogin을 호출하면
     * - 토스 로그인을 처음 진행하는 토스 로그인 창이 열리고, 앱인토스 콘솔에서 등록한 약관 동의 화면이 표시돼요. 사용자가 필수 약관에 동의하면 인가 코드가 반환돼요.
     * - 토스 로그인을 이미 진행한 경우 별도의 로그인 창 없이 바로 인가 코드가 반환돼요.
     */
    const { authorizationCode, referrer } = await appLogin();
    console.log(authorizationCode, referrer);
    await dispatch(socialConnect({ userToken: authorizationCode }));
    /**
     * 획득한 authorizationCode 와 referrer 값을 서버로 전달해요.
     */
  }, []);
  useEffect(() => {
    handleLogin();
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <PartnerNavigation
        title="다님"
        icon={{ source: { uri: "https://danim.me/square_logo.png" } }}
        rightButtons={
          userId != null
            ? [
                {
                  title: "내여행",
                  id: "travle-list",
                  icon: { name: "icon-plane-mono" },
                  onPress: () => {
                    navigation.reset({
                      index: 1,
                      routes: [{ name: "/" }, { name: "/my-travle-list" }],
                    });
                  },
                },
              ]
            : undefined
        }
      ></PartnerNavigation>
      <FixedBottomCTAProvider>
        <Top
          title={
            <Text typography="t6" fontWeight="medium" color={colors.grey600}>
              성향을 토대로 다님 AI가 추천을해줘요!
            </Text>
          }
          subtitle1={
            <Text typography="t3" fontWeight="bold" color={colors.grey900}>
              1분만에 다님으로{`\n`} 여행 일정을 추천받을 수 있어요
            </Text>
          }
        ></Top>

        <ListRow
          left={
            <ListRow.Image
              type="3d-emoji"
              source={{
                uri: "https://static.toss.im/2d-emojis/png/4x/u1F31E.png",
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="성향에 맞춘 여행 일정"
              bottom="내 취향에 꼭 맞는 여행 일정을 추천해줘요"
              topProps={{
                typography: "t5",
                fontWeight: "semiBold",
                color: colors.grey700,
              }}
              bottomProps={{
                typography: "t6",
                fontWeight: "regular",
                color: colors.grey600,
              }}
            />
          }
        />
        <ListRow
          left={
            <ListRow.Image
              type="3d-emoji"
              source={{
                uri: "https://static.toss.im/2d-emojis/png/4x/u23F3.png",
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="시간 절약"
              bottom="1분 만에 여행 일정을 알려줘서 빠르게 준비할 수 있어요"
              topProps={{
                typography: "t5",
                fontWeight: "semiBold",
                color: colors.grey700,
              }}
              bottomProps={{
                typography: "t6",
                fontWeight: "regular",
                color: colors.grey600,
              }}
            />
          }
        />
        <ListRow
          left={
            <ListRow.Image
              type="3d-emoji"
              source={{
                uri: "https://static.toss.im/2d-emojis/png/4x/u1F4F1.png",
              }}
            />
          }
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="손쉬운 조작"
              bottom="누구나 쉽게 사용할 수 있도록 간단하고 편리하게 만들었어요"
              topProps={{
                typography: "t5",
                fontWeight: "semiBold",
                color: colors.grey700,
              }}
              bottomProps={{
                typography: "t6",
                fontWeight: "regular",
                color: colors.grey600,
              }}
            />
          }
        />
        <FixedBottomCTA onPress={handleNext}>시작하기</FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}
