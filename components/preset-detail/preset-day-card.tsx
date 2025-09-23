import React from 'react';
import { Stack } from 'react-native-bedrock';
import { colors, Text } from '@toss-design-system/react-native';
import { View } from 'react-native';
import moment from 'moment';
// 회색 원 컴포넌트(GrayCircle)는 직접 구현하거나 기존 컴포넌트 사용
import GrayCircle from "../design/gray-circle";

type TimetableItem = {
  name: string;
  takenTime: number;
  address?: string;
};

type PresetDayCardProps = {
  item: TimetableItem[];
  index: number;
  day: string[];
  handleItemLayout: (e: any, idx: number) => void;
};

export function PresetDayCard({ item, index, day, handleItemLayout }: PresetDayCardProps) {
  const isLastCard = index === day.length - 1;
  const CIRCLE_SIZE = 8;
  const TIMELINE_WIDTH = 28;
  const LINE_WIDTH = 1.5;
  const ROW_HEIGHT = 56;
  const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const dateObj = moment(day[index]);
  const weekdayKor = KOREAN_WEEKDAYS[dateObj.day()];

  return (
    <Stack.Vertical
      style={{
        position: 'relative',
        borderWidth: 1,
        borderColor: '#eeeeee',
        borderRadius: 13,
        paddingHorizontal: 24,
        paddingVertical: 20,
        marginTop: 10,
        marginBottom: isLastCard ? 155 : 20,
        marginHorizontal: 24,
        backgroundColor: 'white',
      }}
      onLayout={(e) => handleItemLayout(e, index)}
    >
      {/* 날짜/요일 */}
      <Text typography="t5" fontWeight="medium" color={'#505A69'}>
        {dateObj.format('YYYY-MM-DD')} ({weekdayKor})
      </Text>
      {/* 소제목(여행지) */}
      <Text
        typography="t6"
        fontWeight="bold"
        color={'#B0B3C2'}
        style={{ marginTop: 20, marginBottom: 18 }}
      >
        여행지
      </Text>
      {/* 타임라인 */}
      <View style={{ flexDirection: 'column' }}>
        {item?.map((value, idx) => {
          const isLast = idx === item.length - 1;
          // 시간 표시
          const hour = Math.floor(value.takenTime / 60);
          const minute = value.takenTime % 60;
          let timeText = '';
          if (hour > 0) timeText += `${hour}시간`;
          if (minute > 0) timeText += `${hour > 0 ? ' ' : ''}${minute}분`;
          // 예시 주소 (없으면 빈 문자열)
          const address = value.address ?? '충남 부여군 부여읍 동남리';

          return (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                height: ROW_HEIGHT,
              }}
            >
              {/* 타임라인 왼쪽 (원+선) */}
              <View
                style={{
                  width: TIMELINE_WIDTH,
                  alignItems: 'center',
                  position: 'relative',
                  height: ROW_HEIGHT,
                }}
              >
                <GrayCircle size={CIRCLE_SIZE} />
                {!isLast && (
                  <View
                    style={{
                      position: 'absolute',
                      top: CIRCLE_SIZE,
                      left: (TIMELINE_WIDTH - LINE_WIDTH) / 2,
                      width: LINE_WIDTH,
                      height: ROW_HEIGHT - CIRCLE_SIZE,
                      backgroundColor: '#B2B8C2',
                    }}
                  />
                )}
              </View>
              {/* 오른쪽 - 장소/시간 */}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: CIRCLE_SIZE, bottom: 5, marginLeft: 12 }}>
                <Text
                  typography="t6"
                  fontWeight="bold"
                  color={colors.grey900}
                  style={{ marginRight: 8 }}
                >
                  {value.name}
                </Text>
                {!!timeText && (
                  <Text
                    typography="t7"
                    fontWeight="medium"
                    color={colors.blue600}
                  >
                    {timeText}
                  </Text>
                )}
              </View>
              {/* 주소는 잠시 주석처리 */}
              {/*
              <View style={{ flex: 1 }}>
                <Text
                  typography="t7"
                  fontWeight="regular"
                  color={colors.grey300}
                  style={{ marginTop: 2 }}
                  numberOfLines={1}
                >
                  {address}
                </Text>
              </View>
              */}
            </View>
          );
        })}
      </View>
    </Stack.Vertical>
  );
}