import React, { useEffect, useState } from 'react';
import { Stack } from '@granite-js/react-native';
import { TimetableDay } from './type';
import { View, Text, TouchableOpacity } from 'react-native';
import { Badge, colors, ListRow, Icon } from '@toss-design-system/react-native';
import { categoryColor, categoryTitle } from './constants';
import { EditToolTip } from './edit-tool-tip';
import { MoveToolTip } from './move-tool-tip';

/* helper 함수들 (getTimeDiffText, extractTimeMeta, moveAndAdjustWithGaps) 그대로 재사용 */
function getTimeDiffText(prev, next) {
  const prevEndMinutes = (prev.y ?? 0) * 30 + 360 + prev.takenTime;
  const nextStartMinutes = (next.y ?? 0) * 30 + 360;
  let diff = nextStartMinutes - prevEndMinutes;
  if (diff <= 0) return '';
  const hour = Math.floor(diff / 60);
  const min = diff % 60;
  return `${hour > 0 ? `${hour}시간` : ''}${min > 0 ? ` ${min}분` : ''}`.trim();
}

function extractTimeMeta(arr: any[]) {
  return arr.map((item, i, array) => {
    const start = (item.y ?? 0) * 30 + 360;
    const end = start + item.takenTime;
    const nextStart = array[i + 1] ? (array[i + 1].y ?? 0) * 30 + 360 : null;
    const gap = nextStart !== null ? Math.max(nextStart - end, 0) : 0;
    return {
      ...item,
      _origDuration: item.takenTime,
      _origGap: gap,
    };
  });
}

function moveAndAdjustWithGaps(origArr: any[], idx: number, dir: -1 | 1): any[] {
  if (idx + dir < 0 || idx + dir >= origArr.length) return origArr;
  const items = extractTimeMeta(origArr);
  const moved = items.splice(idx, 1)[0];
  items.splice(idx + dir, 0, moved);
  let cur = 360; // 9:00
  const newArr = items.map((item, i) => {
    const newItem = {
      ...item,
      y: Math.floor((cur - 360) / 30),
      takenTime: item._origDuration,
    };
    cur += item._origDuration + (item._origGap || 0);
    delete newItem._origDuration;
    delete newItem._origGap;
    return newItem;
  });
  return newArr;
}

/* -------------------------
   New: 안전한 포맷 함수들
   ------------------------- */

