import {
  Checkbox,
  colors,
  FixedBottomCTAProvider,
  ListRow,
  SearchField,
} from "@toss-design-system/react-native";
import React from "react";
import { Text, View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { CustomProgressBar } from "../../components/progress-bar";
import { StepText } from "../../components/step-text";
import { RouteButton } from "../../components/route-button";

export const Route = BedrockRoute("/enroll/departure", {
  validateParams: (params) => params,
  component: Departure,
});

function Departure() {
  return (
    <>
      <ListRow
        left={
          <ListRow.Icon
            name="icon-plane-mint-fill"
            type="border"
            align="center"
          />
        }
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top="오전 9시"
            topProps={{
              typography: "t5",
              fontWeight: "medium",
              color: colors.grey800,
            }}
          />
        }
      />
      <ListRow
        left={
          <ListRow.Icon name="icon-subway-fill" type="border" align="center" />
        }
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top="오전 9시"
            topProps={{
              typography: "t5",
              fontWeight: "medium",
              color: colors.grey700,
            }}
          />
        }
        right={<Checkbox.Circle size={24} />}
      />
    </>
  );
}
