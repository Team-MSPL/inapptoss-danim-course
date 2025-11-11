import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Dimensions,
  Linking,
  TextInput,
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
import Pdml from "../../components/pdml";

export const Route = createRoute("/reservation/detail", {
  validateParams: (params) => params,
  component: ReservationDetail,
});

type DtlRaw = any;

function safe<T = any>(v: any, def: T): T {
  return v === undefined || v === null ? def : v;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// -----------------------------
// HTML/Text helpers & renderer
// -----------------------------
function decodeHtmlEntities(str: string) {
  if (!str) return "";
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "");
}

/**
 * Replace anchors like <a href="...">label</a> with a token [[[URL|label]]]
 * so we can later map token -> clickable link while rendering native Text.
 * We keep label readable.
 */
function extractAndTokenizeAnchors(html: string) {
  if (!html) return html;
  // Replace anchors with token form: [[[url|label]]]
  return html.replace(/<a\b[^>]*href=(["']?)(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_, _q, href, label) => {
    const safeLabel = (label || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
    const safeHref = String(href || "").trim();
    return `[[[${safeHref}|${safeLabel}]]]`;
  });
}

/**
 * Convert HTML (or plain) string into paragraph/list blocks.
 * Special tokens [[[url|label]]] are preserved.
 */
function splitToBlocksWithAnchors(text: string): string[] {
  if (!text) return [];
  let t = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = decodeHtmlEntities(t);

  // Tokenize anchors to avoid removing them when stripping tags
  t = extractAndTokenizeAnchors(t);

  // Replace common tags with newlines/markers
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/p>/gi, "\n\n");
  t = t.replace(/<li>/gi, "\n• ");
  // remove remaining HTML tags (but keep our tokens)
  t = t.replace(/<\/?[^>]+(>|$)/g, "");
  // collapse multiple spaces
  t = t.replace(/[ \t]{2,}/g, " ");
  // normalize multiple newlines into paragraphs
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.trim();
  const parts = t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return parts;
}

const URL_REGEX = /((https?:\/\/|www\.)[^\s<>()]+)/gi;

/**
 * Given a text piece, produce an array of parts where each part is either plain text or a url.
 * Also detect our tokenized anchors [[[url|label]]] and convert them to an object with url+label.
 */
function tokenizeLinkParts(text: string): Array<{ text: string; url?: string; isAnchorLabel?: boolean }> {
  const parts: Array<{ text: string; url?: string; isAnchorLabel?: boolean }> = [];
  if (!text) return parts;

  // First handle anchor tokens [[[url|label]]]
  const anchorTokenRegex = /\[\[\[\s*(.*?)\|(.*?)\s*\]\]\]/g;
  let lastIndex = 0;
  let m;
  while ((m = anchorTokenRegex.exec(text)) !== null) {
    const offset = m.index;
    const whole = m[0];
    const url = m[1];
    const label = m[2];
    if (offset > lastIndex) {
      const before = text.slice(lastIndex, offset);
      // further split before by raw URLs
      splitRawUrlsInto(parts, before);
    }
    parts.push({ text: label, url: ensureProtocol(url), isAnchorLabel: true });
    lastIndex = offset + whole.length;
  }
  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex);
    splitRawUrlsInto(parts, rest);
  }
  if (parts.length === 0) parts.push({ text });
  return parts;
}

/** Helper: split raw URLs in a text chunk and push into parts array */
function splitRawUrlsInto(parts: Array<{ text: string; url?: string }>, chunk: string) {
  let last = 0;
  chunk.replace(URL_REGEX, (match: string, _p1: string, _p2: string, offset: number) => {
    if (offset > last) {
      parts.push({ text: chunk.slice(last, offset) });
    }
    const href = ensureProtocol(match);
    parts.push({ text: match, url: href });
    last = offset + match.length;
    return match;
  });
  if (last < chunk.length) {
    parts.push({ text: chunk.slice(last) });
  }
}

