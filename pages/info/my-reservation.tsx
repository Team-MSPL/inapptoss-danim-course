import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import { Text, colors, Icon, FixedBottomCTAProvider, Top, Badge } from "@toss-design-system/react-native";
import axiosAuth from "../../redux/api";

export const Route = createRoute("/info/my-reservation", {
  validateParams: (params) => params,
  component: MyReservation,
});

type BookingItem = {
  _id: string;
  order_no?: string;
  s_date?: string | null;
  created_at?: string;
  skus?: Array<{ sku_id?: string; qty?: number; price?: number; spec?: any }>;
  order_note?: string;
  total_price?: number;
  isActive?: boolean;
  [k: string]: any;
};

type DtlInfoRaw = any;
type DtlRaw = any;

type MergedBooking = {
  listItem: BookingItem;
  dtlInfo?: DtlInfoRaw;
  dtl?: DtlRaw;
};

function formatDateYMD(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = (`0${d.getMonth() + 1}`).slice(-2);
  const dd = (`0${d.getDate()}`).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}
function formatMonthTitle(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}
function isPastDate(dateStr?: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

/**
 * Normalize unit and build people/ticket text.
 * Rules:
 * - If dtl.skus exists, sum qty.
 * - If a sku.spec contains 티켓 종류 or Ticket Type, use that string as ticketType.
 * - If unit exists (non-empty string), append it after count (e.g. "2명", "3개", "1대", or "Traveler").
 * - If ticketType exists: show "티켓종류 count+unit" (e.g. "대인 2명").
 * - If unit missing: fall back to "인원수 N명" (Korean default) or `${N}개` for listItem-only fallback.
 */
function buildPeopleTextFromDtl(dtl?: any, listItem?: any): string {
  // dtl.skus preferred
  if (dtl && Array.isArray(dtl.skus) && dtl.skus.length > 0) {
    const count = dtl.skus.reduce((s: number, sk: any) => s + (Number(sk?.qty ?? 1) || 0), 0);
    const unit = (dtl?.unit ?? "").toString().trim();
    // try multiple keys for ticket type
    const skuWithSpec =
      dtl.skus.find(
        (sk: any) =>
          sk?.spec &&
          typeof sk.spec === "object" &&
          (sk.spec["티켓 종류"] || sk.spec["Ticket Type"] || sk.spec["ticket_type"])
      ) ?? null;
    if (skuWithSpec) {
      const ticketType =
        skuWithSpec.spec["티켓 종류"] ?? skuWithSpec.spec["Ticket Type"] ?? skuWithSpec.spec["ticket_type"] ?? "";
      if (unit) return `${ticketType} ${count}${unit}`;
      return `${ticketType} ${count}명`;
    }
    if (unit) return `${count}${unit}`;
    return `인원수 ${count}명`;
  }

  // fallback to listItem.skus
  if (listItem && Array.isArray(listItem.skus) && listItem.skus.length > 0) {
    const count = listItem.skus.reduce((s: number, sk: any) => s + (Number(sk?.qty ?? 1) || 0), 0);
    // no unit known here => generic "개"
    return `${count}개`;
  }

  // last resort
  return "1명";
}

export default function MyReservation() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [merged, setMerged] = useState<MergedBooking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const listUrl = `${(import.meta as any).env.API_ROUTE_RELEASE}/bookingProduct/list`;
        const listResp = await axiosAuth.get(listUrl);
        const listData: BookingItem[] = Array.isArray(listResp?.data)
          ? listResp.data
          : listResp?.data?.data ?? [];

        const mergedResults: MergedBooking[] = [];

        for (const listItem of listData) {
          const orderNo = listItem.order_no;
          if (!orderNo) {
            mergedResults.push({ listItem });
            continue;
          }

          const infoUrl = `${(import.meta as any).env.API_ROUTE_RELEASE}/kkday/Order/QueryOrderDtlInfo/${encodeURIComponent(
            orderNo
          )}`;
          const dtlUrl = `${(import.meta as any).env.API_ROUTE_RELEASE}/kkday/Order/QueryOrderDtl/${encodeURIComponent(
            orderNo
          )}`;

          try {
            const [infoResp, dtlResp] = await Promise.all([
              axiosAuth.get(infoUrl),
              axiosAuth.get(dtlUrl),
            ]);

            const dtlInfo: DtlInfoRaw = infoResp?.data ?? infoResp;
            const dtl: DtlRaw = dtlResp?.data ?? dtlResp;

            mergedResults.push({ listItem, dtlInfo, dtl });
          } catch (e: any) {
            console.error("Failed to fetch detail for order:", orderNo, e);
            mergedResults.push({ listItem });
          }
        }

        if (!mounted) return;
        setMerged(mergedResults);
      } catch (e: any) {
        console.error("MyReservation fetch error:", e);
        if (mounted) setError(e?.message ?? "데이터를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // group merged items by month
  const sections = useMemo(() => {
    if (!Array.isArray(merged) || merged.length === 0) return [];
    const sorted = [...merged].sort((a, b) => {
      const da = a.listItem?.s_date ? new Date(a.listItem.s_date).getTime() : 0;
      const db = b.listItem?.s_date ? new Date(b.listItem.s_date).getTime() : 0;
      return db - da;
    });
    const map = new Map<string, MergedBooking[]>();
    for (const m of sorted) {
      const keyDate = m.listItem.s_date ?? m.listItem.created_at ?? "";
      const month = formatMonthTitle(keyDate) || "기타";
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(m);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [merged]);

  function onVoucher(order_no?: string) {
    if (!order_no) {
      Alert.alert("바우처 없음", "바우처 정보가 존재하지 않습니다.");
      return;
    }
    navigation.navigate("/reservation/voucher", { order_no });
  }

  function onDetail(m: MergedBooking) {
    navigation.navigate("/reservation/detail", {
      order_no: m.listItem.order_no,
      dtl: m.dtl,
      dtlInfo: m.dtlInfo,
      listItem: m.listItem,
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue500} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FixedBottomCTAProvider>
        <Top.Root
          title={
            <Top.TitleParagraph typography="t3" color={colors.grey900}>
              내 예약
            </Top.TitleParagraph>
          }
        />
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.listItem._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text typography="t6" color={colors.grey700}>
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item: m }) => {
            const item = m.listItem;
            const dtlInfo = m.dtlInfo;
            const dtl = m.dtl;

            const dateText = formatDateYMD(item.s_date ?? item.created_at);

            const timeText =
              (dtl && (dtl?.time || dtl?.event_time || dtl?.start_time)) ??
              item.event_time ??
              "";

            // build people text using helper
            const peopleText = buildPeopleTextFromDtl(dtl, item);

            const titleText =
              (dtlInfo && (dtlInfo?.product_summary?.prod_name ?? dtlInfo?.product_summary?.prod_name)) ??
              item.order_note ??
              "투어";
            const descText =
              (dtlInfo && (dtlInfo?.product_summary?.prod_desc ?? dtlInfo?.product_summary?.prod_desc)) ??
              (item.order_note ?? "");

            const past = isPastDate(item.s_date ?? item.created_at);
            const hasVoucher = Boolean(dtl?.has_voucher);

            const dayLabel = (() => {
              if (!item.s_date) return "";
              const target = new Date(item.s_date);
              target.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 3600 * 1000));
              if (diffDays > 0) return `D-${diffDays}`;
              if (diffDays === 0) return "D-DAY";
              return "END";
            })();

            const badgeVariant = (() => {
              if (!item.s_date) return "dark";
              const target = new Date(item.s_date);
              target.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 3600 * 1000));
              if (diffDays === 0) return "yellow";
              if (diffDays > 0) return "blue";
              return "dark";
            })();

            const badgeTypeProp = badgeVariant;
            const badgeKey = item.order_no ? `badge_${item.order_no}` : `badge_${item._id}`;

            return (
              <View style={[styles.cardWrap, past && styles.cardWrapPast]}>
                <View style={styles.cardHeader}>
                  <Badge key={badgeKey} size="small" badgeStyle="weak" type={badgeTypeProp}>
                    {dayLabel}
                  </Badge>

                  <Text typography="t4" fontWeight="bold" style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                    {titleText}
                  </Text>
                </View>

                <Text typography="t7" color={colors.grey500} style={styles.cardDesc} numberOfLines={2}>
                  {descText}
                </Text>

                <View style={styles.grid2x2}>
                  <View style={styles.gridCell}>
                    <View style={styles.gridInner}>
                      <Icon name="icon-calendar-timetable" size={24} {...(past ? { color: colors.grey300 } : {})} />
                      <View style={{ width: 8 }} />
                      <Text style={styles.gridText}>{dateText}</Text>
                    </View>
                  </View>

                  <View style={styles.gridCell}>
                    <View style={styles.gridInner}>
                      <Icon name="icon-clock-blue-weak" size={24} {...(past ? { color: colors.grey300 } : {})} />
                      <View style={{ width: 8 }} />
                      <Text style={styles.gridText}>{timeText || "—"}</Text>
                    </View>
                  </View>

                  <View style={styles.gridCell}>
                    <View style={styles.gridInner}>
                      <Icon name="icon-user-two-blue-tab" size={24} {...(past ? { color: colors.grey300 } : {})} />
                      <View style={{ width: 8 }} />
                      <Text style={styles.gridText}>{peopleText}</Text>
                    </View>
                  </View>

                  <View style={styles.gridCell} />
                </View>

                <View style={styles.cardFooter}>
                  {hasVoucher ? (
                    <>
                      <TouchableOpacity style={[styles.footerButton, styles.footerButtonHalf]} onPress={() => onVoucher(item.order_no)}>
                        <Icon name="icon-ticket-gold" size={24} {...(past ? { color: colors.grey300 } : {})} />
                        <Text style={[styles.footerText, { marginLeft: 8 }]}>바우처</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.footerButton, styles.footerButtonHalf, { borderLeftWidth: 1, borderLeftColor: colors.grey200 }]}
                        onPress={() => onDetail(m)}
                      >
                        <Icon name="icon-document-won" size={18} {...(past ? { color: colors.grey300 } : {})} />
                        <Text style={[styles.footerText, { marginLeft: 8 }]}>예약 상세 내역</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={[styles.footerButton, { flex: 1 }]} onPress={() => onDetail(m)}>
                      <Icon name="icon-document-won" size={24} {...(past ? { color: colors.grey300 } : {})} />
                      <Text style={[styles.footerText, { marginLeft: 8 }]}>예약 상세 내역</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text color={colors.grey500}>예약 내역이 없습니다.</Text>
            </View>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerWrap: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 18 },
  sectionTitle: { color: colors.grey800 },
  cardWrap: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.grey200,
    elevation: 1,
  },
  cardWrapPast: {
    opacity: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 20, paddingTop: 20 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeActive: {
    backgroundColor: colors.blue50,
  },
  badgePast: {
    backgroundColor: colors.grey50,
  },
  cardTitle: { flex: 1, marginLeft: 12},
  cardDesc: { marginBottom: 12, color: colors.grey500, paddingHorizontal: 20 },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  gridCell: {
    width: "50%",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  gridInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridText: { color: colors.grey800 },
  cardFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.grey200,
    flexDirection: "row",
  },
  footerButton: { flexDirection: "row", alignItems: "center", paddingVertical: 20, paddingHorizontal: 18, justifyContent: "center" },
  footerButtonHalf: { flex: 1, alignItems: "center", justifyContent: "center" },
  footerText: { color: colors.grey700 },
});