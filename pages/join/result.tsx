import React, { useMemo, useState } from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { Icon } from '@toss-design-system/react-native';

const { width: windowWidth } = Dimensions.get('window');

const CARD_WIDTH = windowWidth - 48;
const CARD_BORDER_RADIUS = 18;
const CARD_MARGIN_BOTTOM = 16;

export const Route = createRoute('/join/result', {
  validateParams: (params) => params,
  component: JoinResult,
});

// -------- 타입 선언 --------
interface TopPopularPlace {
  name: string;
  photo: string;
  lat: number;
  lng: number;
}

interface PlaceResult {
  name: string;
  takenDay: number;
  photo: string;
  tendency: string[];
  topPopularPlaceList: TopPopularPlace[];
}
// ---------------------------

// 필요시 여기에 변경
const DAY_TAB_LIST = [
  { label: '1박 2일 추천', takenDay: 1 },
  { label: '3박 4일 추천', takenDay: 3 },
];

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function PlaceCard({ place }: { place: PlaceResult }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: place.photo }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        <View style={styles.tagsRow}>
          {place.tendency.slice(0, 5).map((tag, idx) => (
            <Tag label={tag} key={idx} />
          ))}
        </View>
      </View>
    </View>
  );
}

function JoinResult() {
  // 파라미터로 전달된 result (PlaceResult[])
  const params = Route.useParams();
  const result: PlaceResult[] = params.result ?? [];
  const navigation = useNavigation();

  // 탭 상태: 1박2일, 3박4일 등
  const [selectedTab, setSelectedTab] = useState(0);

  // 탭별 place 필터링
  const filteredPlaces: PlaceResult[] = useMemo(() => {
    const takenDay = DAY_TAB_LIST[selectedTab].takenDay;
    return result?.filter((place) => place.takenDay === takenDay) ?? [];
  }, [result, selectedTab]);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="icon-arrow-left-mono" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>다님</Text>
        <View style={{ width: 24, alignItems: 'flex-end' }}>
          <Icon name="icon-close-mono" size={24} color="#C2C2C2" />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <Text style={styles.title}>나그네님,{"\n"}이런 여행지는 어때요?</Text>
          <Text style={styles.desc}>여행 성향을 기반으로 추천된 여행지예요!</Text>
        </View>
        {/* 탭 */}
        <View style={styles.tabsRow}>
          {DAY_TAB_LIST.map((tab, idx) => (
            <TouchableOpacity
              key={tab.takenDay}
              style={[
                styles.tabBtn,
                selectedTab === idx && styles.tabBtnActive,
              ]}
              onPress={() => setSelectedTab(idx)}
              activeOpacity={0.85}
            >
              <Text style={[
                styles.tabBtnText,
                selectedTab === idx && styles.tabBtnTextActive,
              ]}>
                {tab.label}
              </Text>
              {selectedTab === idx && <View style={styles.tabPointer} />}
            </TouchableOpacity>
          ))}
        </View>
        {/* 카드 리스트 */}
        <View style={{ paddingHorizontal: 24, marginTop: 10 }}>
          {filteredPlaces.length === 0 && (
            <Text style={{ color: '#888', marginVertical: 36 }}>추천 결과가 없습니다.</Text>
          )}
          {filteredPlaces.map((place, idx) => (
            <PlaceCard place={place} key={place.name + idx} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  headerTitle: { fontWeight: 'bold', fontSize: 18, color: '#222' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    marginTop: 0,
  },
  desc: {
    color: '#7C7C7C',
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 10,
  },
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
  card: {
    width: CARD_WIDTH,
    aspectRatio: 1.9,
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
    marginBottom: CARD_MARGIN_BOTTOM,
    backgroundColor: '#eee',
    position: 'relative',
  },
  cardImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.19)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default JoinResult;