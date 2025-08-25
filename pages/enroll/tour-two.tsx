import React from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { useAppSelector } from "store";
import { useTendencyHandler } from "../../hooks/useTendencyHandler";
import { styles } from "./country";
import TendencyButton from "../../components/tendency-button";

export const Route = BedrockRoute("/enroll/tour-two", {
  validateParams: (params) => params,
  component: EnrollTourTwo,
});

export function EnrollTourTwo() {
  const { tendency } = useAppSelector((state) => state.travelSlice);

  const { handleButtonClick, tendencyList } = useTendencyHandler();
  return (
    <>
      <View style={styles.ButtonsContainer}>
        {tendencyList[4]?.list?.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[4][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={tendencyList[4]?.photo[idx]}
            onPress={() => {
              handleButtonClick({ index: 4, item: idx });
            }}
          ></TendencyButton>
        ))}
      </View>
    </>
  );
}
