import {
  Badge,
  BottomSheet,
  colors,
  ListRow,
  useBottomSheet,
  useToast,
} from "@toss-design-system/react-native";
import React, { useRef } from "react";
import { View } from "react-native";
import { BedrockRoute } from "react-native-bedrock";
import { useAppDispatch, useAppSelector } from "store";
import CalendarPicker from "react-native-calendar-picker";
import { travelSliceActions } from "../../redux/travle-slice";
import moment from "moment";
import TimePickerModal from "../../utill/time-picker";
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
  const { selectStartDate, selectEndDate, timeLimitArray, minuteLimitArray } =
    useAppSelector((state) => state.travelSlice);
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
  const handleConfirm = (timeData: {
    hour: number;
    ampm: string;
    minute: string;
  }) => {
    goConfirm(timeData);
  };

  const goConfirm = (timeData: {
    hour: number;
    ampm: string;
    minute: string;
  }) => {
    let timeCopy = [...timeLimitArray];
    let ampmCheck = timeData.ampm == "오후" ? 12 : 0;
    timeCopy[timeSelectRef.current] = parseInt(timeData.hour) + ampmCheck;
    let minuteCopy = [...minuteLimitArray];
    minuteCopy[timeSelectRef.current] = parseInt(timeData.minute);
    dispatch(
      travelSliceActions.setTimeAndMinute({
        time: timeCopy,
        minute: minuteCopy,
      })
    );
    return true;
  };

  const { open } = useToast();
  const handleToast = (e: string) => {
    open(e);
  };
  const goNext = () => {
    if (timeLimitArray[0] < 6) {
      handleToast("시작 시간을 06시 이전으로 설정하실 수 없습니다.");
    } else if (timeLimitArray[0] > 19) {
      handleToast("시작 시간을 20시 이후로는 설정하실 수 없습니다.");
    } else if (timeLimitArray[1] < 12) {
      handleToast("종료 시간을 오전으로 설정하실 수 없습니다.");
    } else if (timeLimitArray[0] >= timeLimitArray[1]) {
      handleToast("종료 시간을 시작 시간 이후로는 설정하실 수 없습니다.");
    } else {
      // navigation.navigate("SelectDeparture");
    }
  };

  const timeSelectRef = useRef(0);
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
            selectedRangeStartStyle={{ backgroundColor: colors.blue500 }}
            selectedRangeStyle={{ backgroundColor: colors.blue200 }}
            selectedRangeEndStyle={{ backgroundColor: colors.blue500 }}
            selectedDayColor={colors.blue500}
            selectedRangeStartTextStyle={{ color: colors.white }}
            selectedRangeEndTextStyle={{ color: colors.white }}
            selectedDayTextColor={colors.white}
            nextTitle="다음 달"
            previousTitle="이전 달"
            allowBackwardRangeSelect={true}
            selectYearTitle="년도 선택"
          />
          <BottomSheet.CTA
            onPress={() => {
              bottomSheet.close();
            }}
          >
            선택완료
          </BottomSheet.CTA>
        </View>
      ),
    });
  };
  const childComponentRef = useRef();
  const showHourBottomSheet = (e: number) => {
    timeSelectRef.current = e;
    bottomSheet.open({
      header: <BottomSheet.Header>날짜 선택</BottomSheet.Header>,
      children: (
        <View>
          <TimePickerModal
            hour={timeLimitArray[e]}
            minute={minuteLimitArray[e]}
            visible={true}
            minuteDivide={false}
            ref={childComponentRef}
          />
          <BottomSheet.CTA
            onPress={() => {
              bottomSheet.close();
              handleConfirm(childComponentRef.current?.handleTime());
            }}
          >
            선택완료
          </BottomSheet.CTA>
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
        onPress={() => showHourBottomSheet(0)}
        left={<ListRow.Icon name="icon-clock-blue-weak" color="#5350FF" />}
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top={
              (timeLimitArray[0] < 12 ? "오전" : "오후") +
              " " +
              String(timeLimitArray[0]).padStart(2, "0") +
              "시 " +
              String(minuteLimitArray[0]).padStart(2, "0") +
              "분"
            }
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
        onPress={() => showHourBottomSheet(1)}
        left={<ListRow.Icon name="icon-clock-blue-weak" color="#5350FF" />}
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top={
              (timeLimitArray[1] < 12 ? "오전" : "오후") +
              " " +
              String(timeLimitArray[1]).padStart(2, "0") +
              "시 " +
              String(minuteLimitArray[1]).padStart(2, "0") +
              "분"
            }
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
