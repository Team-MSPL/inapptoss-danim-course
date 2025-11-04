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
  skus?: Array<{ sku_id?: string; qty?: number; price?: number }>;
  order_note?: string;
  total_price?: number;
  isActive?: boolean;
  // original list item may contain other fields
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

            // determine people / ticket info + qty + unit
            let peopleText = "";
            let peopleCount = 0;
            let unitText = "";

            if (dtl && Array.isArray(dtl?.skus) && dtl?.skus.length > 0) {
              // aggregate quantity across skus
              peopleCount = dtl.skus.reduce((s: number, sk: any) => s + (Number(sk?.qty ?? 1) || 0), 0);
              unitText = dtl?.unit ?? "";

              // find ticket spec if exists
              const skuWithSpec = dtl.skus.find((sk: any) => sk?.spec && typeof sk.spec === "object" && sk.spec["티켓 종류"]);
              if (skuWithSpec) {
                const ticketType = skuWithSpec.spec["티켓 종류"];
                peopleText = unitText ? `${ticketType} ${peopleCount}${unitText}` : `${ticketType} ${peopleCount}명`;
              } else {
                peopleText = unitText ? `${peopleCount}${unitText}` : `인원수 ${peopleCount}명`;
              }
            } else if (Array.isArray(item.skus) && item.skus.length > 0) {
              peopleCount = item.skus.reduce((s, sk) => s + (Number(sk.qty ?? 1) || 0), 0);
              peopleText = `${peopleCount}개`;
            } else {
              peopleText = `1명`;
              peopleCount = 1;
            }

            const titleText =
              (dtlInfo && (dtlInfo?.product_summary?.prod_name ?? dtlInfo?.product_summary?.prod_name)) ??
              item.order_note ??
              "투어";
            const descText =
              (dtlInfo && (dtlInfo?.product_summary?.prod_desc ?? dtlInfo?.product_summary?.prod_desc)) ??
              (item.order_note ?? "");

            const past = isPastDate(item.s_date ?? item.created_at);
            const hasVoucher = Boolean(dtl?.has_voucher);

            // compute dayLabel and badge appearance
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
              if (diffDays === 0) return "yellow"; // today
              if (diffDays > 0) return "blue"; // future
              return "dark"; // past
            })();

            // map badgeVariant to toss Badge props if necessary
            // Here we assume Badge.type accepts strings like "yellow"/"blue"/"dark".
            // If your Badge API uses different names, map accordingly.
            const badgeTypeProp = badgeVariant; // use directly; adjust if badge uses different enum

            // stable key for Badge
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

                {/* 2x2 Grid: top-left date, top-right time, bottom-left people, bottom-right (empty / reserved) */}
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

                {/* Footer: buttons 1:1 width */}
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
  /* 2x2 grid */
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