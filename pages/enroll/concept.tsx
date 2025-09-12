import React from "react";
import { BedrockRoute } from "react-native-bedrock";
import { useAppSelector } from "store";
import { useTendencyHandler } from "../../hooks/useTendencyHandler";
import { View } from "react-native";
import TendencyButton from "../../components/tendency-button";
import { styles } from "./country";

type EnrollConceptProps = {
    marginTop?: number;
};

export const Route = BedrockRoute("/enroll/concept", {
  validateParams: (params) => params,
  component: EnrollConcept,
});

export function EnrollConcept({ marginTop = 74 }: EnrollConceptProps) {
  const { tendency } = useAppSelector((state) => state.travelSlice);

  const { handleButtonClick, tendencyList } = useTendencyHandler();
  return (
    <>
      <View style={{marginTop: marginTop, ...styles.ButtonsContainer}}>
        {tendencyList[1]?.list?.map((item, idx) => (
          <TendencyButton
            marginBottom={0}
            bgColor={tendency[1][idx] == 1}
            label={item}
            divide={true}
            key={idx}
            imageUrl={tendencyList[1]?.photo[idx]}
            onPress={() => {
              handleButtonClick({ index: 1, item: idx });
            }}
          ></TendencyButton>
        ))}
      </View>
    </>
  );
}
