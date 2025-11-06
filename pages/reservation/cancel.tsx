import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Pressable,
  FlatList,
} from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import {
  Top,
  Text,
  colors,
  FixedBottomCTAProvider,
  FixedBottomCTA,
  Button,
  Icon,
  useBottomSheet,
  BottomSheet,
} from "@toss-design-system/react-native";
import axiosAuth from "../../redux/api";
import MiniProductCard from "../../components/product/miniProductCard";

export const Route = createRoute("/reservation/cancel", {
  validateParams: (params) => params,
  component: ReservationCancel,
});

type DtlRaw = any;

function safe<T = any>(v: any, def: T): T {
  return v === undefined || v === null ? def : v;
}

function formatCurrency(n: number) {
  try {
    return `${Math.round(n).toLocaleString("ko-KR")}원`;
  } catch {
    return `${n}원`;
  }
}

export default function ReservationCancel() {
  const navigation = useNavigation();
  const params: {
    order_no?: string;
    dtl?: DtlRaw;
    dtlInfo?: any;
    listItem?: any;
  } = Route.useParams();

  const dtl = params?.dtl ?? {};
  const dtlInfo = params?.dtlInfo ?? {};
  const canCancel = Boolean(dtl?.can_cancel ?? false);

  // Cancellation reasons (5 items)
  const REASONS = [
    "예약 실수",
    "단순 변심",
    "여권/비자 문제",
    "개인 사정",
    "여행사 사정",
  ] as const;

  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // Bottom sheet helper (uses same pattern you provided)
  const bottomSheet = useBottomSheet();

  const openReasonSheet = () => {
    bottomSheet.open({
      children: (
        <View style={{ paddingVertical: 24 }}>
          <View style={{ paddingHorizontal: 24 }}>
            {REASONS.map((r) => (
              <Pressable
                key={r}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 20,
                }}
                onPress={() => {
                  setSelectedReason(r);
                  bottomSheet.close();
                }}
              >
                <Text typography="t5" fontWeight="medium" color={colors.grey700} style={{ flex: 1 }}>
                  {r}
                </Text>
                {selectedReason === r && <Icon name="icon-check-mono" color={colors.blue500} size={24} />}
              </Pressable>
            ))}
          </View>

          <BottomSheet.CTA onPress={() => bottomSheet.close()}>취소</BottomSheet.CTA>
        </View>
      ),
    });
  };

  // Refund policy extraction from dtlInfo -> PMDL_REFUND_POLICY
  const refundPolicy = useMemo(() => {
    try {
      const root = dtlInfo?.product_summary?.description_module_for_render ?? dtlInfo?.product_summary?.description_module;
      const policyModule = root?.PMDL_REFUND_POLICY;
      const content = policyModule?.content ?? policyModule;
      const props = content?.properties ?? {};
      const policyType = props?.policy_type;
      if (policyType) {
        if (typeof policyType === "string") return policyType;
        if (typeof policyType === "object" && typeof policyType.desc === "string") return policyType.desc;
        if (typeof policyType === "object" && typeof policyType.title === "string") return policyType.title;
      }
      if (policyModule?.module_title) return policyModule.module_title;
      return "취소 규정이 없습니다.";
    } catch {
      return "취소 규정이 없습니다.";
    }
  }, [dtlInfo]);

  // amounts
  const totalPrice = Number(safe(dtl?.total_price ?? dtl?.total_pay ?? 0, 0));
  const cancelFee = Number(safe(dtl?.cancel_fee ?? 0, 0));
  const refundAmount = Math.max(0, totalPrice - cancelFee);

  function onOrderDetail() {
    navigation.navigate("/reservation/order-detail", {
      order_no: params.order_no,
      dtl: params.dtl,
      dtlInfo: params.dtlInfo,
      listItem: params.listItem,
    });
  }

  function onPrev() {
    navigation.goBack();
  }

  // map selected reason label to cancel_type code
  const reasonToCancelType = (reason: string | null): string | null => {
    if (!reason) return null;
    switch (reason) {
      case "예약 실수":
        return "MC001";
      case "단순 변심":
        return "MC004";
      case "여권/비자 문제":
        return "MC999";
      case "개인 사정":
        return "MC004";
      case "여행사 사정":
        return "MC001";
      default:
        return "MC999";
    }
  };

  async function onConfirmCancel() {
    if (!canCancel) {
      Alert.alert("취소 불가", "이 상품은 취소할 수 없습니다.");
      return;
    }
    if (!selectedReason) {
      Alert.alert("취소 사유 선택", "취소 사유를 선택해 주세요.");
      return;
    }

    Alert.alert("예약 취소", "정말 예약을 취소하시겠습니까?", [
      { text: "아니오", style: "cancel" },
      {
        text: "예",
        onPress: async () => {
          const cancelType = reasonToCancelType(selectedReason);
          const body = {
            order_no: String(params.order_no ?? ""),
            cancel_type: cancelType ?? "",
            // send the chosen reason text as cancel_desc because the API requires a non-empty desc
            cancel_desc: selectedReason ?? "",
          };

          // Log the exact payload we will send
          console.log("[ReservationCancel] sending cancel body:", body);

          try {
            // Call cancel API
            const CANCEL_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Order/Cancel`;

            // Log headers we will use (for debugging header-related 400 cases)
            const headers = { "Content-Type": "application/json", Accept: "application/json" };
            console.log("[ReservationCancel] POST", CANCEL_API, "headers:", headers);

            // Send JSON explicitly (axios will stringify automatically, but logging the string helps)
            const bodyString = JSON.stringify(body);
            console.log("[ReservationCancel] POST bodyString:", bodyString);

            const res = await axiosAuth.post(CANCEL_API, bodyString, {
              headers,
            });

            // Log status and response body
            console.log("[ReservationCancel] Cancel response status:", res?.status);
            console.log("[ReservationCancel] Cancel response data:", res?.data);

            const data = res?.data ?? {};
            const ok = data?.result === "00" || data?.result === 0 || data?.success === true;
            if (ok) {
              console.log("[ReservationCancel] cancel succeeded, navigating to success screen");
              navigation.navigate("/reservation/cancel-success", { cancelResponse: data, email: params.dtl.buyer_email });
            } else {
              console.warn("[ReservationCancel] cancel returned failure payload, navigating to fail screen", data);
              navigation.navigate("/reservation/cancel-fail", { cancelResponse: data });
            }
          } catch (err: any) {
            const status = err?.response?.status;
            const respData = err?.response?.data;
            console.error("[ReservationCancel] Cancel API error - message:", err?.message);
            console.error("[ReservationCancel] Cancel API error - status:", status);
            console.error("[ReservationCancel] Cancel API error - response data:", respData);
            console.error("[ReservationCancel] Cancel API error - full error:", err);

            navigation.navigate("/reservation/cancel-fail", {
              error: String(err?.message ?? "Unknown error"),
              status,
              response: respData,
            });
          }
        },
      },
    ]);
  }

  // -------------------------
  // MiniProductCard: fetch product by prod_no from dtl and display above cancel reason
  // -------------------------
  const [product, setProduct] = useState<any | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchProduct(prodNo: number) {
      setProductLoading(true);
      try {
        const QUERY_PRODUCT_API = `${import.meta.env.API_ROUTE_RELEASE}/kkday/Product/QueryProduct`;
        const res = await axiosAuth.post(
          QUERY_PRODUCT_API,
          {
            prod_no: prodNo,
            locale: "kr",
            state: "KR",
          },
          { headers: { "Content-Type": "application/json" } }
        );
        const data = res?.data ?? {};
        const prod = data?.prod ?? null;
        console.log("[ReservationCancel] QueryProduct result prod:", prod);
        if (mounted) {
          if (prod) {
            // Choose first available image: prefer prod.img_list[0], then prod.prod_img_url, then prod.prod_img
            const firstImage =
              (Array.isArray(prod.img_list) && prod.img_list.length > 0 && prod.img_list[0]) ||
              prod.prod_img_url ||
              prod.prod_img ||
              "";

            const originPrice = prod.b2c_min_price ?? prod.b2c_price ?? 0;
            const salePrice = prod.b2b_min_price ?? prod.b2b_price ?? 0;
            const percent =
              originPrice > 0 && originPrice > salePrice
                ? Math.floor(100 - (salePrice / originPrice) * 100)
                : 0;

            // mini object uses 'image' key (not img_list)
            const mini = {
              image: firstImage,
              title: prod.prod_name ?? prod.prod_nm ?? "",
              originPrice,
              salePrice,
              percent,
              perPersonText: prod.unit ? String(prod.unit) : prod.introduction ?? "",
              // keep original raw prod too for debug if needed
              raw: prod,
            };
            setProduct(mini);
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        console.warn("[ReservationCancel] QueryProduct failed", err);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setProductLoading(false);
      }
    }

    const prodNo = Number(dtl?.prod_no ?? dtl?.prodNo ?? 0);
    if (prodNo > 0) {
      fetchProduct(prodNo);
    }
    return () => {
      mounted = false;
    };
  }, [dtl]);

  return (
    <View style={styles.screen}>
      <FixedBottomCTAProvider>
        <Top.Root
          title={
            <Top.TitleParagraph typography="t3" color={colors.grey900}>
              취소/환불
            </Top.TitleParagraph>
          }
        />

        <View style={styles.container}>
          {/* Mini product card (if available) */}
          {product ? (
            <View style={{ marginBottom: 16 }}>
              <MiniProductCard
                // Use product.image (set above). This avoids accessing undefined img_list.
                image={product.image ?? ""}
                title={product.title}
                originPrice={product.originPrice}
                salePrice={product.salePrice}
                percent={product.percent}
                perPersonText={product.perPersonText}
              />
            </View>
          ) : productLoading ? (
            <View style={{ height: 140, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Text typography="t7" color={colors.grey500}>상품 정보를 불러오는 중...</Text>
            </View>
          ) : null}

          {/* Section: 취소 사유 (uses bottom sheet selection) */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.headingAccent} />
              <Text typography="t4" fontWeight="medium" style={styles.sectionHeadingText}>
                취소 사유
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={styles.dropdown} onPress={openReasonSheet}>
              <Text typography="t7" color={selectedReason ? colors.grey900 : colors.grey500}>
                {selectedReason ?? "예약 취소 사유"}
              </Text>
              <Icon name="icon-chevron-down" size={20} />
            </TouchableOpacity>
          </View>

          {/* Section: 취소 규정 */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.headingAccent} />
              <Text typography="t4" fontWeight="medium" style={styles.sectionHeadingText}>
                취소 규정
              </Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text typography="t7" color={colors.grey700}>
                {refundPolicy}
              </Text>
            </View>
          </View>

          {/* Section: 주문 내역 (link) */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.headingAccent} />
              <Text typography="t4" fontWeight="medium" style={styles.sectionHeadingText}>
                주문 내역
              </Text>
            </View>

            <TouchableOpacity style={styles.linkRow} onPress={onOrderDetail}>
              <Text typography="t7" color={colors.grey700}>주문 내역 확인</Text>
              <Icon name="icon-chevron-right" size={18} />
            </TouchableOpacity>
          </View>

          {/* Section: 환불 안내 (total - cancelFee) */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.headingAccent} />
              <Text typography="t4" fontWeight="medium" style={styles.sectionHeadingText}>
                환불 안내
              </Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <View style={styles.amountRow}>
                <Text typography="t7" color={colors.grey700}>총금액</Text>
                <Text typography="t7" color={colors.black}>{formatCurrency(totalPrice)}</Text>
              </View>

              <View style={styles.amountRow}>
                <Text typography="t7" color={colors.grey700}>취소 수수료</Text>
                <Text typography="t7" color={colors.red400}>-{formatCurrency(cancelFee)}</Text>
              </View>

              <View style={{ height: 12 }} />

              <View style={styles.totalRow}>
                <Text typography="t5" fontWeight="bold">환불 금액</Text>
                <Text typography="t5" fontWeight="bold" style={styles.totalAmount}>
                  {formatCurrency(refundAmount)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>

        <FixedBottomCTA.Double
          containerStyle={{ backgroundColor: "white" }}
          leftButton={
            <Button type="dark" style="weak" display="block" onPress={onPrev}>
              이전으로
            </Button>
          }
          rightButton={
            <Button
              type="danger"
              display="block"
              onPress={onConfirmCancel}
              disabled={!canCancel || !selectedReason}
            >
              취소하기
            </Button>
          }
        />
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 20 },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  headingAccent: { width: 6, height: 26, backgroundColor: colors.green200, borderRadius: 4, marginRight: 12 },
  sectionHeadingText: {},
  dropdown: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grey100,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  totalAmount: { color: '#5350FF' },
});