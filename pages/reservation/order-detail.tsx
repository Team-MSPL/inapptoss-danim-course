import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { createRoute, useNavigation } from "@granite-js/react-native";
import {
  Top,
  Text,
  colors,
  FixedBottomCTAProvider,
  FixedBottomCTA,
} from "@toss-design-system/react-native";

export const Route = createRoute("/reservation/order-detail", {
  validateParams: (params) => params,
  component: ReservationOrderDetail,
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

export default function ReservationOrderDetail() {
  const navigation = useNavigation();
  const params = Route.useParams();

  const dtl = params?.dtl ?? {};

  const productPrice = Number(safe(dtl?.total_price ?? dtl?.total_pay ?? 0, 0));
  const paidAmount = Number(safe(dtl?.total_pay ?? dtl?.total_price ?? 0, 0));

  const explicitDiscount = Number(safe(dtl?.discount_price ?? dtl?.discount ?? 0, 0));
  const computedDiscount = productPrice > paidAmount ? productPrice - paidAmount : 0;
  const discount = explicitDiscount || computedDiscount || 0;

  const paymentLabel = dtl?.kkday_voucher_mode
    ? `${dtl.kkday_voucher_mode} / 일시불`
    : dtl?.payment_method ?? "결제 수단";

  const rawDate = safe(dtl?.order_date ?? dtl?.s_date ?? "", "");
  const orderDateDisplay = (() => {
    if (!rawDate) return "";

    const isoMatch = String(rawDate).match(/\d{4}[-./]\d{1,2}[-./]\d{1,2}/);
    if (isoMatch) return isoMatch[0].replace(/\./g, "-");
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = (`0${d.getMonth() + 1}`).slice(-2);
      const dd = (`0${d.getDate()}`).slice(-2);
      return `${yyyy}.${mm}.${dd}`;
    }
    return String(rawDate);
  })();

  return (
    <View style={styles.screen}>
      <FixedBottomCTAProvider>
        <Top.Root
          title={
            <Top.TitleParagraph typography="t3" color={colors.grey900}>
              주문 상세 내역
            </Top.TitleParagraph>
          }
        />

        <View style={styles.section}>
          <View style={styles.headingRow}>
            <View style={styles.headingAccent} />
            <Text typography="t4" fontWeight="medium" style={styles.headingText}>
              결제 정보
            </Text>
            <Text typography="t6" color={colors.grey600} style={styles.headingDate}>
              {orderDateDisplay}
            </Text>
          </View>

          <View style={styles.itemRow}>
            <Text typography="t6" color={colors.grey600}>
              상품 가격
            </Text>
            <Text typography="t6" color={colors.black}>
              {formatCurrency(productPrice)}
            </Text>
          </View>

          <View style={styles.itemRow}>
            <Text typography="t6" color={colors.grey600}>
              할인
            </Text>
            <Text typography="t6" color={colors.black}>
              {formatCurrency(discount)}
            </Text>
          </View>

          <View style={styles.thinDivider} />

          <View style={styles.itemRow}>
            <Text typography="t6" color={colors.grey600}>
              {paymentLabel}
            </Text>
            <Text typography="t6" color={colors.black}>
              {formatCurrency(productPrice - discount)}
            </Text>
          </View>

          <View style={{ height: 20 }} />

          <View style={styles.totalRow}>
            <Text typography="t5" fontWeight="bold">
              총 결제 금액
            </Text>
            <Text typography="t5" fontWeight="bold" color={'#5350FF'}>
              {formatCurrency(paidAmount)}
            </Text>
          </View>
        </View>

        <View style={{ height: 200 }} />

        <FixedBottomCTA onPress={() => navigation.goBack()} type="primary">
          이전으로
        </FixedBottomCTA>
      </FixedBottomCTAProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 32, paddingTop: 20 },
  section: { paddingHorizontal: 24, marginTop: 12 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headingAccent: {
    width: 6,
    height: 26,
    backgroundColor: colors.green200,
    borderRadius: 4,
    marginRight: 12,
  },
  headingText: {
    marginRight: 8,
  },
  headingDate: {
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  thinDivider: {
    height: 1,
    backgroundColor: colors.grey100,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalAmount: {
    color: "#3b5afe",
  },
});