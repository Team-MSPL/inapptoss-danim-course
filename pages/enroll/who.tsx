import React from "react";
import { View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { styles } from "./country";
import TendencyButton from "../../components/tendency-button";
import { useAppSelector } from "store";
import { useTendencyHandler } from "../../hooks/useTendencyHandler";
import { colors, Text } from "@toss-design-system/react-native";

export const Route = BedrockRoute("/enroll/who", {
  validateParams: (params) => params,
  component: EnrollWho,
});

export function EnrollWho() {
  const { tendency } = useAppSelector((state) => state.travelSlice);

  const { handleButtonClick, tendencyList } = useTendencyHandler();
  return (
    <>
      <Text
        typography="t7"
        fontWeight="medium"
        color={colors.red600}
        style={{
          marginHorizontal: 24,
          marginTop: -0,
          opacity: tendency[0][6] == 1 ? 1 : 0,
        }}
      >
        반려동물을 선택하면 실내 여행지는 자동으로 제외돼요
      </Text>
      <View style={styles.ButtonsContainer}>
        {tendencyList[0]?.list?.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[0][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={tendencyList[0]?.photo[idx]}
            onPress={() => {
              handleButtonClick({ index: 0, item: idx });
            }}
          ></TendencyButton>
        ))}
      </View>
    </>
  );
}
