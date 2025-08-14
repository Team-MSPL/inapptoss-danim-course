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
import { useAppDispatch, useAppSelector } from "store";
import CalendarPicker from "react-native-calendar-picker";
import { travelSliceActions } from "../../redux/travle-slice";
import moment from "moment";
export const Route = BedrockRoute("/enroll/day", {
  validateParams: (params) => params,
  component: Day,
});

function Day() {
  const bottomSheet = useBottomSheet();

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const months = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  const { selectStartDate, selectEndDate } = useAppSelector(
    (state) => state.travelSlice
  );
  const dispatch = useAppDispatch();
  const onDateChange = (date: any, type: string) => {
    if (type == "END_DATE") {
      dispatch(
        travelSliceActions.updateFiled({ field: "selectEndDate", value: date })
      );
    } else {
      selectEndDate &&
        moment(selectEndDate).diff(date) <= 0 &&
        dispatch(
          travelSliceActions.updateFiled({
            field: "selectEndDate",
            value: date,
          })
        );
      dispatch(
        travelSliceActions.updateFiled({
          field: "selectStartDate",
          value: date,
        })
      );
    }
  };

  const showBasicBottomSheet = () => {
    bottomSheet.open({
      header: <BottomSheet.Header>날짜 선택</BottomSheet.Header>,
      // children: <BottomSheet.CTA>선택완료</BottomSheet.CTA>,
      children: (
        <View>
          <CalendarPicker
            width={375}
            weekdays={weekdays}
            months={months}
            minDate={new Date()}
            startFromMonday={false}
            onDateChange={onDateChange}
            showDayStragglers={false}
            allowRangeSelection={true}
            selectedRangeStartStyle={{ backgroundColor: colors.blue800 }}
            selectedRangeStyle={{ backgroundColor: colors.black }}
            selectedRangeEndStyle={{ backgroundColor: colors.blue800 }}
            selectedDayColor={colors.black}
            nextTitle="다음 달"
            previousTitle="이전 달"
            allowBackwardRangeSelect={true}
            selectYearTitle="년도 선택"
          />
          <BottomSheet.CTA>선택완료</BottomSheet.CTA>
        </View>
      ),
    });
  };

  return (
    <>
      <ListRow
        onPress={showBasicBottomSheet}
        left={<ListRow.Icon name="icon-calendar-check-blue-weak" />}
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top={
              moment(selectStartDate).format("YYYY-MM-DD") +
              " ~ " +
              moment(selectEndDate ?? selectStartDate).format("YYYY-MM-DD")
            }
            topProps={{
              typography: "t5",
              fontWeight: "medium",
              color: colors.grey800,
            }}
          />
        }
      />
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
