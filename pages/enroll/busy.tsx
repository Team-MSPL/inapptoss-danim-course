import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { BedrockRoute, Image } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import { travelSliceActions } from "../../redux/travle-slice";
import { GridList, Icon } from "@toss-design-system/react-native";
import { CustomColor } from "../../utill/custom-color";

export const Route = BedrockRoute("/enroll/busy", {
  validateParams: (params) => params,
  component: EnrollBusy,
});

function EnrollBusy() {
  const dispatch = useAppDispatch();
  const { bandwidth } = useAppSelector((state) => state.travelSlice);
  const moveList = [
    {
      name: "알찬 일정",
      function: () => dispatch(travelSliceActions.enrollBandwidth(false)),
      image: "https://static.toss.im/2d-emojis/png/4x/u1F3C3.png",
    },
    {
      name: "여유있는 일정",
      function: () => dispatch(travelSliceActions.enrollBandwidth(true)),
      image: "https://static.toss.im/2d-emojis/png/4x/u1F6B6.png",
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
        marginTop: 150,
      }}
    >
      <GridList column={2} style={{ marginBottom: 16 }}>
        {moveList.map((item, idx) => {
          const isSelected = bandwidth == Boolean(idx);

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
                <Image
                  style={{ width: 60, height: 60 }}
                  source={{ uri: item.image }}
                />
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
