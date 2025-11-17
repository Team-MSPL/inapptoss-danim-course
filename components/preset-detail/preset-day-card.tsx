import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, colors } from '@toss-design-system/react-native';
import moment from 'moment';

type TimetableItem = {
  name: string;
  takenTime: number;
  address?: string;
  lat?: number;
  lng?: number;
};

type Props = {
  item: TimetableItem[];
  index: number;
  day: string[];
  handleItemLayout: (e: any, idx: number) => void;
};

const GEOCODE_API_KEY = import.meta.env.GOOGLE_API_KEY;

function shortenAddress(addr?: string) {
  if (!addr) return '';
  const regex = /(.*?[구읍면동])/;
  const match = addr.match(regex);
  if (match && match[1]) {
    return match[1] + '...';
  }
  return addr;
}

async function fetchAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GEOCODE_API_KEY}`,
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch {
    return null;
  }
}

export function PresetDayCard({ item, index, day, handleItemLayout }: Props) {
  const dateObj = moment(day[index]);
  const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const weekdayKor = KOREAN_WEEKDAYS[dateObj.day()];

  const [addressList, setAddressList] = useState<(string | undefined)[]>([]);

  console.log(item);

  useEffect(() => {
    Promise.all(
      item.map(async (v) => {
        if (v.address) return v.address;
        if (v.lat && v.lng) {
          const addr = await fetchAddress(v.lat, v.lng);
          return addr ?? '';
        }
        return '';
      }),
    ).then(setAddressList);
  }, [item]);

  const getTimeText = (min: number) => {
    const hour = Math.floor(min / 60), minute = min % 60;
    if (hour && minute) return `${hour}시간 ${minute}분`;
    if (hour) return `${hour}시간`;
    if (minute) return `${minute}분`;
    return '';
  };

  return (
    <View style={styles.card} onLayout={(e) => handleItemLayout(e, index)}>
      <Text typography="t7" fontWeight="medium" color={colors.grey600} style={{ marginBottom: 10 }}>
        {dateObj.format('YYYY-MM-DD')} ({weekdayKor})
      </Text>
      {item.map((value, idx) => (
        <View key={idx} style={styles.row}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>{idx + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text typography="t5" fontWeight="semiBold" color={colors.grey800}>
              {value.name}
            </Text>
            <Text
              typography="t7"
              fontWeight="medium"
              color={colors.grey500}
              style={{ marginTop: 2 }}
              numberOfLines={1}
            >
              {shortenAddress(value.address ?? addressList[idx] ?? '')}
            </Text>
          </View>
          {!!value.takenTime && (
            <View style={styles.timePill}>
              <Text style={styles.timeText}>{getTimeText(value.takenTime)}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 20,
    marginHorizontal: 24,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    minHeight: 80,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  circleText: {
    color: '#3182F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timePill: {
    backgroundColor: '#EDF3FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  timeText: {
    color: colors.blue600,
    fontWeight: 'bold',
    fontSize: 14,
  },
});