// 안전한 숫자 변환(혹시 문자열로 들어오는 경우 대비)
function toNumberSafe(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// "HH:MM ~ HH:MM" 형태로 반환.
// 규칙:
// - 일반 아이템: y, takenTime가 있으면 계산해서 표기
// - '추천' 아이템: '추천' 텍스트 표시하거나 시작 시간만 표시 (원하시면 바꿀 수 있음)
function formatTimeRange(item: any) {
  // 보호코드: 데이터가 아예 없으면 빈 문자열 반환
  if (!item) return '';

  // 특수 케이스: '숙소 추천' 등은 시간 범위 대신 라벨을 보여주고 싶다면 여기서 처리
  if (typeof item.name === 'string' && /숙소 추천|점심 추천|저녁 추천/.test(item.name)) {
    // 예: '숙소 추천'은 시작시간/종료시간 대신 '추천'으로 처리하거나 시작 시간만 보여주도록 변경 가능
    const startY = toNumberSafe(item.y, null);
    if (startY === null) return '추천';
    const startMinute = startY * 30 + 360;
    const endMinute = startMinute + toNumberSafe(item.takenTime, 0);
    // 만약 시간이 0이면 그냥 '추천'으로 표시
    if (!endMinute || endMinute <= startMinute) return '추천';
    return `${String(Math.floor(startMinute / 60)).padStart(2, '0')}:${String(startMinute % 60).padStart(2, '0')} ~ ${String(Math.floor(endMinute / 60)).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`;
  }

  // 기본 케이스
  const y = toNumberSafe(item.y, 0);
  const takenTime = toNumberSafe(item.takenTime, 0);
  const startMinute = y * 30 + 360;
  const endMinute = startMinute + takenTime;

  // 방어: endMinute가 유효 범위를 벗어나면 빈 문자열
  if (endMinute <= startMinute || startMinute < 0) return '';

  const startHH = Math.floor(startMinute / 60);
  const startMM = startMinute % 60;
  const endHH = Math.floor(endMinute / 60);
  const endMM = endMinute % 60;

  // 24시(24:00) 넘는 경우 처리: 원래 코드에서는 25 이상은 빈으로 했으니 동일 동작
  if (endHH >= 25) return '';

  return `${startHH}:${String(startMM).padStart(2, '0')} ~ ${endHH}:${String(endMM).padStart(2, '0')}`;
}

// 내용 포맷: 기본은 item.name, 없으면 카테고리별 기본 문구
function formatContent(item: any) {
  if (!item) return '';
  if (item.name && String(item.name).trim().length > 0) return String(item.name);
  // fallback by category
  const cat = Number(item.category ?? -1);
  if (cat >= 0) return categoryTitle[cat] ?? '';
  return '';
}

/* -------------------------
   DayList component
   ------------------------- */

type DayListProps = {
  dayItems: TimetableDay;
  dayIndex: number;
  modify: boolean;
  setModify: React.Dispatch<React.SetStateAction<boolean>>;
  tooltips: { day: number; index: number; status: boolean };
  setTooltips: React.Dispatch<React.SetStateAction<{ day: number; index: number; status: boolean }>>;
  copyTimetable: any;
  setCopyTimetable: React.Dispatch<React.SetStateAction<any>>;
  navigation: any;
  showHourBottomSheet: () => void;
  handleRemoveCheck: () => void;
  onLayout?: (e: any) => void;
};

export function DayList({
                          dayItems,
                          dayIndex,
                          modify,
                          setModify,
                          tooltips,
                          setTooltips,
                          copyTimetable,
                          setCopyTimetable,
                          navigation,
                          showHourBottomSheet,
                          handleRemoveCheck,
                          onLayout,
                        }: DayListProps) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [moveTooltipIdx, setMoveTooltipIdx] = useState<number | null>(null);

  // useEffect(() => {
  //   if (__DEV__) console.debug(`[DayList] mounted dayIndex=${dayIndex} count=${dayItems?.length ?? 0}`);
  //   return () => {
  //     if (__DEV__) console.debug(`[DayList] unmounted dayIndex=${dayIndex}`);
  //   };
  // }, [dayIndex, dayItems]);

  return (
    <Stack.Vertical
      style={{
        position: 'relative',
        borderRadius: 13,
        paddingVertical: 14,
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.grey200,
      }}
      onLayout={onLayout}
    >
      {dayItems.map((value, idx) => {
        // 개발용 로그 (개발모드에서만)
        // if (__DEV__) {
        //   console.debug(`[DayList] render day=${dayIndex} idx=${idx} name=${value?.name ?? '<no-name>'} y=${value?.y} takenTime=${value?.takenTime}`);
        // }

        const timeText = formatTimeRange(value);
        const contentText = formatContent(value);

        return (
          <View key={idx} style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => {
                if (modify && isReorderMode) {
                  setMoveTooltipIdx(moveTooltipIdx === idx ? null : idx);
                } else if (modify && !isReorderMode) {
                  setTooltips({ day: dayIndex, index: idx, status: !tooltips.status });
                }
              }}
              onLongPress={() => {
                if (modify) {
                  setIsReorderMode((prev) => {
                    if (prev) setMoveTooltipIdx(null);
                    return !prev;
                  });
                  setTooltips({ day: -1, index: -1, status: false });
                }
              }}
              delayLongPress={250}
            >
              <ListRow
                left={
                  !value?.name?.includes('추천') ? (
                    <ListRow.Icon
                      name={`icon-number-${
                        dayItems
                          .filter((fil) => !fil.name?.includes('추천'))
                          .findIndex((find) => find.name === value?.name) + 1
                      }-square`}
                    />
                  ) : (
                    <ListRow.Icon name="icon-number--1-squar" />
                  )
                }
                contents={
                  <ListRow.Texts
                    type="2RowTypeF"
                    top={timeText}
                    bottom={contentText}
                    topProps={{ color: colors.grey500 }}
                    bottomProps={{ color: colors.grey800 }}
                  />
                }
                right={
                  !modify ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Badge
                        size="small"
                        badgeStyle="weak"
                        type={categoryColor[value?.category ?? 0]}
                      >
                        {categoryTitle[value?.category ?? 0] ?? ''}
                      </Badge>
                    </View>
                  ) : isReorderMode ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <ListRow.Icon name="icon-arrow-up-down" />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setTooltips({ day: dayIndex, index: idx, status: true });
                        setMoveTooltipIdx(null);
                      }}
                      style={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ListRow.Icon name="icon-dots-mono" />
                    </TouchableOpacity>
                  )
                }
              />
            </TouchableOpacity>

            {/* MoveToolTip */}
            {modify && isReorderMode && moveTooltipIdx === idx && (
              <MoveToolTip
                onMoveUp={() => {
                  setCopyTimetable((prev) => {
                    const newCopy = [...prev];
                    newCopy[dayIndex] = moveAndAdjustWithGaps(dayItems, idx, -1);
                    return newCopy;
                  });
                  setMoveTooltipIdx(null);
                }}
                onMoveDown={() => {
                  setCopyTimetable((prev) => {
                    const newCopy = [...prev];
                    newCopy[dayIndex] = moveAndAdjustWithGaps(dayItems, idx, 1);
                    return newCopy;
                  });
                  setMoveTooltipIdx(null);
                }}
                disableUp={idx === 0}
                disableDown={idx === dayItems.length - 1}
              />
            )}

            {/* EditToolTip */}
            {modify &&
              !isReorderMode &&
              tooltips.status &&
              tooltips.day === dayIndex &&
              tooltips.index === idx && (
                <EditToolTip
                  showHourBottomSheet={showHourBottomSheet}
                  handleRemoveCheck={handleRemoveCheck}
                />
              )}

            {!modify &&
              idx < dayItems.length - 1 &&
              (() => {
                const moveText = getTimeDiffText(dayItems[idx], dayItems[idx + 1]);
                if (!moveText) return null;
                return (
                  <View style={{ paddingVertical: 6, paddingLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}>
                      <Icon name="icon-car-mono" color={colors.grey500} size={20} />
                      <Text
                        style={{
                          marginLeft: 16,
                          color: colors.grey500,
                          fontSize: 16,
                          lineHeight: 26,
                        }}
                      >
                        {moveText}
                      </Text>
                    </View>
                  </View>
                );
              })()}

            {/* 일정 추가 버튼 */}
            {modify && value?.category !== 4 && (
              <ListRow
                onPress={() => {
                  navigation.navigate('/add-place', {
                    day: dayIndex,
                    index: idx,
                    data: copyTimetable,
                    setCopyTimetable,
                  });
                }}
                left={<ListRow.Icon name="icon-plus-circle-blue" />}
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top="일정 추가하기"
                    topProps={{ color: colors.grey800 }}
                  />
                }
              />
            )}
          </View>
        );
      })}
    </Stack.Vertical>
  );
}