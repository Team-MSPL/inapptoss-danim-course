import {
  Badge,
  BottomSheet,
  colors,
  ListRow,
  useBottomSheet,
  useToast,
} from '@toss-design-system/react-native';
import React, { useLayoutEffect, useRef } from 'react';
import { View } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import { useAppDispatch, useAppSelector } from 'store';
import CalendarPicker from 'react-native-calendar-picker';
import { travelSliceActions } from '../../redux/travle-slice';
import moment from 'moment';
import TimePickerModal from '../../utill/time-picker';
import CustomDatePickerModal from '../../components/date-picker-modal';
import DatePickerModal from '../../components/date-picker-modal';
export const Route = createRoute('/enroll/day', {
  validateParams: (params) => params,
  component: Day,
});

function Day() {
  const bottomSheet = useBottomSheet();

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const months = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];
  const {
    selectStartDate,
    selectEndDate,
    timeLimitArray,
    minuteLimitArray,
    accommodations,
    Place,
  } = useAppSelector((state) => state.travelSlice);
  const dispatch = useAppDispatch();
  const onDateChange = (date: any, type: string) => {
    if (type == 'END_DATE') {
      dispatch(travelSliceActions.updateFiled({ field: 'selectEndDate', value: date }));
    } else {
      selectEndDate &&
        moment(selectEndDate).diff(date) <= 0 &&
        dispatch(
          travelSliceActions.updateFiled({
            field: 'selectEndDate',
            value: date,
          }),
        );
      dispatch(
        travelSliceActions.updateFiled({
          field: 'selectStartDate',
          value: date,
        }),
      );
    }
  };
  const handleConfirm = (timeData: { hour: number; ampm: string; minute: string }) => {
    goConfirm(timeData);
  };

  const goConfirm = (timeData: { hour: number; ampm: string; minute: string }) => {
    let timeCopy = [...timeLimitArray];
    let ampmCheck = timeData.ampm == '오후' ? 12 : 0;
    timeCopy[timeSelectRef.current] = parseInt(timeData.hour) + ampmCheck;
    let minuteCopy = [...minuteLimitArray];
    minuteCopy[timeSelectRef.current] = parseInt(timeData.minute);
    dispatch(
      travelSliceActions.setTimeAndMinute({
        time: timeCopy,
        minute: minuteCopy,
      }),
    );
    return true;
  };
  useLayoutEffect(() => {
    hanldleDay();
  }, [selectStartDate, selectEndDate]);
  const calculateDateDifference = () => {
    if (selectStartDate && selectEndDate) {
      const diffInMilliseconds = moment(selectEndDate).diff(selectStartDate);
      const duration = moment.duration(diffInMilliseconds);
      const days = duration.asDays();
      return Math.ceil(Math.abs(days)); // 절대값으로 반환 (음수 값 제거)
    }
    return 0;
  };
  const hanldleDay = () => {
    let data = [];
    const checkDays = calculateDateDifference();
    if (Object.keys(accommodations).length) {
      let copy = [...accommodations];
      if (checkDays + 2 < Object.keys(accommodations).length) {
        copy.splice(checkDays + 2, Object.keys(accommodations).length - checkDays);
        data = copy;
      } else if (checkDays + 2 > Object.keys(accommodations).length) {
        for (let i = 0; i < checkDays + 2 - Object.keys(accommodations).length; i++) {
          copy.push({
            name: '',
            lat: 0,
            lng: 0,
            category: 4,
            takenTime: 30,
            photo: '',
          });
        }
        data = copy;
      }
    } else {
      data = [...Array(checkDays + 2)].map((item) => {
        return Place;
      });
    }

    let season = Array(4).fill(0);
    let index = Math.floor((moment(selectStartDate).month() + 1) / 3) - 1;
    index < 0 ? (season[3] = 1) : (season[index] = 1);
    let dateArray = [];
    let count = 0;
    let copySelectedStartDate = moment(selectStartDate);
    console.log(copySelectedStartDate, selectStartDate);
    while (checkDays > 4 ? copySelectedStartDate.isSameOrBefore(selectEndDate) : count < 5) {
      dateArray.push(copySelectedStartDate.clone());
      copySelectedStartDate.add(1, 'day');
      count += 1;
    }
    dispatch(
      travelSliceActions.enrollDayInfo({
        day: dateArray,
        nDay: checkDays,
        accommodations: data.length == 0 ? accommodations : data,
        season: season,
      }),
    );
  };

  const { open } = useToast();
  const handleToast = (e: string) => {
    open(e);
  };
  const goNext = () => {
    if (timeLimitArray[0] < 6) {
      handleToast('시작 시간은 06시 이후로만 가능해요');
    } else if (timeLimitArray[0] > 19) {
      handleToast('시작 시간은 20시 전으로만 가능해요');
    } else if (timeLimitArray[1] < 12) {
      handleToast('종료 시간은 오후로만 가능해요');
    } else if (timeLimitArray[0] >= timeLimitArray[1]) {
      handleToast('종료 시간은 시작 시간이후로만 가능해요.');
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
            nextTitle="→"
            previousTitle="←"
            allowBackwardRangeSelect={true}
            selectYearTitle="년도 선택"
          />
          <BottomSheet.CTA
            onPress={() => {
              bottomSheet.close();
            }}
          >
            선택 완료
          </BottomSheet.CTA>
        </View>
      ),
    });
  };
  const childComponentRef = useRef();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState(0);

  const [selectedTime, setSelectedTime] = React.useState({ hour: 7, ampm: '오후', minute: '00' });

  const openTimePickerModal = (index: number) => {
    const hourInRedux = timeLimitArray[index]; // 0~23
    const minuteInRedux = minuteLimitArray[index];

    const ampmStr = hourInRedux < 12 ? '오전' : '오후';

    setSelectedTime({
      hour: String(hourInRedux).padStart(2, '0'),
      ampm: ampmStr,
      minute: String(minuteInRedux).padStart(2, '0'),
    });
    setModalType(index);
    setModalVisible(true);
  };

  const handleTimePickerConfirm = (timeData: { hour: string; ampm: string; minute: string }) => {
    let timeCopy = [...timeLimitArray];
    timeCopy[modalType] = parseInt(timeData.hour, 10);

    let minuteCopy = [...minuteLimitArray];
    minuteCopy[modalType] = parseInt(timeData.minute, 10);

    dispatch(
      travelSliceActions.setTimeAndMinute({
        time: timeCopy,
        minute: minuteCopy,
      }),
    );
    setModalVisible(false);
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
              moment(selectStartDate).format('YYYY-MM-DD') +
              ' ~ ' +
              moment(selectEndDate ?? selectStartDate).format('YYYY-MM-DD')
            }
            topProps={{
              typography: 't5',
              fontWeight: 'medium',
              color: colors.grey800,
            }}
          />
        }
      />
      <ListRow
        onPress={() => openTimePickerModal(0, '첫째 날')}
        left={<ListRow.Icon name="icon-clock-blue-weak" color="#5350FF" />}
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top={
              (timeLimitArray[0] < 12 ? '오전' : '오후') +
              ' ' +
              String(timeLimitArray[0]).padStart(2, '0') +
              '시 ' +
              String(minuteLimitArray[0]).padStart(2, '0') +
              '분'
            }
            topProps={{
              typography: 't5',
              fontWeight: 'medium',
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
        onPress={() => openTimePickerModal(1, '마지막 날')}
        left={<ListRow.Icon name="icon-clock-blue-weak" color="#5350FF" />}
        contents={
          <ListRow.Texts
            type="1RowTypeA"
            top={
              (timeLimitArray[1] < 12 ? '오전' : '오후') +
              ' ' +
              String(timeLimitArray[1]).padStart(2, '0') +
              '시 ' +
              String(minuteLimitArray[1]).padStart(2, '0') +
              '분'
            }
            topProps={{
              typography: 't5',
              fontWeight: 'medium',
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

      <DatePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        header={modalType === 0 ? '첫째 날' : '마지막 날'}
        hour={selectedTime.hour}
        ampm={selectedTime.ampm}
        minute={selectedTime.minute}
        onConfirm={handleTimePickerConfirm}
      />
    </>
  );
}
