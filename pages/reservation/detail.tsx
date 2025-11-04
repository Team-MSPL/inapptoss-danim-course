import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
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
import WebView from "@granite-js/native/react-native-webview";
import Pdml from "../../components/pdml"; // your pdml index export (object + named exports)

export const Route = createRoute("/reservation/detail", {
  validateParams: (params) => params,
  component: ReservationDetail,
});

type DtlRaw = any;

function safe<T = any>(v: any, def: T): T {
  return v === undefined || v === null ? def : v;
}

function extractLocationFromModuleContent(moduleContent?: any) {
  if (!moduleContent) return null;
  const latlng = moduleContent?.latlng ?? null;
  if (latlng && (latlng.latitude || latlng.longitude)) return latlng;
  if (moduleContent?.latitude || moduleContent?.longitude) {
    return {
      latitude: moduleContent.latitude,
      longitude: moduleContent.longitude,
      map_snap_url: moduleContent?.map_snap_url ?? null,
      zoom_lv: moduleContent?.zoom_lv ?? null,
      desc: moduleContent?.location_name ?? moduleContent?.desc ?? null,
    };
  }
  const list = moduleContent?.list;
  if (Array.isArray(list)) {
    for (const entry of list) {
      const cand = entry?.latlng ?? entry?.content?.latlng ?? null;
      if (cand && (cand.latitude || cand.longitude)) return cand;
      const locationInfo = entry?.location_info ?? entry?.location_info?.properties;
      if (locationInfo) {
        const cand2 = locationInfo?.latlng ?? null;
        if (cand2 && (cand2.latitude || cand2.longitude)) return cand2;
      }
    }
  }
  const propsLatlng = moduleContent?.properties?.latlng;
  if (propsLatlng && (propsLatlng.latitude || propsLatlng.longitude)) return propsLatlng;
  return null;
}

function stripHtmlTags(html?: string) {
  if (!html) return "";
  const withoutScripts = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  const withBreaks = withoutStyles.replace(/<(\/)?(p|div|br|li|ul|ol|tr|table|h[1-6])[^>]*>/gi, "\n");
  const stripped = withBreaks.replace(/<\/?[^>]+(>|$)/g, "");
  return stripped.replace(/\n\s*\n+/g, "\n").trim();
}

