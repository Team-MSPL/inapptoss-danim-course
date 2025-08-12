import React, { useState } from "react";
import { Text, View } from "react-native";
import { BedrockRoute, useNavigation } from "react-native-bedrock";
import { StepText } from "../components/step-text";
import {
  Border,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Post,
  TextField,
} from "@toss-design-system/react-native";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../redux/travle-slice";

export const Route = BedrockRoute("/title", {
  validateParams: (params) => params,
  component: EnrollTitle,
});

function EnrollTitle() {
  const navigation = useNavigation();
  const handleNext = () => {
    navigation.navigate("/country");
  };
  const { title } = useAppSelector((state) => state.travelSlice);
  const dispatch = useAppDispatch();
  const handleChange = (e: string) => {
    dispatch(travelSliceActions.updateFiled({ field: "title", value: e }));
  };
  return (
    <View style={{ flex: 1 }}>
      <FixedBottomCTAProvider>
        <StepText
          title={"여행 이름을 정해주세요!"}
          subTitle1={"새 여행"}
        ></StepText>
        <TextField
          variant="line"
          help="15자 안으로 적어주세요"
          placeholder="예) 신나는 여행"
          value={title}
          onChangeText={(e) => handleChange(e)}
        />

        <FixedBottomCTA onPress={handleNext} disabled={title == ""}>
          다음으로
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}
