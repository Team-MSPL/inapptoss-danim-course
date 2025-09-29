import React, { useMemo, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { Badge, colors, Text, Tooltip } from '@toss-design-system/react-native';
import { PlaceResult } from "../../components/join/type";
import {
  CARD_BORDER_RADIUS,
  CARD_MARGIN_BOTTOM,
  CARD_WIDTH,
} from "../../components/join/constants/resultConstants";
import { StepText } from "../../components/step-text";

const CARD_ASPECT = 1.9;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;

function takenDayToLabel(takenDay: number) {
  return `${takenDay}박 ${takenDay + 1}일`;
}

export const Route = createRoute('/join/result', {
  validateParams: (params) => params,
  component: JoinResult,
});

function splitTags(tags: string[], splitIndex: number = 3) {
  // 첫 줄: 최대 splitIndex개, 두 번째 줄: 나머지
  return [tags.slice(0, splitIndex), tags.slice(splitIndex)];
}

function BadgeRows({ tags }: { tags: string[] }) {
  const [row1, row2] = splitTags(tags, 3);
  return (
    <View style={styles.badgeRowsContainer}>
      <View style={styles.tagsRow}>
        {row1.map((tag, idx) => (
          <Badge key={idx} size="small" badgeStyle="fill" type="elephant">
            {tag}
          </Badge>
        ))}
      </View>
      {row2.length > 0 && (
        <View style={[styles.tagsRow, { marginTop: 4 }]}>
          {row2.map((tag, idx) => (
            <Badge key={row1.length + idx} size="small" badgeStyle="fill" type="elephant">
              {tag}
            </Badge>
          ))}
        </View>
      )}
    </View>
  );
}

function PlaceCard({ place }: { place: PlaceResult }) {
  return (
    <View style={{ marginBottom: CARD_MARGIN_BOTTOM, marginTop: 80 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flex: 1 }}>

        <View style={{ position: 'absolute', top: -38, right: 0, left: 0, alignItems: 'flex-end', zIndex: 2 }}>
          <Tooltip
            message={
              <View style={{ paddingHorizontal: 40, alignSelf: 'flex-end' }}>
                <Text style={styles.tooltipText}>
                  <Text typography="t6" fontWeight={"bold"} color={"#5350FF"}>
                    {takenDayToLabel(place.takenDay)}
                  </Text>
                  <Text typography="t6" fontWeight={"bold"} color={colors.grey800}> 추천</Text>
                </Text>
              </View>
            }
            size="large"
            placement="top"
            messageAlign="right"
            autoFlip
          >
            <View style={{ height: 16, width: 40, backgroundColor: 'transparent', }} />
          </Tooltip>
        </View>

        <View style={styles.card}>
          <Image
            source={{ uri: place.photo }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardOverlay} />
          <View style={styles.cardContent}>
            <View style={styles.cardContentInner}>
              <Text style={styles.cardTitle}>{place.name}</Text>
              <BadgeRows tags={place.tendency.slice(0, 5)} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function JoinResult() {
  const params = Route.useParams();
  const result: PlaceResult[] = params.result ?? [];
  const navigation = useNavigation();

  // 탭 목록을 result에서 동적으로 만듦(중복없음, takenDay 오름차순)
  const tabList = useMemo(() => {
    const days = Array.from(new Set(result.map(r => r.takenDay))).sort((a, b) => a - b);
    return days.map(takenDay => ({
      label: takenDayToLabel(takenDay) + ' 추천',
      takenDay,
    }));
  }, [result]);

  const [selectedTab, setSelectedTab] = useState(0);

  const filteredPlaces: PlaceResult[] = useMemo(() => {
    if (!tabList.length) return [];
    const takenDay = tabList[selectedTab]?.takenDay;
    return result?.filter((place) => place.takenDay === takenDay) ?? [];
  }, [result, tabList, selectedTab]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <StepText
          title={'나그네님,\n이런 여행지는 어때요?'}
          subTitle2={'여행 성향을 기반으로 추천 여행지예요!'}
        />
        {/* 카드 리스트 */}
        <View style={{ paddingHorizontal: 24, marginTop: 10 }}>
          {filteredPlaces.length === 0 && (
            <Text style={{ color: '#888', marginVertical: 36 }}>추천 결과가 없습니다.</Text>
          )}
          {filteredPlaces.map((place, idx) => (
            <PlaceCard
              place={place}
              key={place.name + idx}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 24,
    gap: 12,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    backgroundColor: '#F6F7FA',
    borderRadius: 16,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#7A80FA',
  },
  tabBtnText: {
    color: '#8A8A8A',
    fontSize: 15,
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: '#7A80FA',
    fontWeight: 'bold',
  },
  tabPointer: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 8,
    backgroundColor: '#7A80FA',
    borderRadius: 6,
    zIndex: 2,
    shadowColor: '#7A80FA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 3,
  },
  tooltipContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: -10, // 카드와 말풍선 사이 간격 조정
    zIndex: 2,
  },
  tooltipBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 13,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tooltipText: {
    fontSize: 19,
    color: '#222',
    fontWeight: '400',
    textAlign: 'center',
  },
  tooltipArrowContainer: {
    overflow: 'visible',
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipArrow: {
    width: 28,
    height: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 16,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
    alignSelf: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
    marginTop: 14,
    justifyContent: 'flex-end',
  },
  cardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: CARD_BORDER_RADIUS,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderRadius: CARD_BORDER_RADIUS,
  },
  cardContent: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  cardContentInner: {
    alignItems: 'flex-end',
    padding: 18,
    width: '100%',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
    textAlign: 'right',
  },
  badgeRowsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  badge: {
    marginLeft: 6,
    marginBottom: 4,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#454B54',
  },
  badgeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default JoinResult;