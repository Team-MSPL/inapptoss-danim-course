import React, { useState } from "react";
import { Text, View } from "react-native";
import { BedrockRoute, useNavigation } from "react-native-bedrock";
import { StepText } from "../../components/step-text";
import {
  Border,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  Post,
  TextField,
} from "@toss-design-system/react-native";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../../redux/travle-slice";

export const Route = BedrockRoute("/enroll/title", {
  validateParams: (params) => params,
  component: EnrollTitle,
});

function EnrollTitle() {
  const { travelName } = useAppSelector((state) => state.travelSlice);
  const dispatch = useAppDispatch();
  const handleChange = (e: string) => {
    dispatch(travelSliceActions.updateFiled({ field: "travelName", value: e }));
  };
  return (
    <>
      <TextField
        variant="line"
        help="15자 안으로 적어주세요"
        placeholder="예) 신나는 여행"
        value={travelName}
        onChangeText={(e) => handleChange(e)}
      />
    </>
  );
}
