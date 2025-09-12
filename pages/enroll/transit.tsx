import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BedrockRoute, Image } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../../redux/travle-slice";
import { TouchableOpacity } from "@react-native-bedrock/native/react-native-gesture-handler";
import { CustomColor } from "../../utill/custom-color";
import { GridList, Icon, Text } from "@toss-design-system/react-native";

type EnrollTransitProps = {
  marginTop?: number;
};

export const Route = BedrockRoute("/enroll/transit", {
  validateParams: (params) => params,
  component: EnrollTransit,
});

export function EnrollTransit({ marginTop = 150 }: EnrollTransitProps) {
  const dispatch = useAppDispatch();
  const { transit } = useAppSelector((state) => state.travelSlice);
  const moveList = [
    {
      name: "자동차 렌트카",
      function: () => dispatch(travelSliceActions.enrollTransit(0)),
      image: "icon-car-blue",
    },
    {
      name: "대중교통",
      function: () => dispatch(travelSliceActions.enrollTransit(1)),
      image: "icon-train-blue",
    },
  ];
  const styles = StyleSheet.create({
    buttonContainerBase: {
      alignItems: "center",
      height: 159,
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
    },
  });
  return (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: 24,
        justifyContent: "space-between",
        marginTop: marginTop,
      }}
    >
      <GridList column={2} style={{ marginBottom: 16 }}>
        {moveList.map((item, idx) => {
          const isSelected = transit === idx;

          const containerStyle: ViewStyle = {
            ...styles.buttonContainerBase,
            borderColor: isSelected
              ? CustomColor.primary
              : CustomColor.ButtonBackground,
            backgroundColor: isSelected
              ? "rgba(195,245,80,0.3)"
              : CustomColor.ButtonBackground,
          };

          return (
            <GridList.Item
              image={
                <Icon style={{ width: 60, height: 60 }} name={item.image} />
              }
              title={item.name}
              key={idx}
              style={containerStyle}
              onPress={item.function}
            ></GridList.Item>
          );
        })}
      </GridList>
    </View>
  );
}
