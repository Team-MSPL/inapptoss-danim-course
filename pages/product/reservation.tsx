import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { createRoute } from '@granite-js/react-native';
import axios from 'axios';
import { FixedBottomCTAProvider, Button, colors, Text } from "@toss-design-system/react-native";
import dayjs from 'dayjs';
import {formatPrice, getMonthMatrix, makeCalendarData, WEEKDAYS} from "../../components/product/reservation-calander"; // for date manipulation

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QUERY_PACKAGE_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryPackage`;

export const Route = createRoute('/product/reservation', {
  validateParams: (params) => params,
  component: ProductReservation,
});


function ProductReservation() {
  const params = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [pkgData, setPkgData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]); // 선택한 날짜 (range)

  // 달력 월 이동
  const [currentMonth, setCurrentMonth] = useState(() => {
    // 기본값: sale_s_date or today
    let d = params.online_s_date || dayjs().format("YYYY-MM-DD");
    return dayjs(d).startOf('month');
  });

  useEffect(() => {
    async function fetchPkg() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(QUERY_PACKAGE_API, {
          prod_no: params.prod_no,
          locale: "kr",
          state: "KR",
          pkg_no: Array.isArray(params.pkg_no) ? params.pkg_no[0] : params.pkg_no,
          s_date: params.online_s_date,
          e_date: params.online_e_date,
        }, {
          headers: { "Content-Type": "application/json" }
        });
        setPkgData(res.data);
      } catch (e: any) {
        setError("패키지 정보를 불러오는데 실패했습니다.");
      }
      setLoading(false);
    }
    fetchPkg();
  }, [params]);

  // calendar data 추출 (가장 첫 번째 item/sku 기준)
  const calInfo = useMemo(() => {
    if (!pkgData?.item) return {};
    const firstItem = pkgData.item[0];
    const firstSku = firstItem?.skus?.[0];
    return {
      calendar_detail: firstSku?.calendar_detail,
      b2c_price: firstSku?.b2c_price ?? firstItem?.b2c_min_price,
      sale_s_date: firstItem?.sale_s_date,
      sale_e_date: firstItem?.sale_e_date,
    };
  }, [pkgData]);

  const calendarData = useMemo(() => makeCalendarData(calInfo), [calInfo]);
  const sale_s_date = calInfo.sale_s_date;
  const sale_e_date = calInfo.sale_e_date;

  // 현재 월 달력 데이터
  const monthMatrix = useMemo(() => {
    return getMonthMatrix(
      currentMonth.year(),
      currentMonth.month() + 1,
      calendarData,
      sale_s_date,
      sale_e_date
    );
  }, [currentMonth, calendarData, sale_s_date, sale_e_date]);

  // 날짜 선택 (range)
  const onDayPress = (cell) => {
    if (!cell || cell.soldOut) return;
    if (selected.length === 0) setSelected([cell.date]);
    else if (selected.length === 1) {
      // 두 번째 선택: range 선택
      const [start] = selected;
      if (dayjs(cell.date).isBefore(dayjs(start))) setSelected([cell.date, start]);
      else setSelected([start, cell.date]);
    } else {
      setSelected([cell.date]);
    }
  };

  // 선택 범위
  const isInRange = (date) => {
    if (selected.length < 2) return false;
    const [start, end] = selected;
    return dayjs(date).isAfter(dayjs(start)) && dayjs(date).isBefore(dayjs(end));
  };

  // 선택 여부
  const isSelected = (date) => selected.includes(date);

  // 로딩/에러 처리
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>패키지 정보를 불러오는 중입니다...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  // 달력 제목
  const monthLabel = currentMonth.format("YYYY년 M월");

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FixedBottomCTAProvider>
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity onPress={() => setCurrentMonth(currentMonth.subtract(1, 'month'))} style={{ marginHorizontal: 16 }}>
              <Text style={{ fontSize: 24, color: colors.grey300 }}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 19, fontWeight: 'bold', letterSpacing: -1 }}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => setCurrentMonth(currentMonth.add(1, 'month'))} style={{ marginHorizontal: 16 }}>
              <Text style={{ fontSize: 24, color: colors.grey300 }}>{'>'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.blue500, fontSize: 16, marginHorizontal: 8 }}>최저가/할인중</Text>
        </View>
        {/* 요일 */}
        <View style={{ flexDirection: 'row', width: SCREEN_WIDTH, justifyContent: 'space-around', marginBottom: 8 }}>
          {WEEKDAYS.map((w, i) => (
            <Text key={w} style={{ width: 34, textAlign: 'center', color: colors.grey400, fontWeight: 'bold', fontSize: 15 }}>{w}</Text>
          ))}
        </View>
        {/* 달력 */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {monthMatrix.map((week, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 }}>
              {week.map((cell, j) => {
                if (!cell) {
                  return <View key={j} style={{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center' }} />;
                }
                // 예약 불가
                if (cell.soldOut) {
                  return (
                    <View key={j} style={{
                      width: 34, height: 56, alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Text style={{ color: colors.grey300, fontSize: 15 }}>{cell.day}</Text>
                      <Text style={{ color: colors.grey300, fontSize: 13 }}>매진</Text>
                    </View>
                  );
                }
                // 선택됨 or in range
                const selectedStyle = isSelected(cell.date)
                  ? styles.selectedDay
                  : isInRange(cell.date)
                    ? styles.rangeDay
                    : {};
                return (
                  <TouchableOpacity
                    key={j}
                    style={[{ width: 34, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, selectedStyle]}
                    onPress={() => onDayPress(cell)}
                  >
                    <Text style={{
                      fontWeight: isSelected(cell.date) ? 'bold' : 'normal',
                      color: isSelected(cell.date) ? '#fff' : colors.grey800,
                      fontSize: 15,
                    }}>{cell.day}</Text>
                    <Text style={{
                      color: isSelected(cell.date) ? '#fff' : colors.blue500,
                      fontWeight: isSelected(cell.date) ? 'bold' : 'normal',
                      fontSize: 13,
                    }}>{cell.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
        {/* 하단 CTA */}
        <View style={{ padding: 24, backgroundColor: '#fff' }}>
          <Button
            type="primary"
            style="fill"
            display="block"
            size="large"
            disabled={selected.length === 0}
            onPress={() => {
              // 다음 단계로 이동
            }}
          >
            다음으로
          </Button>
        </View>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedDay: {
    backgroundColor: colors.blue500,
  },
  rangeDay: {
    backgroundColor: colors.blue100,
  },
});

export default ProductReservation;