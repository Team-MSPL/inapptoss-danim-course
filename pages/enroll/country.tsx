import { FixedBottomCTAProvider } from "@toss-design-system/react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { StepText } from "../../components/step-text";
import { RouteButton } from "../../components/route-button";
import TendencyButton from "../../components/tendency-button";
import { countryList } from "../../utill/country";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../../redux/travle-slice";
import { CustomProgressBar } from "../../components/progress-bar";

export const Route = BedrockRoute("/enroll/country", {
  validateParams: (params) => params,
  component: Country,
});

function Country() {
  const dispatch = useAppDispatch();
  const handleChange = (e: number) => {
    dispatch(travelSliceActions.updateFiled({ field: "country", value: e }));
  };
  const { country } = useAppSelector((state) => state.travelSlice);
  return (
    <View style={{marginTop: 74, ...styles.ButtonsContainer}}>
      {countryList?.map((item, idx) => (
        <TendencyButton
          marginBottom={0}
          bgColor={idx == country}
          label={item.ko}
          divide={true}
          key={idx}
          imageUrl={item.icon}
          onPress={() => {
            handleChange(idx);
          }}
        ></TendencyButton>
      ))}
    </View>
  );
}
export const styles = StyleSheet.create({
  ButtonsContainer: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
});