/** Ensure URL has protocol */
function ensureProtocol(u: string) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/** RichTextRenderer renders paragraphs, lists and clickable links (including anchor tokens). */
function RichTextRenderer({ text }: { text: string }) {
  const blocks = splitToBlocksWithAnchors(text);

  return (
    <View>
      {blocks.map((blk, idx) => {
        const isList = /^•\s+/.test(blk);
        if (isList) {
          const lines = blk.split(/\n+/).map((l) => l.replace(/^•\s+/, "").trim()).filter(Boolean);
          return (
            <View key={idx} style={{ marginBottom: 8 }}>
              {lines.map((line, li) => (
                <View key={li} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                  <Text style={{ marginRight: 8, lineHeight: 20 }}>•</Text>
                  <Text style={{ flex: 1, lineHeight: 20, color: colors.grey700 }}>
                    {tokenizeLinkParts(line).map((part, pi) => {
                      if (part.url) {
                        return (
                          <Text
                            key={pi}
                            style={{ color: colors.blue500 }}
                            onPress={() => {
                              try {
                                Linking.openURL(part.url!);
                              } catch {
                                Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다.");
                              }
                            }}
                          >
                            {part.text}
                          </Text>
                        );
                      }
                      return <Text key={pi}>{part.text}</Text>;
                    })}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={idx} typography="t7" color={colors.grey700} style={{ marginBottom: 10, lineHeight: 22 }}>
            {tokenizeLinkParts(blk).map((part, pi) => {
              if (part.url) {
                return (
                  <Text
                    key={pi}
                    style={{ color: colors.blue500 }}
                    onPress={() => {
                      try {
                        Linking.openURL(part.url!);
                      } catch {
                        Alert.alert("링크 열기 실패", "브라우저를 열 수 없습니다.");
                      }
                    }}
                  >
                    {part.text}
                  </Text>
                );
              }
              return <Text key={pi}>{part.text}</Text>;
            })}
          </Text>
        );
      })}
    </View>
  );
}

// -----------------------------
// ReservationDetail component
// -----------------------------
export default function ReservationDetail() {
  const navigation = useNavigation();
  const params: { dtl?: DtlRaw; dtlInfo?: any; order_no?: string; listItem?: any } = Route.useParams();

  const dtl = params?.dtl ?? {};
  const dtlInfo = params?.dtlInfo ?? {};

  const sDate = safe(dtl?.s_date ?? dtl?.start_date ?? params?.listItem?.s_date, "");
  const eventTime = safe(dtl?.event_time ?? dtl?.time ?? dtl?.event_backup_data ?? "", "");
  const canCancel = Boolean(dtl?.can_cancel ?? false);

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

  const pickupEntries = useMemo(() => {
    if (!Array.isArray(dtl?.traffic)) return [];
    return dtl.traffic.filter((t: any) => typeof t?.traffic_type === "string" && t.traffic_type.startsWith("pickup"))
      .map((t: any) => ({
        traffic_type: t.traffic_type,
        s_date: t.s_date ?? "",
        s_time: t.s_time ?? "",
        s_location: t.s_location ?? t.s_addr ?? "",
        e_location: t.e_location ?? t.e_addr ?? "",
      }));
  }, [dtl]);

  const rentcarEntries = useMemo(() => {
    if (!Array.isArray(dtl?.traffic)) return [];
    return dtl.traffic.filter((t: any) => typeof t?.traffic_type === "string" && t.traffic_type.startsWith("rentcar"))
      .map((t: any) => ({
        traffic_type: t.traffic_type,
        s_date: t.s_date ?? "",
        s_location: t.s_location ?? t.s_addr ?? "",
        e_location: t.e_location ?? t.e_addr ?? "",
        provide_wifi: Boolean(t.provide_wifi),
        provide_gps: Boolean(t.provide_gps),
        is_rent_customize: Boolean(t.is_rent_customize),
      }));
  }, [dtl]);

  function text(v: any) {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object" && typeof v.desc === "string") return v.desc;
    return "";
  }

  function PickupCard({ entry }: { entry: any }) {
    return (
      <View style={styles.infoCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <View style={{ width: 6, height: 26, backgroundColor: colors.green200, borderRadius: 3, marginRight: 12 }} />
          <Text typography="t5" fontWeight="bold">픽업 정보</Text>
        </View>

        <View style={styles.infoRow}>
          <Text typography="t7" color={colors.grey700}>픽업 날짜</Text>
          <Text typography="t7" color={colors.black}>{text(entry.s_date) || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text typography="t7" color={colors.grey700}>픽업 시간</Text>
          <Text typography="t7" color={colors.black}>{text(entry.s_time) || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text typography="t7" color={colors.grey700}>승차 정보</Text>
          <Text typography="t7" color={colors.black}>
            {text(entry.s_location) || (text(entry.e_location) ? text(entry.e_location) : "—")}
          </Text>
        </View>
      </View>
    );
  }

  function RentcarCard({ entry }: { entry: any }) {
    const extras: string[] = [];
    if (entry.is_rent_customize) extras.push("맞춤 대여");
    if (entry.provide_wifi) extras.push("Wi‑Fi");
    if (entry.provide_gps) extras.push("GPS");

    return (
      <View style={styles.infoCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <View style={{ width: 6, height: 26, backgroundColor: colors.green200, borderRadius: 3, marginRight: 12 }} />
          <Text typography="t5" fontWeight="bold">렌터카 정보</Text>
        </View>

        <View style={styles.infoRow}>
          <Text typography="t7" color={colors.grey700}>대여 날짜</Text>
          <Text typography="t7" color={colors.black}>{text(entry.s_date) || "—"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text typography="t7" color={colors.grey700}>시작/종료</Text>
          <Text typography="t7" color={colors.black}>{text(entry.s_location) || "—"} → {text(entry.e_location) || "—"}</Text>
        </View>

        {extras.length > 0 ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text typography="t7" color={colors.grey700}>추가 옵션</Text>
              <Text typography="t7" color={colors.black}>{extras.join(" · ")}</Text>
            </View>
          </>
        ) : null}
      </View>
    );
  }

  function renderModule(moduleKey: string, moduleObj: any) {
    if (!moduleObj) return null;
    const moduleTitle = moduleObj.module_title ?? moduleObj.title ?? moduleKey;
    const content = moduleObj.content ?? moduleObj;

    // If module explicitly contains HTML and also has complex tags, fallback to WebView for fidelity
    if (moduleObj?.use_html && content?.type === "text" && content?.desc) {
      const htmlStr = String(content.desc || "");
      const hasComplex = /<(table|img|iframe|script|form|video|audio)\b/i.test(htmlStr);
      if (hasComplex) {
        const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${htmlStr}</body></html>`;
        return (
          <View style={styles.section} key={moduleKey}>
            <Text typography="t6" style={styles.sectionTitle}>{moduleTitle}</Text>
            <View style={{ height: 220, marginTop: 8, borderRadius: 8, overflow: "hidden", backgroundColor: colors.grey50 }}>
              <WebView originWhitelist={["*"]} source={{ html }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled />
            </View>
          </View>
        );
      }

      // For simpler HTML, convert & tokenize anchors then render natively
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>{moduleTitle}</Text>
          <View style={{ marginTop: 8 }}>
            <RichTextRenderer text={String(content.desc)} />
          </View>
        </View>
      );
    }

    // Plain text content: render with RichTextRenderer to preserve paragraphs, bullets and links
    if (content?.type === "text" && content?.desc) {
      return (
        <View style={styles.section} key={moduleKey}>
          <Text typography="t6" style={styles.sectionTitle}>{moduleTitle}</Text>
          <View style={{ marginTop: 8 }}>
            <RichTextRenderer text={String(content.desc)} />
          </View>
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
      "PMDL_INTRODUCE_SUMMARY",
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

    navigation.navigate("/reservation/cancel", {
      order_no: params.order_no,
      dtl: params.dtl,
      dtlInfo: params.dtlInfo,
      listItem: params.listItem,
    });
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

  const GOOGLE_API_KEY = import.meta.env.GOOGLE_API_KEY;

  function onOrderDetail() {
    navigation.navigate("/reservation/order-detail", {
      order_no: params.order_no,
      dtl: params.dtl,
      dtlInfo: params.dtlInfo,
      listItem: params.listItem,
    });
  }

  return (
    <View style={styles.screen}>
      <FixedBottomCTAProvider>
        <Top.Root title={<Top.TitleParagraph typography="t3" color={colors.grey900}>예약 상세 내역</Top.TitleParagraph>} />

        <ScrollView contentContainerStyle={styles.container}>
          <View style={{ paddingHorizontal: 4 }}>
            <View style={styles.section}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                <View style={{ width: 4, height: 29, backgroundColor: colors.green200, borderRadius: 100 }} />
                <Text typography="t4" fontWeight="medium" style={styles.sectionHeading}>예약 정보</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.iconCell}><Icon name="icon-calendar-timetable" size={24} /></View>
                <View style={styles.cellBody}><Text typography="t5" fontWeight="regular" color={colors.black}>{dateDisplay}</Text></View>

                <View style={styles.iconCell}><Icon name="icon-clock-blue-weak" size={24} /></View>
                <View style={styles.cellBody}><Text typography="t5" fontWeight="regular" color={colors.black}>{eventTime || "—"}</Text></View>
              </View>

              <View style={[styles.row, { marginTop: 8 }]}>
                <View style={styles.iconCell}><Icon name="icon-user-two-blue-tab" size={24} /></View>
                <View style={styles.cellBody}><Text typography="t5" fontWeight="regular" color={colors.black}>{peopleText}</Text></View>
              </View>
            </View>

            {experienceLocation ? (
              <View style={styles.section}>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 4, height: 29, backgroundColor: colors.green200, borderRadius: 100 }} />
                  <Text typography="t4" fontWeight="medium" style={styles.sectionHeading}>주소</Text>
                </View>

                <TouchableOpacity activeOpacity={0.8}>
                  <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>
                    {experienceLocation?.desc?.split?.("\n")?.[0] ?? "위치 보기"}
                  </Text>
                  <Text typography="t8" color={colors.grey500} style={{ marginTop: 4 }}>
                    {experienceLocation?.desc ?? ""}
                  </Text>
                </TouchableOpacity>

                {experienceLocation?.latitude && experienceLocation?.longitude ? (
                  <View style={{ marginTop: 12 }}>
                    <MapWebView lat={Number(experienceLocation.latitude)} lng={Number(experienceLocation.longitude)} googleApiKey={GOOGLE_API_KEY} zoom={12} range={1} />
                  </View>
                ) : mapImageUrl ? (
                  <Image source={{ uri: mapImageUrl }} style={styles.mapImage} resizeMode="cover" />
                ) : null}
              </View>
            ) : null}

            {pickupEntries.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                {pickupEntries.map((p: any, i: number) => (
                  <PickupCard key={`pickup-${i}`} entry={p} />
                ))}
              </View>
            )}

            {rentcarEntries.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                {rentcarEntries.map((r: any, i: number) => (
                  <RentcarCard key={`rentcar-${i}`} entry={r} />
                ))}
              </View>
            )}

            {orderedModuleKeys.map((key) => {
              const moduleData = modulesRoot[key];
              if (!moduleData) return null;
              const PdmlComponent = (Pdml as any)[key];
              if (PdmlComponent) return <PdmlComponent key={key} moduleKey={key} moduleData={moduleData} googleApiKey={GOOGLE_API_KEY} />;
              const normalizedKey = key.replace(/\./g, "_");
              const PdmlComponent2 = (Pdml as any)[normalizedKey];
              if (PdmlComponent2) return <PdmlComponent2 key={key} moduleKey={key} moduleData={moduleData} googleApiKey={GOOGLE_API_KEY} />;
              return renderModule(key, moduleData);
            })}

            <View style={styles.section}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                <View style={{ width: 4, height: 29, backgroundColor: colors.green200, borderRadius: 100 }} />
                <Text typography="t5" style={styles.sectionTitle}>주문 내역</Text>
              </View>
              <TouchableOpacity onPress={onOrderDetail}>
                <Text typography="t7" color={colors.blue500} style={{ marginTop: 8 }}>주문 내역 확인</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 90 }} />
          </View>
        </ScrollView>

        <FixedBottomCTA type={canCancel ? "danger" : "danger"} onPress={onCancelPress}>
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

  /* pickup / rentcar card styles */
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.grey100,
    marginBottom: 12,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey100,
  },
  smallImage: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    backgroundColor: colors.grey50,
  },

  /* dropdown, option styles reused elsewhere in app */
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 220,
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  optionRowActive: {
    backgroundColor: colors.blue500,
  },
});