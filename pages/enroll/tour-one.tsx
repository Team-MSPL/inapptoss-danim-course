import React from "react";
import { View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { useAppSelector } from "store";
import { useTendencyHandler } from "../../hooks/useTendencyHandler";
import { styles } from "./country";
import TendencyButton from "../../components/tendency-button";
import { colors, Text, useToast } from "@toss-design-system/react-native";

export const Route = BedrockRoute("/enroll/tour-one", {
  validateParams: (params) => params,
  component: EnrollTourOne,
});

export function EnrollTourOne() {
  const { tendency } = useAppSelector((state) => state.travelSlice);

  const { handleButtonClick, tendencyList } = useTendencyHandler();
  const { open } = useToast();
  return (
    <>
      <View style={styles.ButtonsContainer}>
        {tendencyList[3]?.list?.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[3][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={tendencyList[3]?.photo[idx]}
            onPress={() => {
              if (tendency[0][6] == 1 && idx == 4) {
                open(" 반려동물과 실내 여행지는 함께 선택할 수 없어요", {
                  icon: "icon-warning-circle",
                });
              } else {
                handleButtonClick({ index: 3, item: idx });
              }
            }}
          ></TendencyButton>
        ))}
      </View>
    </>
  );
}
