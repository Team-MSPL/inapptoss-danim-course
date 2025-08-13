import {
  Badge,
  BottomSheet,
  colors,
  FixedBottomCTAProvider,
  Icon,
  ListRow,
  Text,
  useBottomSheet,
} from "@toss-design-system/react-native";
import React from "react";
import { View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { CustomProgressBar } from "../../components/progress-bar";
import { StepText } from "../../components/step-text";
import { RouteButton } from "../../components/route-button";

export const Route = BedrockRoute("/enroll/day", {
  validateParams: (params) => params,
  component: Day,
});

function Day() {
  const bottomSheet = useBottomSheet();

  const showBasicBottomSheet = () => {
    bottomSheet.open({
      header: <BottomSheet.Header>제목</BottomSheet.Header>,
      children: <BottomSheet.CTA>선택완료</BottomSheet.CTA>,
    });
  };

  return (
    <>
      <ListRow
        onPress={showBasicBottomSheet}
        left={<ListRow.Icon name="icon-clock-blue-weak" color="#5350FF" />}
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
        right={
          <Badge size="small" type="yellow" badgeStyle="weak" fontWeight="bold">
            첫째 날
          </Badge>
        }
      />
      <ListRow
        left={<ListRow.Icon name="icon-clock-blue-weak" color="#5350FF" />}
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top="오전 10시"
            topProps={{
              typography: "t5",
              fontWeight: "medium",
              color: colors.grey800,
            }}
          />
        }
        right={
          <Badge size="small" type="green" badgeStyle="weak" fontWeight="bold">
            마지막 날
          </Badge>
        }
      />
    </>
  );
}
