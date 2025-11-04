import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, Dimensions } from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import {
  Top,
  Text,
  colors,
  FixedBottomCTAProvider,
  FixedBottomCTA,
  Icon,
} from "@toss-design-system/react-native";
import MapWebView from "../../components/product/map-webview";

export const Route = createRoute("/reservation/detail", {
  validateParams: (params) => params,
  component: ReservationDetail,
});

type DtlRaw = any;

function safe<T = any>(v: any, def: T): T {
  return v === undefined || v === null ? def : v;
}

function extractLocationFromDtlInfo(dtlInfo?: any) {
  try {
    const list =
      dtlInfo?.product_summary?.description_module_for_render?.PMDL_EXPERIENCE_LOCATION?.content?.list;
    if (!Array.isArray(list) || list.length === 0) return null;
    for (const entry of list) {
      const latlng = entry?.latlng ?? entry?.content?.latlng ?? null;
      if (latlng && (latlng.latitude || latlng.longitude || latlng.desc || latlng.map_snap_url)) {
        return latlng;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default function ReservationDetail() {
  const navigation = useNavigation();
  const params: { dtl?: DtlRaw; dtlInfo?: any; order_no?: string; listItem?: any } = Route.useParams();

  const dtl = params?.dtl ?? {};
  const dtlInfo = params?.dtlInfo ?? {};

  const sDate = safe(dtl?.s_date ?? dtl?.start_date ?? params?.listItem?.s_date, "");
  const eventTime = safe(dtl?.event_time ?? dtl?.time ?? dtl?.event_backup_data ?? "", "");
  const canCancel = Boolean(dtl?.can_cancel ?? false);

  const location = useMemo(() => extractLocationFromDtlInfo(dtlInfo), [dtlInfo]);

  const mapImageUrl = useMemo(() => {
    if (!location) return null;
    const snap = location?.map_snap_url ?? location?.map_snap ?? "";
    if (!snap) return null;
    if (snap.startsWith("http://") || snap.startsWith("https://")) return snap;
    return `https://${snap}`;
  }, [location]);

  const peopleText = useMemo(() => {
    if (dtl && Array.isArray(dtl?.skus) && dtl?.skus.length > 0) {
      const peopleCount = dtl.skus.reduce((s: number, sk: any) => s + (Number(sk?.qty ?? 1) || 0), 0);
      const unitText = (dtl?.unit ?? "").toString().trim();

      const skuWithSpec =
        dtl.skus.find(
          (sk: any) =>
            sk?.spec &&
            typeof sk.spec === "object" &&
            (sk.spec["티켓 종류"] || sk.spec["Ticket Type"] || sk.spec["ticket_type"])
        ) ?? null;

      if (skuWithSpec) {
        const ticketType =
          skuWithSpec.spec["티켓 종류"] ??
          skuWithSpec.spec["Ticket Type"] ??
          skuWithSpec.spec["ticket_type"] ??
          "";
        return unitText ? `${ticketType} ${peopleCount}${unitText}` : `${ticketType} ${peopleCount}명`;
      }

      return unitText ? `${peopleCount}${unitText}` : `인원수 ${peopleCount}명`;
    }

    const listItemSkus = params?.listItem?.skus ?? null;
    if (Array.isArray(listItemSkus) && listItemSkus.length > 0) {
      const count = listItemSkus.reduce((s: number, sk: any) => s + (Number(sk?.qty ?? 1) || 0), 0);
      return `${count}개`;
    }

    return `1명`;
  }, [dtl, params?.listItem]);

  function renderModule(title: string, moduleData: any) {
    if (!moduleData) return null;
    const content = moduleData?.content ?? null;
    if (!content) return null;

    if (content?.type === "text" && content?.desc) {
      return (
        <View style={styles.section}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleData.module_title ?? title}
          </Text>
          <Text typography="t7" color={colors.grey700} style={styles.sectionBody}>
            {String(content.desc ?? "")}
          </Text>
        </View>
      );
    }

    if (content?.type === "properties" && content?.properties) {
      return (
        <View style={styles.section}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleData.module_title ?? title}
          </Text>

          {Object.entries(content.properties).map(([key, prop]: any) => {
            if (!prop) return null;
            if (prop.type === "list" && Array.isArray(prop.list)) {
              return (
                <View key={key} style={{ marginTop: 8 }}>
                  <Text typography="t7" color={colors.grey700} style={{ marginBottom: 6 }}>
                    {prop.title ?? ""}
                  </Text>
                  {prop.list.map((it: any, idx: number) => (
                    <Text key={idx} typography="t7" color={colors.grey700} style={{ marginTop: 4 }}>
                      - {it?.desc ?? ""}
                    </Text>
                  ))}
                </View>
              );
            }
            if (prop?.type === "content" && prop?.desc) {
              return (
                <View key={key} style={{ marginTop: 8 }}>
                  <Text typography="t7" color={colors.grey700}>
                    {prop.desc}
                  </Text>
                </View>
              );
            }
            return null;
          })}
        </View>
      );
    }

    if (content?.desc) {
      return (
        <View style={styles.section}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleData.module_title ?? title}
          </Text>
          <Text typography="t7" color={colors.grey700} style={styles.sectionBody}>
            {String(content.desc ?? "")}
          </Text>
        </View>
      );
    }

    return null;
  }

  function onCancelPress() {
    if (!canCancel) {
      Alert.alert("취소 불가", "이 상품은 취소할 수 없습니다.");
      return;
    }
    Alert.alert("취소 요청", "예약을 취소하시겠습니까?", [
      { text: "아니오", style: "cancel" },
      {
        text: "예",
        onPress: () => {
          // TODO: call cancel API
          Alert.alert("취소 완료", "예약 취소 요청이 접수되었습니다.");
        },
      },
    ]);
  }

  const dateDisplay = (() => {
    if (!sDate) return "—";
    try {
      const d = new Date(sDate);
      if (isNaN(d.getTime())) return String(sDate);
      const yyyy = d.getFullYear();
      const mm = (`0${d.getMonth() + 1}`).slice(-2);
      const dd = (`0${d.getDate()}`).slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return String(sDate);
    }
  })();

  const lat = location ? Number(location.latitude || location.lat || location.latlng?.latitude) : null;
  const lng = location ? Number(location.longitude || location.lng || location.latlng?.longitude) : null;

  const GOOGLE_API_KEY =
    (global as any).GOOGLE_API_KEY ??
    (process.env && (process.env.GOOGLE_API_KEY as unknown as string)) ??
    "";

  return (
    <View style={styles.screen}>
      <FixedBottomCTAProvider>
        <Top.Root
          title={<Top.TitleParagraph typography="t3" color={colors.grey900}>예약 상세 내역</Top.TitleParagraph>}
        />

        <View style={styles.section}>
          <Text typography="t5" fontWeight="bold" style={styles.sectionHeading}>
            예약 정보
          </Text>

          <View style={styles.row}>
            <View style={styles.iconCell}>
              <Icon name="icon-calendar-timetable" size={20} color={colors.blue500} />
            </View>
            <View style={styles.cellBody}>
              <Text typography="t7" color={colors.grey900}>{dateDisplay}</Text>
            </View>

            <View style={styles.iconCell}>
              <Icon name="icon-clock-blue-weak" size={20} color={colors.blue500} />
            </View>
            <View style={styles.cellBody}>
              <Text typography="t7" color={colors.grey900}>{eventTime || "—"}</Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={styles.iconCell}>
              <Icon name="icon-user-two-blue-tab" size={20} color={colors.blue500} />
            </View>
            <View style={styles.cellBody}>
              <Text typography="t7" color={colors.grey900}>
                {peopleText}
              </Text>
            </View>
          </View>
        </View>

        {location ? (
          <View style={styles.section}>
            <Text typography="t6" style={styles.sectionTitle}>주소</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>
                {location?.desc?.split?.("\n")?.[0] ?? "위치 보기"}
              </Text>
              <Text typography="t8" color={colors.grey500} style={{ marginTop: 4 }}>
                {location?.desc ?? ""}
              </Text>
            </TouchableOpacity>

            {lat != null && lng != null ? (
              <View style={{ marginTop: 12 }}>
                <MapWebView
                  lat={lat}
                  lng={lng}
                  googleApiKey={GOOGLE_API_KEY}
                  zoom={location?.zoom_lv ? Number(location.zoom_lv) : 12}
                  range={Number(location?.zoom_lv ?? 1)}
                />
              </View>
            ) : mapImageUrl ? (
              <Image source={{ uri: mapImageUrl }} style={styles.mapImage} resizeMode="cover" />
            ) : null}
          </View>
        ) : null}

        {renderModule("이용 방법", dtlInfo?.product_summary?.description_module_for_render?.PMDL_EXCHANGE)}
        {renderModule("포함/불포함", dtlInfo?.product_summary?.description_module_for_render?.PMDL_INC_NINC)}
        {renderModule("유의사항", dtlInfo?.product_summary?.description_module_for_render?.PMDL_NOTICE)}
        {renderModule("구매 요약", dtlInfo?.product_summary?.description_module_for_render?.PMDL_PURCHASE_SUMMARY)}

        <View style={styles.section}>
          <Text typography="t6" style={styles.sectionTitle}>주문 내역</Text>
          <TouchableOpacity onPress={() => Alert.alert("주문 내역 확인", "주문 내역 보기(미구현)")}>
            <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>
              주문 내역 확인
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />

        <FixedBottomCTA type={canCancel ? "danger" : "default"} onPress={onCancelPress}>
          {canCancel ? "취소하기" : "취소 불가 상품이에요"}
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 32, paddingTop: 20 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeading: { marginBottom: 8 },
  sectionTitle: { marginBottom: 8, color: colors.grey800 },
  sectionBody: { color: colors.grey700 },
  row: { flexDirection: "row", alignItems: "center" },
  iconCell: { width: 28, alignItems: "flex-start" },
  cellBody: { flex: 1, paddingLeft: 8 },
  mapImage: {
    marginTop: 12,
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: colors.grey50,
  },
  cardFooterPlaceholder: { height: 80 },
});