export default function ReservationDetail() {
  const navigation = useNavigation();
  const params: { dtl?: DtlRaw; dtlInfo?: any; order_no?: string; listItem?: any } = Route.useParams();

  const dtl = params?.dtl ?? {};
  const dtlInfo = params?.dtlInfo ?? {};

  const sDate = safe(dtl?.s_date ?? dtl?.start_date ?? params?.listItem?.s_date, "");
  const eventTime = safe(dtl?.event_time ?? dtl?.time ?? dtl?.event_backup_data ?? "", "");
  const canCancel = Boolean(dtl?.can_cancel ?? false);

  // experience location (first latlng found in PMDL_EXPERIENCE_LOCATION)
  const experienceLocation = useMemo(() => {
    try {
      const list =
        dtlInfo?.product_summary?.description_module_for_render?.PMDL_EXPERIENCE_LOCATION?.content?.list;
      if (!Array.isArray(list)) return null;
      for (const e of list) {
        const lat = e?.latlng ?? e?.content?.latlng ?? null;
        if (lat && (lat.latitude || lat.longitude)) return lat;
        const props = e?.location_info ?? e?.location_info?.properties;
        if (props?.latlng) return props.latlng;
      }
      return null;
    } catch {
      return null;
    }
  }, [dtlInfo]);

  const mapImageUrl = useMemo(() => {
    if (!experienceLocation) return null;
    const snap = experienceLocation?.map_snap_url ?? experienceLocation?.map_snap ?? "";
    if (!snap) return null;
    if (snap.startsWith("http://") || snap.startsWith("https://")) return snap;
    return `https://${snap}`;
  }, [experienceLocation]);

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

  // Generic fallback renderer (keeps previous behavior for modules without dedicated component)
  function renderModule(moduleKey: string, moduleObj: any) {
    if (!moduleObj) return null;
    const moduleTitle = moduleObj.module_title ?? moduleObj.title ?? moduleKey;
    const content = moduleObj.content ?? moduleObj;

    if (moduleObj?.use_html && content?.type === "text" && content?.desc) {
      const html = `
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial; color: #111827; padding: 12px; margin:0; }
              p { margin: 0 0 12px 0; line-height:1.5; color: #374151; }
            </style>
          </head>
          <body>${content.desc}</body>
        </html>
      `;
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleTitle}
          </Text>
          <View style={{ height: 220, marginTop: 8, borderRadius: 8, overflow: "hidden", backgroundColor: colors.grey50 }}>
            <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled />
          </View>
        </View>
      );
    }

    if (content?.type === "text" && content?.desc) {
      const plain = stripHtmlTags(content.desc);
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleTitle}
          </Text>
          <Text typography="t7" color={colors.grey700} style={styles.sectionBody}>
            {plain}
          </Text>
        </View>
      );
    }

    if (content?.type === "properties" && content?.properties) {
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleTitle}
          </Text>
          <View style={{ marginTop: 8 }}>
            {Object.entries(content.properties).map(([pKey, pVal]: any) => {
              if (!pVal) return null;
              if (pVal.type === "list" && Array.isArray(pVal.list)) {
                return (
                  <View key={pKey} style={{ marginTop: 8 }}>
                    {pVal.title ? <Text typography="t7" color={colors.grey900}>{pVal.title}</Text> : null}
                    {pVal.list.map((li: any, idx: number) => (
                      <Text key={idx} typography="t7" color={colors.grey700} style={{ marginTop: 4 }}>
                        - {li?.desc ?? ""}
                      </Text>
                    ))}
                  </View>
                );
              }
              if (pVal.type === "content" && pVal.desc) {
                const plain = pVal?.use_html ? null : stripHtmlTags(pVal.desc);
                return pVal?.use_html ? (
                  <View key={pKey} style={{ marginTop: 8 }}>
                    <View style={{ height: 160 }}>
                      <WebView originWhitelist={["*"]} source={{ html: String(pVal.desc) }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled />
                    </View>
                  </View>
                ) : (
                  <Text key={pKey} typography="t7" color={colors.grey700} style={{ marginTop: 8 }}>
                    {plain}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        </View>
      );
    }

    if (content?.media && Array.isArray(content.media) && content.media.length > 0) {
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleTitle}
          </Text>
          <View style={{ marginTop: 8 }}>
            {content.media.map((m: any, idx: number) => {
              const src = m?.source_content ?? null;
              if (!src) return null;
              const uri = src.startsWith("http") ? src : `https://${src}`;
              return <Image key={idx} source={{ uri }} style={styles.mediaImage} resizeMode="cover" />;
            })}
          </View>
        </View>
      );
    }

    if (Array.isArray(content?.list) && content.list.length > 0) {
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleTitle}
          </Text>
          <View style={{ marginTop: 8 }}>
            {content.list.map((it: any, idx: number) => {
              const dailyTitle = it?.daily_title ?? it?.title ?? null;
              const desc = it?.desc ?? it?.daily_schedule_list ?? null;
              return (
                <View key={idx} style={{ marginBottom: 10 }}>
                  {dailyTitle ? <Text typography="t7" color={colors.grey900}>{dailyTitle}</Text> : null}
                  {it?.daily_schedule_list?.list && Array.isArray(it.daily_schedule_list.list)
                    ? it.daily_schedule_list.list.map((row: any, rIdx: number) => (
                      <View key={rIdx} style={{ marginTop: 6 }}>
                        <Text typography="t7" color={colors.grey700}>
                          {row?.time ? `${row.time} ` : ""}{row?.content ?? ""}
                        </Text>
                      </View>
                    ))
                    : typeof desc === "string"
                      ? <Text typography="t7" color={colors.grey700}>{stripHtmlTags(desc)}</Text>
                      : null}
                </View>
              );
            })}
          </View>
        </View>
      );
    }

    const possibleLocation = extractLocationFromModuleContent(content);
    if (possibleLocation && (possibleLocation.latitude || possibleLocation.lat || possibleLocation.longitude || possibleLocation.lng)) {
      const lat = Number(possibleLocation.latitude ?? possibleLocation.lat ?? possibleLocation.latlng?.latitude);
      const lng = Number(possibleLocation.longitude ?? possibleLocation.lng ?? possibleLocation.latlng?.longitude);
      const zoom = possibleLocation?.zoom_lv ? Number(possibleLocation.zoom_lv) : 12;
      const desc = possibleLocation?.desc ?? possibleLocation?.location_name ?? null;
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>{moduleTitle}</Text>
          {desc ? <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>{desc}</Text> : null}
          <View style={{ marginTop: 12 }}>
            <MapWebView
              lat={lat}
              lng={lng}
              googleApiKey={(global as any).GOOGLE_API_KEY ?? ""}
              zoom={zoom}
              range={Number(possibleLocation?.zoom_lv ?? 1)}
            />
          </View>
        </View>
      );
    }

    if (content?.desc) {
      const plain = stripHtmlTags(content.desc);
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>
            {moduleTitle}
          </Text>
          <Text typography="t7" color={colors.grey700} style={styles.sectionBody}>
            {plain}
          </Text>
        </View>
      );
    }

    return null;
  }

  const modulesRoot = dtlInfo?.product_summary?.description_module_for_render ?? {};
  const orderedModuleKeys = useMemo(() => {
    const prefer = [
      "PMDL_EXPERIENCE_LOCATION",
      "PMDL_EXCHANGE",
      "PMDL_INC_NINC",
      "PMDL_NOTICE",
      "PMDL_PURCHASE_SUMMARY",
      "PMDL_EXCHANGE_LOCATION",
      "PMDL_USE_VALID",
      "PMDL_WIFI",
    ];
    const allKeys = Object.keys(modulesRoot ?? {});
    const rest = allKeys.filter((k) => !prefer.includes(k));
    return [...prefer.filter((k) => allKeys.includes(k)), ...rest];
  }, [modulesRoot]);

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

  const lat = experienceLocation ? Number(experienceLocation.latitude || experienceLocation.lat || experienceLocation.latlng?.latitude) : null;
  const lng = experienceLocation ? Number(experienceLocation.longitude || experienceLocation.lng || experienceLocation.latlng?.longitude) : null;

  const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY;

  return (
    <View style={styles.screen}>
      <FixedBottomCTAProvider>
        <Top.Root
          title={<Top.TitleParagraph typography="t3" color={colors.grey900}>예약 상세 내역</Top.TitleParagraph>}
        />

        <ScrollView contentContainerStyle={styles.container}>
          <View style={{ paddingHorizontal: 4 }}>
            <View style={styles.section}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                <View style={{ width: 4, height: 29, backgroundColor: colors.green200, borderRadius: 100 }} />
                <Text typography="t4" fontWeight="medium" style={styles.sectionHeading}>
                  예약 정보
                </Text>
              </View>

              <View style={styles.row}>
                <View style={styles.iconCell}>
                  <Icon name="icon-calendar-timetable" size={24} />
                </View>
                <View style={styles.cellBody}>
                  <Text typography="t5" fontWeight="regular" color={colors.black}>{dateDisplay}</Text>
                </View>

                <View style={styles.iconCell}>
                  <Icon name="icon-clock-blue-weak" size={24} />
                </View>
                <View style={styles.cellBody}>
                  <Text typography="t5" fontWeight="regular" color={colors.black}>{eventTime || "—"}</Text>
                </View>
              </View>

              <View style={[styles.row, { marginTop: 8 }]}>
                <View style={styles.iconCell}>
                  <Icon name="icon-user-two-blue-tab" size={24} />
                </View>
                <View style={styles.cellBody}>
                  <Text typography="t5" fontWeight="regular" color={colors.black}>
                    {peopleText}
                  </Text>
                </View>
              </View>
            </View>

            {experienceLocation ? (
              <View style={styles.section}>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 4, height: 29, backgroundColor: colors.green200, borderRadius: 100 }} />
                  <Text typography="t4" fontWeight="medium" style={styles.sectionHeading}>
                    주소
                  </Text>
                </View>

                <TouchableOpacity activeOpacity={0.8}>
                  <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>
                    {experienceLocation?.desc?.split?.("\n")?.[0] ?? "위치 보기"}
                  </Text>
                  <Text typography="t8" color={colors.grey500} style={{ marginTop: 4 }}>
                    {experienceLocation?.desc ?? ""}
                  </Text>
                </TouchableOpacity>

                {lat != null && lng != null ? (
                  <View style={{ marginTop: 12 }}>
                    <MapWebView
                      lat={lat}
                      lng={lng}
                      googleApiKey={GOOGLE_API_KEY}
                      zoom={experienceLocation?.zoom_lv ? Number(experienceLocation.zoom_lv) : 12}
                      range={Number(experienceLocation?.zoom_lv ?? 1)}
                    />
                  </View>
                ) : mapImageUrl ? (
                  <Image source={{ uri: mapImageUrl }} style={styles.mapImage} resizeMode="cover" />
                ) : null}
              </View>
            ) : null}

            {/* Render ordered modules: prefer dedicated PDML component if exists, fallback to generic renderer */}
            {orderedModuleKeys.map((key) => {
              const moduleData = modulesRoot[key];
              if (!moduleData) return null;

              const PdmlComponent = (Pdml as any)[key];
              if (PdmlComponent) {
                return (
                  <PdmlComponent
                    key={key}
                    moduleKey={key}
                    moduleData={moduleData}
                    googleApiKey={GOOGLE_API_KEY}
                  />
                );
              }

              const normalizedKey = key.replace(/\./g, "_");
              const PdmlComponent2 = (Pdml as any)[normalizedKey];
              if (PdmlComponent2) {
                return (
                  <PdmlComponent2
                    key={key}
                    moduleKey={key}
                    moduleData={moduleData}
                    googleApiKey={GOOGLE_API_KEY}
                  />
                );
              }

              return renderModule(key, moduleData);
            })}

            <View style={styles.section}>
              <Text typography="t6" style={styles.sectionTitle}>주문 내역</Text>
              <TouchableOpacity onPress={() => Alert.alert("주문 내역 확인", "주문 내역 보기(미구현)")}>
                <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>
                  주문 내역 확인
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 90 }} />
          </View>
        </ScrollView>

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
  section: { paddingHorizontal: 20, marginBottom: 40 },
  sectionHeading: { marginBottom: 8 },
  sectionTitle: {
    marginBottom: 8,
    color: colors.grey800,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
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
  mediaImage: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.grey50,
  },
  cardFooterPlaceholder: { height: 80 },
});